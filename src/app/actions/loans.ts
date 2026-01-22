'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener préstamos activos (Solo herramientas pendientes)
export async function getActiveLoans() {
  try {
    const loans = await prisma.loan.findMany({
      where: { status: "prestado" }, // <--- Esto filtra automáticamente los consumibles
      include: {
        product: true,
        employee: true
      },
      orderBy: { dateOut: 'desc' }
    })
    return { success: true, data: loans }
  } catch (error) {
    return { success: false, error: "Error al cargar préstamos" }
  }
}

// 2. Crear préstamo (Con lógica inteligente Herramienta vs Consumible)
export async function createLoan(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string)
  const employeeId = parseInt(formData.get("employeeId") as string)
  const quantity = parseInt(formData.get("quantity") as string) || 1

  if (!productId || !employeeId) {
    return { success: false, error: "Selecciona producto y empleado" }
  }

  try {
    await prisma.$transaction(async (tx) => {
      
      // A. Buscamos el producto para ver su STOCK y su CATEGORÍA
      const product = await tx.product.findUnique({ where: { id: productId } })
      
      if (!product || product.stock < quantity) {
        throw new Error(`Stock insuficiente. Solo quedan ${product?.stock || 0}`)
      }

      // --- LÓGICA CLAVE ---
      // Si es consumible, nace muerto ('consumido'). Si es herramienta, nace vivo ('prestado').
      const newStatus = product.category === 'consumible' ? 'consumido' : 'prestado';

      // B. Restar Stock (Esto pasa siempre)
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: quantity } }
      })

      // C. Crear el registro
      await tx.loan.create({
        data: {
          productId,
          employeeId,
          quantity,
          status: newStatus, // <--- Aquí usamos el estado calculado
          backupProduct: product.description,
        }
      })
    })

    revalidatePath("/loans")
    revalidatePath("/") 
    return { success: true }

  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || "Error al procesar salida" }
  }
}

// 3. Devolver material (Solo funcionará para lo que esté 'prestado')
export async function returnLoan(loanId: number) {
  try {
    await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({ where: { id: loanId } })
      
      // Validación extra de seguridad
      if (!loan || loan.status !== "prestado") {
        throw new Error("Este ítem no se puede devolver (ya fue devuelto o es un consumible).")
      }

      await tx.loan.update({
        where: { id: loanId },
        data: { 
          status: "devuelto", 
          dateReturn: new Date() 
        }
      })

      await tx.product.update({
        where: { id: loan.productId },
        data: { stock: { increment: loan.quantity } }
      })
    })

    revalidatePath("/loans")
    revalidatePath("/")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al devolver" }
  }
}