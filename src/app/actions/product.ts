'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function updateProduct(id: number, formData: FormData) {
  const code = formData.get("code") as string
  const description = formData.get("description") as string
  const category = formData.get("category") as string
  const stockRaw = formData.get("stock") as string
  
  // Convertir stock a número (manejando posible string vacío)
  const stock = stockRaw ? parseInt(stockRaw) : 0

  if (!code || !description || !category) {
    return { success: false, error: "Faltan datos obligatorios" }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        code,
        description,
        category,
        stock
      }
    })
    
    revalidatePath("/inventory")
    revalidatePath("/") 
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al actualizar. ¿Quizás el código ya existe?" }
  }
}