'use server'

import { parseStringPromise } from 'xml2js'
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export interface XmlItem {
  noIdentificacion: string 
  descripcion: string
  cantidad: number
  valorUnitario: number
  unidad?: string
  providerName?: string 
}

// 1. LEER XML Y DETECTAR DUPLICADOS POR CLAVE DE PROVEEDOR
export async function parseFacturaXML(formData: FormData) {
  const file = formData.get('xml') as File
  if (!file) return { success: false, error: "No se subió archivo" }

  try {
    const text = await file.text()
    const result = await parseStringPromise(text)
    
    const comprobante = result['cfdi:Comprobante']
    const emisorData = comprobante['cfdi:Emisor']?.[0]?.['$']
    const providerName = emisorData?.Nombre || "Proveedor Desconocido"

    // Extracción de conceptos
    const conceptos = comprobante['cfdi:Conceptos'][0]['cfdi:Concepto']
    const items: XmlItem[] = []
    const codesInXml: string[] = []

    for (const c of conceptos) {
      const attrs = c['$'] 
      const code = attrs.NoIdentificacion || attrs.ClaveProdServ || 'S/N'
      
      items.push({
        noIdentificacion: code,
        descripcion: attrs.Descripcion,
        cantidad: parseFloat(attrs.Cantidad),
        valorUnitario: parseFloat(attrs.ValorUnitario),
        unidad: attrs.Unidad || attrs.ClaveUnidad,
        providerName: providerName
      })
      
      if (code && code !== 'S/N') {
          codesInXml.push(code)
      }
    }

    // --- NUEVA LÓGICA DE DUPLICADOS (Por Clave de Proveedor) ---
    // Verificamos si alguna de las claves del XML ya existe en la base de datos
    let isDuplicate = false
    let duplicateDetails = ""

    if (codesInXml.length > 0) {
        // Buscamos en la tabla de claves de proveedor
        const existingKey = await prisma.supplierCode.findFirst({
            where: {
                code: { in: codesInXml }
            },
            include: { product: true } // Traemos el producto para mostrar su nombre
        })

        if (existingKey) {
            isDuplicate = true
            duplicateDetails = `Clave encontrada: ${existingKey.code} (Producto: ${existingKey.product.description})`
        }
    }

    // Buscamos sugerencias para vincular (Match)
    const itemsWithSuggestions = await Promise.all(items.map(async (item) => {
      const match = await prisma.product.findFirst({
        where: {
            OR: [
                { code: item.noIdentificacion },
                { supplierCodes: { some: { code: item.noIdentificacion } } },
                { shortCode: item.noIdentificacion } // También buscamos en shortCode directo
            ]
        }
      })
      return { ...item, suggestedProduct: match }
    }))

    return { 
        success: true, 
        data: {
            items: itemsWithSuggestions,
            invoiceInfo: {
                uuid: "N/A", // Ya no usamos el UUID para bloquear
                isDuplicate: isDuplicate,
                provider: providerName,
                details: duplicateDetails // Enviamos detalle de qué clave causó la alerta
            }
        } 
    }

  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al leer el XML. Estructura no válida." }
  }
}

// 2. GUARDAR DATOS (Sin registro de UUID en Historial)
export async function processXmlImport(payload: { items: any[], invoiceUuid?: string }) {
  const { items } = payload; 

  try {
    await prisma.$transaction(async (tx) => {
      
      // NOTA: Eliminamos el bloque que guardaba 'XML_IMPORT_RECORD' en SystemLog
      // para no bloquear futuras importaciones basadas en UUID.

      for (const item of items) {
        
        const newCode = item.shortCode || item.code
        const provider = item.providerName || "Proveedor General"
        
        let logDescription = ""
        let systemCode = item.code 

        if (item.action === 'create') {
          // --- CREAR ---
          await tx.product.create({
            data: {
              code: item.code,
              description: item.description,
              category: item.category,
              stock: item.quantity,
              minStock: item.minStock || 5,
              shortCode: newCode, 
              supplierCodes: {
                create: {
                    code: newCode,
                    provider: provider
                }
              }
            }
          })
          logDescription = `Alta Nueva (XML): ${item.description}`

        } else if (item.action === 'link' && item.linkedProductId) {
          // --- VINCULAR ---
          const prodId = item.linkedProductId
          
          const existingKey = await tx.supplierCode.findFirst({
              where: { productId: prodId, code: newCode }
          })

          if (!existingKey && newCode) {
              await tx.supplierCode.create({
                  data: { productId: prodId, code: newCode, provider: provider }
              })
          }

          const currentProd = await tx.product.findUnique({ where: { id: prodId } })
          if (currentProd) {
             systemCode = currentProd.code

             let updatedShortCode = currentProd.shortCode || ""
             if (newCode && !updatedShortCode.includes(newCode)) {
                 updatedShortCode = updatedShortCode ? `${updatedShortCode} / ${newCode}` : newCode
             }

             await tx.product.update({
                where: { id: prodId },
                data: {
                  stock: { increment: item.quantity },
                  shortCode: updatedShortCode
                }
             })
             
             logDescription = `Sumado a Stock (XML): ${currentProd.description}`
          }
        }

        if (logDescription) {
            await tx.systemLog.create({
                data: {
                    action: "INGRESO XML",
                    module: "INVENTARIO",
                    description: logDescription,
                    details: `Cant: +${item.quantity} | Código: ${systemCode} | Prov: ${provider}`
                }
            })
        }
      }
    })

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al procesar importación." }
  }
}