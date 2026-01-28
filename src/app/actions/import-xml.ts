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

// 1. LEER XML (Sin cambios)
export async function parseFacturaXML(formData: FormData) {
  const file = formData.get('xml') as File
  if (!file) return { success: false, error: "No se subió archivo" }

  try {
    const text = await file.text()
    const result = await parseStringPromise(text)
    
    const comprobante = result['cfdi:Comprobante']
    const emisorData = comprobante['cfdi:Emisor']?.[0]?.['$']
    const providerName = emisorData?.Nombre || "Proveedor Desconocido"

    const conceptos = comprobante['cfdi:Conceptos'][0]['cfdi:Concepto']
    const items: XmlItem[] = []

    for (const c of conceptos) {
      const attrs = c['$'] 
      items.push({
        noIdentificacion: attrs.NoIdentificacion || attrs.ClaveProdServ || 'S/N',
        descripcion: attrs.Descripcion,
        cantidad: parseFloat(attrs.Cantidad),
        valorUnitario: parseFloat(attrs.ValorUnitario),
        unidad: attrs.Unidad || attrs.ClaveUnidad,
        providerName: providerName
      })
    }

    const itemsWithSuggestions = await Promise.all(items.map(async (item) => {
      const match = await prisma.product.findFirst({
        where: {
            OR: [
                { code: item.noIdentificacion },
                { supplierCodes: { some: { code: item.noIdentificacion } } } 
            ]
        }
      })
      
      return { ...item, suggestedProduct: match }
    }))

    return { success: true, data: itemsWithSuggestions }

  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al leer el XML. Estructura no válida." }
  }
}

// 2. GUARDAR DATOS (Con Historial Detallado por Ítem)
export async function processXmlImport(items: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        
        const newCode = item.shortCode || item.code
        const provider = item.providerName || "Proveedor General"
        let logDescription = ""

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

        // --- REGISTRO INDIVIDUAL EN HISTORIAL ---
        // Esto crea un renglón en la tabla SystemLog por CADA producto del bucle
        if (logDescription) {
            await tx.systemLog.create({
                data: {
                    action: "INGRESO XML",
                    module: "INVENTARIO",
                    description: logDescription,
                    details: `Cant: +${item.quantity} | Código: ${newCode} | Prov: ${provider}`
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