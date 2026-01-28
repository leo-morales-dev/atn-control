// src/lib/logger.ts
import prisma from "@/lib/prisma"

type LogType = 'INVENTARIO' | 'EMPLEADOS' | 'PRESTAMOS' | 'SISTEMA'

interface LogEntry {
  action: string      // Título corto de la acción (Ej: "INGRESO XML")
  module: LogType     // Módulo al que pertenece
  description: string // Descripción humana (Ej: "Se registraron 5 herramientas nuevas")
  details?: string    // (Opcional) Datos extra, códigos, etc.
}

export async function logHistory(entry: LogEntry) {
  try {
    await prisma.systemLog.create({
      data: {
        action: entry.action,
        module: entry.module,
        description: entry.description,
        details: entry.details || "",
      }
    })
  } catch (error) {
    console.error("Error al guardar historial:", error)
    // No lanzamos error para no detener la operación principal si falla el log
  }
}