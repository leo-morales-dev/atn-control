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
  providerName?: string // <--- Nuevo: Guardaremos el nombre del proveedor
}

// 1. LEER XML (Ahora extrae el Proveedor)
export async function parseFacturaXML(formData: FormData) {
  const file = formData.get('xml') as File
  if (!file) return { success: false, error: "No se subió archivo" }

  try {
    const text = await file.text()
    const result = await parseStringPromise(text)
    
    const comprobante = result['cfdi:Comprobante']
    // Extraemos el nombre del emisor (Proveedor) del XML
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
        providerName: providerName // Pasamos el proveedor a cada item
      })
    }

    const itemsWithSuggestions = await Promise.all(items.map(async (item) => {
      const match = await prisma.product.findFirst({
        where: {
            OR: [
                { code: item.noIdentificacion },
                // Buscamos también en la nueva tabla de claves
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

// 2. GUARDAR DATOS (Lógica corregida para SupplierCode)
export async function processXmlImport(items: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        
        // Clave del proveedor actual en el XML
        const newCode = item.shortCode || item.code
        const provider = item.providerName || "Proveedor General"

        if (item.action === 'create') {
          // --- CASO 1: CREAR ---
          await tx.product.create({
            data: {
              code: item.code,
              description: item.description,
              category: item.category,
              stock: item.quantity,
              minStock: item.minStock || 5,
              shortCode: newCode, 
              // AQUÍ ESTÁ LA MAGIA: Creamos la relación inicial
              supplierCodes: {
                create: {
                    code: newCode,
                    provider: provider
                }
              }
            }
          })

        } else if (item.action === 'link' && item.linkedProductId) {
          // --- CASO 2: VINCULAR ---
          const prodId = item.linkedProductId
          
          // A. Verificar si esta clave ya existe para este producto
          const existingKey = await tx.supplierCode.findFirst({
              where: { 
                  productId: prodId,
                  code: newCode
              }
          })

          // B. Si no existe, la creamos en la tabla SupplierCode
          if (!existingKey && newCode) {
              await tx.supplierCode.create({
                  data: {
                      productId: prodId,
                      code: newCode,
                      provider: provider
                  }
              })
          }

          // C. Actualizar Stock y Texto "shortCode" (para búsqueda rápida visual)
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
          }
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