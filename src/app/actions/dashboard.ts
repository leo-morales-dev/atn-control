'use server'

import prisma from "@/lib/prisma"

export async function getDashboardStats() {
  // 1. Definir fechas para la gráfica (Últimos 7 días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  try {
    // Ejecutamos varias consultas en paralelo para que sea veloz
    const [
      totalProducts,
      lowStockProducts,
      activeLoansCount,
      recentActivity,
      lastWeekLoans
    ] = await Promise.all([
      // A. Contar productos totales
      prisma.product.count(),
      
      // B. Contar productos con stock crítico (< 5)
      prisma.product.count({
        where: { stock: { lte: 5 } }
      }),

      // C. Contar préstamos activos
      prisma.loan.count({
        where: { status: "prestado" }
      }),

      // D. Traer los 5 últimos movimientos
      prisma.loan.findMany({
        take: 5,
        orderBy: { dateOut: 'desc' },
        include: { 
            product: true,
            employee: true
        }
      }),

      // E. Datos para la gráfica (Préstamos de la última semana)
      prisma.loan.groupBy({
        by: ['dateOut'],
        where: {
          dateOut: { gte: sevenDaysAgo }
        },
        _count: {
          id: true
        }
      })
    ])

    return {
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        activeLoansCount,
        recentActivity,
        // Procesamos los datos de la gráfica aquí mismo para simplificar el frontend
        chartData: processChartData(lastWeekLoans) 
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al cargar estadísticas" }
  }
}

// Función auxiliar para formatear datos de la gráfica
function processChartData(groupedData: any[]) {
  // Crear array de los últimos 7 días con contador en 0
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0] // "2023-10-25"
    
    // Buscar si hubo préstamos ese día
    // Nota: En SQLite las fechas se guardan como string a veces, o timestamps.
    // Esta lógica es simple; en producción real se ajusta según la zona horaria.
    const found = groupedData.find(item => {
        const itemDate = new Date(item.dateOut).toISOString().split('T')[0]
        return itemDate === dateStr
    })

    days.push({
      name: d.toLocaleDateString('es-MX', { weekday: 'short' }), // "Lun", "Mar"
      loans: found ? found._count.id : 0
    })
  }
  return days
}