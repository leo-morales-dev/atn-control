'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logHistory } from "@/lib/logger" // <--- ESTA IMPORTACIÓN FALTABA O FALLABA

// 1. Obtener empleados (CON FILTROS ACTUALIZADOS)
export async function getEmployees(query: string = "", filter: string = "all", page: number = 1) {
  const pageSize = 10 

  try {
    const where: any = {
      OR: [
        { name: { contains: query } },
        { employeeNumber: { contains: query } }
      ]
    }

    if (filter === 'with_loans') {
        where.loans = { some: { status: 'prestado' } }
    } else if (filter === 'available') {
        where.NOT = { loans: { some: { status: 'prestado' } } }
    }

    const totalItems = await prisma.employee.count({ where })
    const totalPages = Math.ceil(totalItems / pageSize)

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
          loans: {
              where: { status: 'prestado' },
              select: { id: true }
          }
      }
    })

    return { 
        success: true, 
        data: employees, 
        totalPages 
    }
  } catch (error) {
    return { success: false, error: "Error al cargar empleados", data: [], totalPages: 0 }
  }
}

// 2. Crear empleado (CON LOG Y VALIDACIÓN)
export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string
  let employeeNumber = formData.get("employeeNumber") as string
  
  if (employeeNumber) employeeNumber = employeeNumber.trim().toUpperCase()
  
  if (employeeNumber) {
      const existing = await prisma.employee.findFirst({ where: { employeeNumber } })
      if (existing) return { success: false, error: `El ID '${employeeNumber}' ya existe.` }
  } else {
      const year = new Date().getFullYear()
      const random = Math.floor(1000 + Math.random() * 9000) 
      employeeNumber = `NOM-${year}-${random}`
  }

  try {
    await prisma.employee.create({
      data: { name, employeeNumber }
    })

    // LOG
    await logHistory({
        action: "ALTA EMPLEADO",
        module: "EMPLEADOS",
        description: `Nuevo colaborador registrado: ${name}`,
        details: `ID: ${employeeNumber}`
    })

    revalidatePath("/employees")
    revalidatePath("/history")
    return { success: true }
  } catch (error) {
    return { success: false, error: "Error interno al crear empleado." }
  }
}

// 3. Actualizar empleado
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

// 4. Eliminar empleado (CON LOG)
export async function deleteEmployee(id: number) {
    try {
        const employee = await prisma.employee.findUnique({
            where: { id },
            include: { loans: { where: { status: 'prestado' } } } 
        })

        if (!employee) return { success: false, error: "Empleado no encontrado" }

        if (employee.loans.length > 0) {
            return { success: false, error: "Tiene préstamos activos. No se puede eliminar." }
        }

        await prisma.employee.delete({ where: { id } })

        // LOG
        await logHistory({
            action: "BAJA EMPLEADO",
            module: "EMPLEADOS",
            description: `Colaborador eliminado: ${employee.name}`,
            details: `ID Anterior: ${employee.employeeNumber || "N/A"}`
        })

        revalidatePath("/employees")
        revalidatePath("/history")
        return { success: true }
    } catch (error) {
        console.error(error)
        return { success: false, error: "Error al eliminar" }
    }
}

export async function getEmployeeHistory(employeeId: number) {
  try {
    const history = await prisma.loan.findMany({
      where: { employeeId },
      include: { product: true },
      orderBy: { dateOut: 'desc' }
    })
    return { success: true, data: history }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al cargar historial" }
  }
}

export async function getEmployeeStats() {
  try {
    const total = await prisma.employee.count()
    const active = await prisma.employee.count({
      where: {
        loans: { some: { status: 'prestado' } }
      }
    })

    return { 
        success: true, 
        data: { total, active, free: total - active } 
    }
  } catch (error) {
    return { success: false, error: "Error al cargar estadísticas" }
  }
}