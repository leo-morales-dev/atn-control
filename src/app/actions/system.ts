"use server"

import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
// import { redirect } from "next/navigation" // No es necesario si rediriges desde el cliente

export async function wipeSystemData(password: string) {
  // 1. VERIFICAR CONTRASEÑA
  // Usamos la misma variable de entorno que usas para el login
  if (password !== process.env.ADMIN_PASSWORD) {
    return { success: false, error: "Contraseña incorrecta. Acceso denegado." }
  }

  try {
    // 2. BORRADO EN CASCADA (Orden estricto para evitar errores de llaves foráneas)
    await prisma.$transaction([
      // A. Tablas de movimientos / historial / dependencias
      // IMPORTANTE: Esto borra TODO el historial, incluyendo el registro de facturas importadas.
      prisma.systemLog.deleteMany(), 
      prisma.loan.deleteMany(),
      prisma.damageReport.deleteMany(),
      prisma.supplierCode.deleteMany(),
      prisma.incident.deleteMany(), // Agregué Incident por si acaso tienes incidentes
      prisma.damageLog.deleteMany(), // Agregué DamageLog por si acaso
      
      // B. Tablas principales (Catálogos)
      prisma.product.deleteMany(),
      prisma.employee.deleteMany(),
    ])

    // 3. CERRAR SESIÓN AUTOMÁTICAMENTE
    const cookieStore = await cookies()
    cookieStore.delete("auth_session")

    return { success: true }
  } catch (error) {
    console.error("Error en wipeSystemData:", error)
    return { success: false, error: "Error interno al intentar formatear la base de datos." }
  }
}