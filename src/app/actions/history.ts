'use server'

import prisma from "@/lib/prisma"

export async function getHistory() {
  try {
    const history = await prisma.loan.findMany({
      take: 50, // Limitamos a los últimos 50 para que cargue rápido
      include: {
        product: true,
        employee: true
      },
      orderBy: { dateOut: 'desc' } // Lo más nuevo primero
    })
    return { success: true, data: history }
  } catch (error) {
    return { success: false, error: "Error al cargar historial" }
  }
}