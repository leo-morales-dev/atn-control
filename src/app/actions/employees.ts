'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"

// 1. Obtener empleados
export async function getEmployees(query: string = "") {
  try {
    const employees = await prisma.employee.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { employeeNumber: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' }
    })
    return { success: true, data: employees }
  } catch (error) {
    return { success: false, error: "Error al cargar empleados" }
  }
}

// 2. Crear empleado
export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string
  const employeeNumber = formData.get("employeeNumber") as string

  try {
    await prisma.employee.create({
      data: {
        name,
        employeeNumber
      }
    })
    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al crear empleado" }
  }
}

// 3. NUEVO: Actualizar empleado
export async function updateEmployee(id: number, formData: FormData) {
  const name = formData.get("name") as string
  const employeeNumber = formData.get("employeeNumber") as string

  if (!name || !employeeNumber) {
    return { success: false, error: "Faltan datos" }
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: { name, employeeNumber }
    })
    
    revalidatePath("/employees")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error al actualizar." }
  }
}