"use server"

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function createDamageReport(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string)
  const quantity = parseInt(formData.get("quantity") as string)
  const reason = formData.get("reason") as string
  const notes = formData.get("notes") as string
  // Capturamos la clave específica seleccionada (si existe)
  const supplierCode = formData.get("supplierCode") as string 

  if (!productId || !quantity || !reason) {
    return { success: false, error: "Faltan datos obligatorios" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Verificar stock
      const product = await tx.product.findUnique({ where: { id: productId } })
      if (!product) throw new Error("Producto no encontrado")
      if (product.stock < quantity) throw new Error("Stock insuficiente")

      // 2. Crear el reporte con la clave específica
      await tx.damageReport.create({
        data: {
          productId,
          quantity,
          reason,
          notes,
          affectedSupplierCode: supplierCode || product.shortCode, // Usamos la seleccionada o la default
          date: new Date(),
        },
      })

      // 3. Restar del inventario general
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } },
      })
    })

    revalidatePath("/damages")
    revalidatePath("/inventory")
    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Error al procesar" }
  }
}

// La función de eliminar se mantiene igual (reversión de stock)
export async function deleteDamageReport(reportId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const report = await tx.damageReport.findUnique({ where: { id: reportId } })
      if (!report) throw new Error("Reporte no encontrado")

      await tx.product.update({
        where: { id: report.productId },
        data: { stock: { increment: report.quantity } }
      })

      await tx.damageReport.delete({ where: { id: reportId } })
    })

    revalidatePath("/damages")
    revalidatePath("/inventory")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al eliminar" }
  }
}