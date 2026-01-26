'use server'

import { parseStringPromise } from 'xml2js'
import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// Estructura de lo que extraemos del XML
export interface XmlItem {
  noIdentificacion: string // Código del proveedor
  descripcion: string
  cantidad: number
  valorUnitario: number
  unidad?: string
}

// 1. LEER XML Y BUSCAR COINCIDENCIAS
export async function parseFacturaXML(formData: FormData) {
  const file = formData.get('xml') as File
  if (!file) return { success: false, error: "No se subió archivo" }

  try {
    const text = await file.text()
    const result = await parseStringPromise(text)
    
    // Navegamos la estructura compleja del CFDI
    const comprobante = result['cfdi:Comprobante']
    const conceptos = comprobante['cfdi:Conceptos'][0]['cfdi:Concepto']

    const items: XmlItem[] = []

    // Extraemos datos limpios
    for (const c of conceptos) {
      const attrs = c['$'] // En xml2js los atributos están en '$'
      items.push({
        noIdentificacion: attrs.NoIdentificacion || attrs.ClaveProdServ || 'S/N',
        descripcion: attrs.Descripcion,
        cantidad: parseFloat(attrs.Cantidad),
        valorUnitario: parseFloat(attrs.ValorUnitario),
        unidad: attrs.Unidad || attrs.ClaveUnidad
      })
    }

    // Buscamos candidatos en la BD para sugerir vínculos
    const itemsWithSuggestions = await Promise.all(items.map(async (item) => {
      // Buscamos si ya existe un producto con ese código exacto
      const match = await prisma.product.findFirst({
        where: {
            OR: [
                { code: item.noIdentificacion },
                { shortCode: item.noIdentificacion }
            ]
        }
      })
      
      return {
        ...item,
        suggestedProduct: match // Enviamos el producto completo si lo encontramos
      }
    }))

    return { success: true, data: itemsWithSuggestions }

  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al leer el XML. Asegúrate que sea un CFDI válido." }
  }
}

// 2. GUARDAR LOS DATOS CONFIRMADOS

export async function processXmlImport(items: any[]) {
  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        
        if (item.action === 'create') {
          // CASO 1: CREAR NUEVO (Sin cambios)
          await tx.product.create({
            data: {
              code: item.code,
              description: item.description,
              category: item.category,
              stock: item.quantity,
              minStock: item.minStock || 5,
              shortCode: item.shortCode || item.code 
            }
          })

        } else if (item.action === 'link' && item.linkedProductId) {
          // CASO 2: VINCULAR (MEJORADO)
          
          // A. Primero buscamos el producto para ver qué claves tiene hoy
          const currentProd = await tx.product.findUnique({
             where: { id: item.linkedProductId }
          })

          if (currentProd) {
             // B. Lógica de Concatenación
             let updatedShortCode = currentProd.shortCode || ""
             const newProviderCode = item.shortCode || "" // Esta es la clave del XML nuevo (ej. PROV2)

             // Solo la agregamos si NO existe ya en el texto
             // (Así evitamos que diga "PROV1 / PROV1 / PROV1" si subes la misma factura 3 veces)
             if (newProviderCode && !updatedShortCode.includes(newProviderCode)) {
                 updatedShortCode = updatedShortCode 
                    ? `${updatedShortCode} / ${newProviderCode}` // Si ya había algo, agregamos " / "
                    : newProviderCode // Si estaba vacío, ponemos la nueva
             }

             // C. Actualizamos Stock Y las Claves
             await tx.product.update({
                where: { id: item.linkedProductId },
                data: {
                  stock: { increment: item.quantity },
                  shortCode: updatedShortCode // <--- AQUÍ GUARDAMOS LA LISTA COMBINADA
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
    return { success: false, error: "Error al procesar la importación." }
  }
}