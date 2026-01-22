// app/actions/products.ts
'use server' // ¡Esto es vital! Indica que este código NUNCA viaja al navegador

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener todos los productos (Reemplaza tus antiguos SELECT)
export async function getProducts() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { updatedAt: 'desc' } // Los más recientes primero
    })
    return { success: true, data: products }
  } catch (error) {
    return { success: false, error: "Error al cargar productos" }
  }
}

// 2. Crear un producto nuevo (Reemplaza tu ruta POST /add-product)
export async function createProduct(formData: FormData) {
  const code = formData.get("code") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const stock = parseInt(formData.get("stock") as string) || 0
  const shortCode = formData.get("shortCode") as string

  if (!code || !description) {
    return { success: false, error: "Faltan campos obligatorios" }
  }

  try {
    await prisma.product.create({
      data: {
        code,
        description,
        category,
        stock,
        shortCode
      }
    })
    
    // Esto es magia: le dice a Next.js "refresca la lista de productos automáticamente"
    revalidatePath("/") 
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al crear producto (¿Quizás el código ya existe?)" }
  }
}