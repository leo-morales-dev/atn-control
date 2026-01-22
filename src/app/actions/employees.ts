'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { randomBytes } from "crypto" // Librería nativa para generar códigos únicos

export async function getEmployees() {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' }
    })
    return { success: true, data: employees }
  } catch (error) {
    return { success: false, error: "Error al cargar empleados" }
  }
}

export async function createEmployee(formData: FormData) {
  const name = formData.get("name") as string
  let employeeNumber = formData.get("employeeNumber") as string

  if (!name) {
    return { success: false, error: "El nombre es obligatorio" }
  }

  // --- LÓGICA DE AUTO-ASIGNACIÓN ---
  // Si el usuario no escribió nada, generamos un código
  if (!employeeNumber || employeeNumber.trim() === "") {
    // Genera 2 bytes aleatorios y los convierte a Hexadecimal (Ej: 'a4b2')
    const suffix = randomBytes(2).toString('hex').toUpperCase();
    employeeNumber = `EMP-${suffix}`; 
  }

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
    console.error("ERROR REAL:", error);
    // Verificamos si el error es por código duplicado (P2002 es el código de Prisma para Unique constraint)
    if ((error as any).code === 'P2002') {
       return { success: false, error: "Ese número de empleado ya existe." }
    }
    return { success: false, error: "Error al crear empleado" }
  }
}