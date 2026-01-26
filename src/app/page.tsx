import { getDashboardStats } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowRightLeft, TrendingUp, Clock, CalendarDays, Box } from "lucide-react"
import { DashboardCharts } from "@/components/DashboardCharts"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data } = await getDashboardStats()
  
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Cargando estadísticas...
    </div>
  )

  // Fecha actual formateada
  const today = new Date().toLocaleDateString('es-MX', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  // Capitalizar primera letra
  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <main className="min-h-screen bg-zinc-50/50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Panel de Control</h1>
                <p className="text-zinc-500 mt-1">Visión general del inventario y operaciones.</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 rounded-full shadow-sm text-sm text-zinc-600 font-medium">
                <CalendarDays size={16} className="text-blue-600"/>
                {formattedDate}
            </div>
        </div>

        {/* --- TARJETAS DE MÉTRICAS --- */}
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* 1. Total Productos */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Inventario Total</CardTitle>
              <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-zinc-900">{data.totalProducts}</div>
              <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                <TrendingUp size={12} className="text-green-600"/> Items registrados
              </p>
            </CardContent>
          </Card>

          {/* 2. Stock Bajo */}
          <Card className={`border-l-4 shadow-sm hover:shadow-md transition-all duration-200 ${data.lowStockProducts > 0 ? 'border-l-red-500 bg-red-50/10' : 'border-l-green-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-xs font-bold uppercase tracking-wider ${data.lowStockProducts > 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                Alerta Stock
              </CardTitle>
              <div className={`h-9 w-9 rounded-full flex items-center justify-center ${data.lowStockProducts > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                 <AlertTriangle className={`h-5 w-5 ${data.lowStockProducts > 0 ? 'text-red-600' : 'text-green-600'}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-black ${data.lowStockProducts > 0 ? 'text-red-600' : 'text-zinc-900'}`}>
                {data.lowStockProducts}
              </div>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                {data.lowStockProducts > 0 ? "Requieren reabastecimiento" : "Niveles óptimos"}
              </p>
            </CardContent>
          </Card>

          {/* 3. Préstamos Activos */}
          <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Préstamos Activos</CardTitle>
              <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center">
                 <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-zinc-900">{data.activeLoansCount}</div>
              <p className="text-xs text-zinc-500 mt-1 font-medium text-amber-700">
                Herramientas fuera
              </p>
            </CardContent>
          </Card>
        </div>

        {/* --- SECCIÓN PRINCIPAL --- */}
        <div className="grid gap-6 md:grid-cols-7">
            
            {/* GRÁFICA (4 columnas) */}
            <Card className="col-span-full md:col-span-4 shadow-sm border-zinc-200">
                <CardHeader>
                    <CardTitle className="text-lg font-bold text-zinc-800">Tendencia Semanal</CardTitle>
                    <CardDescription>Flujo de salidas de material (7 días)</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <DashboardCharts data={data.chartData} />
                </CardContent>
            </Card>

            {/* LISTA RECIENTE (3 columnas) */}
            <Card className="col-span-full md:col-span-3 shadow-sm border-zinc-200 flex flex-col">
                <CardHeader className="pb-4 border-b border-zinc-100 mb-2">
                    <CardTitle className="text-lg font-bold text-zinc-800 flex items-center gap-2">
                        <Clock size={18} className="text-zinc-400"/> Actividad Reciente
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto pr-2">
                    <div className="space-y-6">
                        {data.recentActivity.length === 0 ? (
                            <div className="h-40 flex flex-col items-center justify-center text-zinc-400 text-sm">
                                <Package size={32} className="mb-2 opacity-20"/>
                                Sin movimientos recientes
                            </div>
                        ) : (
                            data.recentActivity.map((loan: any) => {
                                // Determinamos tipo visualmente
                                const isConsumable = loan.status === 'consumido'
                                
                                return (
                                    <div key={loan.id} className="flex items-start gap-3 group">
                                        {/* Ícono dinámico */}
                                        <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                                            isConsumable ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                                        }`}>
                                            {isConsumable ? <Box size={16}/> : <ArrowRightLeft size={16}/>}
                                        </div>
                                        
                                        <div className="space-y-1 w-full min-w-0">
                                            <div className="flex justify-between items-start gap-2">
                                                <p className="text-sm font-semibold text-zinc-800 truncate">
                                                    {loan.employee?.name || "Personal General"}
                                                </p>
                                                <span className="text-[10px] text-zinc-400 font-mono whitespace-nowrap bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                                                    {new Date(loan.dateOut).toLocaleDateString()}
                                                </span>
                                            </div>
                                            
                                            <p className="text-xs text-zinc-500 truncate">
                                                <span className={`font-medium ${isConsumable ? 'text-purple-600' : 'text-blue-600'}`}>
                                                    {isConsumable ? 'Consumió' : 'Retiró'}:
                                                </span> {loan.product?.description || loan.backupProduct}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </main>
  )
}