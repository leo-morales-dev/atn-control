"use server"

import prisma from "@/lib/prisma"

export async function getDashboardStats() {
  // 1. Definir fechas para la gráfica (Últimos 7 días)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  try {
    const [
      totalProducts,
      lowStockProducts,
      activeLoansCount,
      recentActivity,
      lastWeekLoans
    ] = await Promise.all([
      // A. Contar productos activos (no archivados)
      prisma.product.count({
        where: { isArchived: false }
      }),
      
      // B. Contar productos con stock crítico (< 5) y activos
      prisma.product.count({
        where: { 
          isArchived: false,
          stock: { lte: 5 } 
        }
      }),

      // C. Contar préstamos activos (CORRECCIÓN: Usamos 'status' en lugar de fecha)
      // Esto filtra los consumibles (que son 'consumido') y los ya devueltos.
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

      // E. Datos para la gráfica
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
        chartData: processChartData(lastWeekLoans) 
      }
    }
  } catch (error) {
    console.error(error)
    return { success: false, error: "Error al cargar estadísticas" }
  }
}

// Función auxiliar para la gráfica
function processChartData(groupedData: any[]) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0] 
    
    const found = groupedData.find(item => {
        const itemDate = new Date(item.dateOut).toISOString().split('T')[0]
        return itemDate === dateStr
    })

    days.push({
      name: d.toLocaleDateString('es-MX', { weekday: 'short' }),
      loans: found ? found._count.id : 0
    })
  }
  return days
}