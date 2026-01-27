import { getDashboardStats } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowRightLeft, CalendarDays, Box, Clock } from "lucide-react"
import { DashboardCharts } from "@/components/DashboardCharts"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import prisma from "@/lib/prisma"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const [statsRes] = await Promise.all([
    getDashboardStats(),
    // Ya no necesitamos cargar productos/empleados aquí porque quitamos los botones
  ])

  const stats = statsRes.data || {
    totalProducts: 0,
    lowStockProducts: 0,
    activeLoansCount: 0,
    recentActivity: [],
    chartData: []
  }

  // Fecha actual
  const today = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long' 
  })
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <main className="min-h-screen bg-gray-50/30 p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- HEADER (Solo Bienvenida) --- */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 pb-2">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#444444]">Dashboard</h1>
                {/* MENSAJE DE BIENVENIDA */}
                <p className="text-[#444444]/60 mt-1 font-medium text-sm">
                    Bienvenido de nuevo, aquí tienes el resumen de hoy.
                </p>
            </div>
            
            {/* Solo Fecha */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm text-sm text-[#444444] font-semibold border border-gray-100">
                <CalendarDays size={16} className="text-[#444444]"/>
                {formattedDate}
            </div>
        </div>

        {/* --- TARJETAS DE MÉTRICAS --- */}
        <div className="grid gap-4 md:grid-cols-3">
          
          {/* 1. TOTAL STOCK */}
          <Card className="bg-[#444444] border-none shadow-md text-white py-4 gap-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-5">
              <CardTitle className="text-sm font-semibold text-white/90">
                Total Stock
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                  <Package className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-0">
              <div className="text-3xl font-bold text-white">{stats.totalProducts}</div>
              <p className="text-xs text-white/50 mt-0.5 font-medium">
                 Productos registrados
              </p>
            </CardContent>
          </Card>

          {/* 2. STOCK BAJO */}
          <Card className="bg-white border-none shadow-sm text-[#444444] py-4 gap-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-5">
              <CardTitle className="text-sm font-semibold text-[#444444]/70">
                Stock Bajo
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                 <AlertTriangle className="h-4 w-4 text-[#444444]" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-0">
              <div className="text-3xl font-bold text-[#444444]">
                {stats.lowStockProducts}
              </div>
              <p className="text-xs text-[#444444]/50 mt-0.5 font-medium">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          {/* 3. PRÉSTAMOS ACTIVOS */}
          <Card className="bg-white border-none shadow-sm text-[#444444] py-4 gap-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-0 px-5">
              <CardTitle className="text-sm font-semibold text-[#444444]/70">
                Préstamos Activos
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                 <ArrowRightLeft className="h-4 w-4 text-[#444444]" />
              </div>
            </CardHeader>
            <CardContent className="px-5 pt-0">
              <div className="text-3xl font-bold text-[#444444]">{stats.activeLoansCount}</div>
              <p className="text-xs text-[#444444]/50 mt-0.5 font-medium">
                Herramientas fuera
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- SECCIÓN PRINCIPAL --- */}
        <div className="grid gap-6 md:grid-cols-7">
            
            {/* GRÁFICA */}
            <Card className="col-span-full md:col-span-4 border-none shadow-sm bg-white py-2">
                <CardHeader className="pb-0 px-6">
                    <CardTitle className="text-lg font-bold text-[#444444]">Actividad Semanal</CardTitle>
                    <CardDescription className="text-[#444444]/50 text-xs">Salidas de material (7 días)</CardDescription>
                </CardHeader>
                <CardContent className="pl-0 px-6">
                    {/* Renderizamos el componente puro */}
                    <DashboardCharts data={stats.chartData} />
                </CardContent>
            </Card>

            {/* LISTA RECIENTE */}
            {/* AGREGADO: 'gap-0' para quitar el espacio grande entre Header y Content */}
            <Card className="col-span-full md:col-span-3 border-none shadow-sm bg-white flex flex-col h-full max-h-[450px] gap-0">
                <CardHeader className="border-b border-gray-50 py-4 bg-white px-6">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg font-bold text-[#444444] flex items-center gap-2">
                             Movimientos Recientes
                        </CardTitle>
                        <Badge variant="secondary" className="bg-gray-100 text-[#444444]/60 font-normal text-[10px]">
                            Últimos 5
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-auto">
                    <div className="divide-y divide-gray-50">
                        {stats.recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-[#444444]/40 text-sm">
                                Sin movimientos registrados hoy
                            </div>
                        ) : (
                            stats.recentActivity.map((loan: any) => (
                                <div key={loan.id} className="flex items-center gap-3 p-3 px-6 hover:bg-gray-50/50 transition-colors">
                                    <Avatar className="h-8 w-8 border border-gray-100">
                                        <AvatarFallback className="bg-gray-100 text-[#444444] text-[10px] font-bold">
                                            {loan.employee?.name?.substring(0, 2).toUpperCase() || "SN"}
                                        </AvatarFallback>
                                    </Avatar>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className="text-sm font-bold text-[#444444] truncate">
                                                {loan.employee?.name || "Desconocido"}
                                            </p>
                                            <span className="text-[10px] text-[#444444]/40 font-mono">
                                                {new Date(loan.dateOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[#444444]/60 truncate">
                                            {loan.product?.description}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </main>
  )
}