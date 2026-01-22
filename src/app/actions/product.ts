'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// --- 1. NUEVO: Obtener estadísticas para las Cards ---
export async function getInventoryStats() {
  try {
    // Traemos solo los datos necesarios para calcular rápido
    const products = await prisma.product.findMany({
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

// --- 2. ACTUALIZADO: Obtener productos con Filtros ---
export async function getProducts(query: string = "", filter: string = "all") {
  try {
    const where: any = {
        OR: [
          { description: { contains: query } },
          { code: { contains: query } }
        ]
    }

    // Filtro por Categoría
    if (filter === 'Herramienta' || filter === 'Consumible' || filter === 'EPP') {
        where.category = filter
    }

    // Buscamos en BD
    const products = await prisma.product.findMany({
      where,
      orderBy: { id: 'desc' }
    })

    // Filtro Especial: Stock Bajo (Lo hacemos aquí porque requiere comparar dos columnas)
    let finalProducts = products
    if (filter === 'low_stock') {
        finalProducts = products.filter(p => p.stock <= p.minStock)
    }

    return { success: true, data: finalProducts }
  } catch (error) {
    return { success: false, error: "Error al cargar productos" }
  }
}

// --- Las funciones de Crear y Actualizar se mantienen igual ---

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