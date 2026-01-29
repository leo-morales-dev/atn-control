"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logHistory } from "@/lib/logger" // Asegúrate de tener esto importado

export async function importProductsFromExcel(products: any[]) {
  let successCount = 0

  try {
    // -------------------------------------------------------------------------
    // PASO 1: VALIDACIÓN DE SEGURIDAD (DETECTAR DUPLICADOS ANTES DE PROCESAR)
    // -------------------------------------------------------------------------
    
    // Filtramos solo los productos que traen un código manual
    const codesToCheck = products
        .filter(p => p.CODIGO)
        .map(p => String(p.CODIGO).trim().toUpperCase().replace(/'/g, '-'));

    if (codesToCheck.length > 0) {
        // Buscamos si alguno de estos códigos YA existe en la base de datos
        const existingProducts = await prisma.product.findMany({
            where: {
                code: { in: codesToCheck }
            },
            select: { code: true, description: true }
        });

        // ¡ALERTA! Si encontramos coincidencias, BLOQUEAMOS TODA LA IMPORTACIÓN
        if (existingProducts.length > 0) {
            const duplicateList = existingProducts.map(p => `${p.code} (${p.description})`).join(", ");
            return { 
                success: false, 
                error: `IMPORTACIÓN DETENIDA: Se encontraron códigos QR que ya existen en el sistema. Para evitar sobrescribir datos, corrige tu Excel y vuelve a intentarlo.\n\nDuplicados encontrados: ${duplicateList}` 
            };
        }
    }

    // -------------------------------------------------------------------------
    // PASO 2: PROCESAMIENTO (SOLO SI NO HAY DUPLICADOS)
    // -------------------------------------------------------------------------
    for (const p of products) {
      if (!p.DESCRIPCION || !p.CATEGORIA) {
        continue
      }

      // Normalizar datos
      const code = p.CODIGO ? String(p.CODIGO).trim().toUpperCase().replace(/'/g, '-') // <--- CORRECCIÓN 
        : `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      const shortCode = p.CLAVE_PROV ? String(p.CLAVE_PROV).trim() : code
      const description = String(p.DESCRIPCION).trim()
      
      let category = String(p.CATEGORIA).trim()
      if (!['Herramienta', 'Consumible', 'EPP'].includes(category)) {
          category = 'Consumible'
      }

      const stock = parseInt(p.STOCK) || 0
      const minStock = parseInt(p.MINIMO) || 5

      // Como ya validamos arriba que NO existen duplicados, podemos usar create directamente con seguridad
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

      // --- HISTORIAL ---
      await logHistory({
          action: "INGRESO EXCEL",
          module: "INVENTARIO",
          description: `Alta masiva via Excel: ${description}`,
          details: `Stock Inicial: ${stock} | Categ: ${category} | Código: ${code}`
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