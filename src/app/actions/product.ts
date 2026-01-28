'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener estadísticas (Ignorando archivados)
export async function getInventoryStats() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false }, // <--- Solo activos
      select: {
        category: true,
        stock: true,
        minStock: true
      }
    })

    const total = products.length
    const tools = products.filter(p => p.category === 'Herramienta').length
    const consumables = products.filter(p => p.category === 'Consumible').length
    const lowStock = products.filter(p => p.stock <= p.minStock).length

    return {
      success: true,
      data: { total, tools, consumables, lowStock }
    }
  } catch (error) {
    return { success: false, error: "Error al cargar estadísticas" }
  }
}

// 2. Obtener productos (Filtrando archivados)
export async function getProducts(query: string = "", filter: string = "all") {
  try {
    const where: any = {
        isArchived: false, // <--- IMPORTANTE: Nunca mostrar los borrados
        OR: [
          { description: { contains: query } },
          { code: { contains: query } }
        ]
    }

    if (filter === 'Herramienta' || filter === 'Consumible' || filter === 'EPP') {
        where.category = filter
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { id: 'desc' }
    })

    let finalProducts = products
    if (filter === 'low_stock') {
        finalProducts = products.filter(p => p.stock <= p.minStock)
    }

    return { success: true, data: finalProducts }
  } catch (error) {
    return { success: false, error: "Error al cargar productos" }
  }
}

// 3. NUEVO: Borrado Lógico (Archivar)
export async function deleteProducts(filter: string = "all") {
  try {
    let where: any = { isArchived: false } // Solo afectar a los que están vivos

    // Definir a quién vamos a "borrar"
    if (filter === 'Herramienta' || filter === 'Consumible' || filter === 'EPP') {
      where.category = filter
    } else if (filter === 'low_stock') {
      const allProducts = await prisma.product.findMany({ where: { isArchived: false }})
      const idsToDelete = allProducts
        .filter(p => p.stock <= p.minStock)
        .map(p => p.id)
      where.id = { in: idsToDelete }
    }

    // EN LUGAR DE DELETE, HACEMOS UPDATE
    await prisma.product.updateMany({
      where,
      data: {
        isArchived: true, // Lo marcamos como borrado
        stock: 0          // Ponemos stock en 0 para que no cuente
      }
    })

    // NO borramos préstamos ni incidentes. El historial queda a salvo.

    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar productos." }
  }
}

// ... Las funciones createProduct y updateProduct se quedan igual ...
// (Asegúrate de dejarlas en el archivo como estaban)
// Solo recuerda que al Crear, no necesitamos tocar isArchived (por defecto es false)

export async function updateProduct(id: number, formData: FormData) {
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const stockRaw = formData.get("stock") as string
    const minStockRaw = formData.get("minStock") as string
    
    const stock = stockRaw ? parseInt(stockRaw) : 0
    const minStock = minStockRaw ? parseInt(minStockRaw) : 5
  
    if (!code || !description || !category) {
      return { success: false, error: "Faltan datos obligatorios" }
    }
  
    try {
      await prisma.product.update({
        where: { id },
        data: { code, description, category, stock, minStock }
      })
      
      revalidatePath("/inventory")
      revalidatePath("/") 
      return { success: true }
    } catch (error) {
      return { success: false, error: "Error al actualizar." }
    }
}
  
export async function createProduct(formData: FormData) {
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const stockRaw = formData.get("stock") as string
    const minStockRaw = formData.get("minStock") as string
    
    const stock = stockRaw ? parseInt(stockRaw) : 0
    const minStock = minStockRaw ? parseInt(minStockRaw) : 5
  
    try {
      await prisma.product.create({
        data: {
          code,
          description,
          category,
          stock,
          minStock,
          shortCode: code 
        }
      })
      revalidatePath("/inventory")
      return { success: true }
    } catch (error) {
      return { success: false, error: "Error al crear producto" }
    }
}

// NUEVA: Borrar un solo producto por ID (Borrado Lógico)
export async function deleteProductById(id: number) {
  try {
    await prisma.product.update({
      where: { id },
      data: { 
        isArchived: true, // Lo ocultamos
        stock: 0          // Stock a 0 para que no cuente en sumas
      }
    })
    
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar el producto." }
  }
}

// --- FUNCIÓN A REEMPLAZAR ---
export async function createOrUpdateProduct(data: FormData) {
  const mode = data.get("mode") as string 
  const quantity = parseInt(data.get("quantity") as string) || 0
  const providerKey = data.get("shortCode") as string || "" 

  try {
    if (mode === "link") {
      // --- VINCULAR (Manual) ---
      const productId = parseInt(data.get("linkedProductId") as string)
      const currentProd = await prisma.product.findUnique({ where: { id: productId } })
      
      if (!currentProd) throw new Error("Producto no encontrado")

      // 1. Guardar en SupplierCode si es una clave nueva
      if (providerKey) {
          const existing = await prisma.supplierCode.findFirst({
              where: { productId, code: providerKey }
          })
          
          if (!existing) {
              await prisma.supplierCode.create({
                  data: {
                      productId,
                      code: providerKey,
                      provider: "Ingreso Manual" 
                  }
              })
          }
      }

      // 2. Actualizar stock y visual
      let updatedShortCode = currentProd.shortCode || ""
      if (providerKey && !updatedShortCode.includes(providerKey)) {
          updatedShortCode = updatedShortCode ? `${updatedShortCode} / ${providerKey}` : providerKey
      }

      await prisma.product.update({
        where: { id: productId },
        data: {
          stock: { increment: quantity },
          shortCode: updatedShortCode
        }
      })

    } else {
      // --- CREAR NUEVO (Manual) ---
      const code = data.get("code") as string
      const description = data.get("description") as string
      const category = data.get("category") as string
      const minStock = parseInt(data.get("minStock") as string) || 5

      await prisma.product.create({
        data: {
          code,
          description,
          category,
          stock: quantity,
          minStock,
          shortCode: providerKey,
          // Creamos la relación aquí también
          supplierCodes: {
              create: providerKey ? [{ code: providerKey, provider: "Ingreso Manual" }] : []
          }
        }
      })
    }

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al procesar el ingreso." }
  }
}