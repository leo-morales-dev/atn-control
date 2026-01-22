'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener historial de daños
export async function getIncidents() {
  try {
    const incidents = await prisma.incident.findMany({
      orderBy: { date: 'desc' },
      include: {
        product: true,
        employee: true
      }
    })
    return { success: true, data: incidents }
  } catch (error) {
    return { success: false, error: "Error al cargar incidentes" }
  }
}

// 2. Reportar un daño
export async function reportDamage(formData: FormData) {
  const productId = parseInt(formData.get("productId") as string)
  const employeeIdRaw = formData.get("employeeId") as string
  const description = formData.get("description") as string
  const type = formData.get("type") as string // "directo" (almacén) o "prestamo" (lo trajo roto)

  const employeeId = employeeIdRaw ? parseInt(employeeIdRaw) : null

  try {
    await prisma.$transaction(async (tx) => {
      // A. Registrar el incidente
      await tx.incident.create({
        data: {
          productId,
          employeeId,
          description,
          status: "dañado"
        }
      })

      // B. Ajustar inventario según el caso
      if (type === "directo") {
        // Estaba en almacén y se rompió -> Restamos stock
        await tx.product.update({
          where: { id: productId },
          data: { stock: { decrement: 1 } }
        })
      } 
      // Si era de un préstamo, asumimos que ya se había restado el stock al prestarlo.
      // Pero necesitamos cerrar el préstamo si existe uno activo.
      else if (type === "prestamo" && employeeId) {
        // Buscar si hay préstamo activo de este producto y este empleado
        const activeLoan = await tx.loan.findFirst({
            where: { 
                productId, 
                employeeId, 
                status: "prestado" 
            }
        })

        if (activeLoan) {
            // Lo marcamos como "devuelto con daño" para que deje de estar activo
            await tx.loan.update({
                where: { id: activeLoan.id },
                data: { 
                    status: "devuelto_dañado", 
                    dateReturn: new Date() 
                }
            })
            // OJO: NO sumamos el stock de vuelta, porque está roto.
        }
      }
    })

    revalidatePath("/damages")
    revalidatePath("/") // Actualizar stock dashboard
    return { success: true }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al registrar daño" }
  }
}