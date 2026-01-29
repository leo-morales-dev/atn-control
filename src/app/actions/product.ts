'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logHistory } from "@/lib/logger"

// 1. Obtener estadísticas
export async function getInventoryStats() {
  try {
    const products = await prisma.product.findMany({
      where: { isArchived: false },
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

// 2. Obtener productos
export async function getProducts(query: string = "", filter: string = "all") {
  try {
    const where: any = {
        isArchived: false,
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

// 3. Borrado Lógico Masivo
export async function deleteProducts(filter: string = "all") {
  try {
    let where: any = { isArchived: false }

    if (filter === 'Herramienta' || filter === 'Consumible' || filter === 'EPP') {
      where.category = filter
    } else if (filter === 'low_stock') {
      const allProducts = await prisma.product.findMany({ where: { isArchived: false }})
      const idsToDelete = allProducts
        .filter(p => p.stock <= p.minStock)
        .map(p => p.id)
      where.id = { in: idsToDelete }
    }

    await prisma.product.updateMany({
      where,
      data: {
        isArchived: true,
        stock: 0
      }
    })

    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar productos." }
  }
}

// 4. ACTUALIZAR PRODUCTO (CORREGIDA)
export async function updateProduct(formData: FormData) {
    // CORRECCIÓN: Leemos el ID desde el FormData
    const id = parseInt(formData.get("id") as string)
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const minStockRaw = formData.get("minStock") as string
    const shortCode = formData.get("shortCode") as string // Ref. Proveedor
    
    const minStock = minStockRaw ? parseInt(minStockRaw) : 5
  
    if (!id || !code || !description || !category) {
      return { success: false, error: "Faltan datos obligatorios" }
    }
  
    try {
      await prisma.product.update({
        where: { id },
        data: { 
            code, 
            description, 
            category, 
            minStock,
            shortCode: shortCode || null
            // NOTA: No actualizamos 'stock' aquí para evitar resetearlo a 0 accidentalmente
        }
      })
      
      revalidatePath("/inventory")
      revalidatePath("/") 
      return { success: true }
    } catch (error: any) {
      // Detección de error de unicidad (P2002 en Prisma)
      if (error.code === 'P2002') {
          return { success: false, error: "Unique constraint violation" }
      }
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

export async function deleteProductById(id: number) {
  try {
    await prisma.product.update({
      where: { id },
      data: { 
        isArchived: true, 
        stock: 0          
      }
    })
    
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar el producto." }
  }
}

export async function createOrUpdateProduct(data: FormData) {
  const mode = data.get("mode") as string 
  const quantity = parseInt(data.get("quantity") as string) || 0
  const providerKey = data.get("shortCode") as string || "" 
  // NUEVO: Leemos el nombre del proveedor. Si está vacío, ponemos uno por defecto.
  const providerName = (data.get("providerName") as string) || "Ingreso Manual"

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
                      provider: providerName // <-- AQUÍ GUARDAMOS EL PROVEEDOR
                  }
              })
          }
      }

      // 2. Actualizar stock y visual
      let updatedShortCode = currentProd.shortCode || ""
      // Si la clave es nueva y no está en el string visual, la agregamos
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

      // --- REGISTRAR HISTORIAL (Log) ---
      await logHistory({
        action: "INGRESO MANUAL (SUMA)",
        module: "INVENTARIO",
        description: `Se sumaron ${quantity} unidades a: ${currentProd.description}`,
        // Agregamos el proveedor al log también
        details: `Código: ${currentProd.code} | Ref. Prov: ${providerKey || "N/A"} | Prov: ${providerName}`
      })

    } else {
      // --- CREAR NUEVO (Manual) ---
      const code = data.get("code") as string
      const description = data.get("description") as string
      const category = data.get("category") as string
      const minStock = parseInt(data.get("minStock") as string) || 5

      const checkExists = await prisma.product.findUnique({ where: { code } })
      if (checkExists) {
          return { success: false, error: "El código ya existe en el sistema." }
      }

      await prisma.product.create({
        data: {
          code,
          description,
          category,
          stock: quantity,
          minStock,
          shortCode: providerKey,
          // Creamos la relación aquí también con el NOMBRE
          supplierCodes: {
              create: providerKey ? [{ 
                  code: providerKey, 
                  provider: providerName // <-- AQUÍ GUARDAMOS EL PROVEEDOR 
              }] : []
          }
        }
      })

      // --- REGISTRAR HISTORIAL (Log) ---
      await logHistory({
        action: "INGRESO MANUAL (NUEVO)",
        module: "INVENTARIO",
        description: `Alta de producto nuevo: ${description}`,
        details: `Código: ${code} | Stock Inicial: ${quantity} | Ref. Prov: ${providerKey || "N/A"} | Prov: ${providerName}`
      })
    }

    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al procesar el ingreso." }
  }
}