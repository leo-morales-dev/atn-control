"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logHistory } from "@/lib/logger" // Asegúrate de tener esto importado

export async function importProductsFromExcel(products: any[]) {
  let successCount = 0

  try {
    // -------------------------------------------------------------------------
    // PASO 1: VALIDACIÓN DE SEGURIDAD
    // -------------------------------------------------------------------------
    const codesToCheck = products
        .filter(p => p.CODIGO)
        .map(p => String(p.CODIGO).trim().toUpperCase().replace(/'/g, '-'));

    if (codesToCheck.length > 0) {
        const existingProducts = await prisma.product.findMany({
            where: { code: { in: codesToCheck } },
            select: { code: true, description: true }
        });

        if (existingProducts.length > 0) {
            const duplicateList = existingProducts.map(p => `${p.code} (${p.description})`).join(", ");
            return { 
                success: false, 
                error: `IMPORTACIÓN DETENIDA: Códigos duplicados encontrados: ${duplicateList}` 
            };
        }
    }

    // -------------------------------------------------------------------------
    // PASO 2: PROCESAMIENTO
    // -------------------------------------------------------------------------
    for (const p of products) {
      if (!p.DESCRIPCION || !p.CATEGORIA) {
        continue
      }

      // Normalizar datos básicos
      const code = p.CODIGO ? String(p.CODIGO).trim().toUpperCase().replace(/'/g, '-') 
        : `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      
      const shortCode = p.CLAVE_PROV ? String(p.CLAVE_PROV).trim() : code
      const description = String(p.DESCRIPCION).trim()
      
      // NUEVO: Leemos el nombre del proveedor
      // Si no viene en el Excel, ponemos uno genérico o lo dejamos vacío
      const providerName = p.PROVEEDOR ? String(p.PROVEEDOR).trim() : "Proveedor Excel"

      let category = String(p.CATEGORIA).trim()
      if (!['Herramienta', 'Consumible', 'EPP'].includes(category)) {
          category = 'Consumible'
      }

      const stock = parseInt(p.STOCK) || 0
      const minStock = parseInt(p.MINIMO) || 5

      // CREACIÓN DEL PRODUCTO + RELACIÓN CON PROVEEDOR
      await prisma.product.create({
        data: {
            code,
            shortCode, // Clave del proveedor (ej. DCD7781D2)
            description,
            category,
            stock,
            minStock,
            // AQUÍ ESTÁ LA MAGIA: Creamos la relación en SupplierCode
            supplierCodes: {
                create: {
                    code: shortCode,      // La clave del proveedor
                    provider: providerName // El NOMBRE del proveedor (Nuevo)
                }
            }
        }
      })

      // --- HISTORIAL ---
      await logHistory({
          action: "INGRESO EXCEL",
          module: "INVENTARIO",
          description: `Alta Excel: ${description}`,
          // Guardamos también el proveedor en el log
          details: `Stock: ${stock} | Categ: ${category} | Cod: ${code} | Prov: ${providerName}`
      })

      successCount++
    }

    revalidatePath("/inventory")
    return { success: true, count: successCount }

  } catch (error) {
    console.error("Error importando Excel:", error)
    return { success: false, error: "Ocurrió un error interno al procesar el archivo." }
  }
}