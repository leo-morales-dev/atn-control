"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function importProductsFromExcel(products: any[]) {
  let successCount = 0
  let errorCount = 0

  try {
    for (const p of products) {
      // Validar datos mínimos
      if (!p.DESCRIPCION || !p.CATEGORIA) {
        errorCount++
        continue
      }

      // Normalizar datos
      const code = p.CODIGO ? String(p.CODIGO).trim() : `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`
      const shortCode = p.CLAVE_PROV ? String(p.CLAVE_PROV).trim() : code
      const description = String(p.DESCRIPCION).trim()
      
      // Validar categoría (si viene mal escrita, ponemos por defecto Consumible)
      let category = String(p.CATEGORIA).trim()
      if (!['Herramienta', 'Consumible', 'EPP'].includes(category)) {
          category = 'Consumible' // Fallback seguro
      }

      const stock = parseInt(p.STOCK) || 0
      const minStock = parseInt(p.MINIMO) || 5

      // Buscamos si ya existe por CÓDIGO o por CLAVE DE PROVEEDOR para actualizar en vez de duplicar
      const existing = await prisma.product.findFirst({
        where: {
            OR: [
                { code: code },
                { shortCode: shortCode }
            ]
        }
      })

      if (existing) {
        // Actualizamos stock
        await prisma.product.update({
            where: { id: existing.id },
            data: {
                stock: stock, // Sobrescribimos con el inventario real del Excel
                description: description, // Actualizamos descripción por si mejoró
                isArchived: false // Lo revivimos si estaba borrado
            }
        })
      } else {
        // Creamos nuevo
        await prisma.product.create({
            data: {
                code,
                shortCode,
                description,
                category,
                stock,
                minStock
            }
        })
      }
      successCount++
    }

    revalidatePath("/inventory")
    return { success: true, count: successCount, errors: errorCount }

  } catch (error) {
    console.error("Error importando Excel:", error)
    return { success: false, error: "Error interno al procesar datos." }
  }
}