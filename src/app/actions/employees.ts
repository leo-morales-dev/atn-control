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
  
  // GENERACIÓN AUTOMÁTICA DE ID
  // Formato: NOM + Año + 4 dígitos aleatorios (Ej: NOM-2026-4821)
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000) 
  const employeeNumber = `NOM-${year}-${random}`

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

// 4. NUEVO: Obtener historial completo de un empleado
export async function getEmployeeHistory(employeeId: number) {
  try {
    const history = await prisma.loan.findMany({
      where: { employeeId },
      include: {
        product: true 
      },
      orderBy: {
        dateOut: 'desc' 
      }
    })
    return { success: true, data: history }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al cargar historial" }
  }
}

// 4. NUEVO: Obtener estadísticas rápidas de empleados
export async function getEmployeeStats() {
  try {
    const total = await prisma.employee.count()
    const active = await prisma.employee.count({
      where: {
        loans: {
            some: {
                status: 'prestado'
            }
        }
      }
    })

    return { 
        success: true, 
        data: { 
            total, 
            active, 
            free: total - active 
        } 
    }
  } catch (error) {
    return { success: false, error: "Error al cargar estadísticas" }
  }
}