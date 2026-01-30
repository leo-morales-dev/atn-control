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

// 3. Borrado Lógico Masivo (CORREGIDO PARA BORRAR RASTRO DE FACTURAS)
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

    // 1. Archivar productos (Lógica original)
    await prisma.product.updateMany({
      where,
      data: {
        isArchived: true,
        stock: 0
      }
    })

    // 2. NUEVO: SI EL FILTRO ES "BORRAR TODO", BORRAMOS LA MEMORIA DE FACTURAS
    if (filter === 'all') {
       // Esto elimina el registro que dice "Esta factura ya se importó"
       await prisma.systemLog.deleteMany({
           where: { 
               action: 'XML_IMPORT_RECORD' 
           }
       })
    }

    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al eliminar productos." }
  }
}

// 4. ACTUALIZAR PRODUCTO
export async function updateProduct(formData: FormData) {
    const id = parseInt(formData.get("id") as string)
    const code = formData.get("code") as string
    const description = formData.get("description") as string
    const category = formData.get("category") as string
    const minStockRaw = formData.get("minStock") as string
    const shortCode = formData.get("shortCode") as string 
    
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
        }
      })
      
      revalidatePath("/inventory")
      revalidatePath("/") 
      return { success: true }
    } catch (error: any) {
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
  const providerName = (data.get("providerName") as string) || "Ingreso Manual"

  try {
    if (mode === "link") {
      // --- VINCULAR (Manual) ---
      const productId = parseInt(data.get("linkedProductId") as string)
      const currentProd = await prisma.product.findUnique({ where: { id: productId } })
      
      if (!currentProd) throw new Error("Producto no encontrado")

      if (providerKey) {
          const existing = await prisma.supplierCode.findFirst({
              where: { productId, code: providerKey }
          })
          
          if (!existing) {
              await prisma.supplierCode.create({
                  data: {
                      productId,
                      code: providerKey,
                      provider: providerName
                  }
              })
          }
      }

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

      await logHistory({
        action: "INGRESO MANUAL (SUMA)",
        module: "INVENTARIO",
        description: `Se sumaron ${quantity} unidades a: ${currentProd.description}`,
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
          supplierCodes: {
              create: providerKey ? [{ 
                  code: providerKey, 
                  provider: providerName 
              }] : []
          }
        }
      })

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