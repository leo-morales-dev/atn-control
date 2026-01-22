import { getDashboardStats } from "@/app/actions/dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, ArrowRightLeft } from "lucide-react"
import { DashboardCharts } from "@/components/DashboardCharts" // Crearemos este componente abajo

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { data } = await getDashboardStats()
  
  if (!data) return <div>Cargando...</div>

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Título */}
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Dashboard</h1>
           <p className="text-zinc-500 mt-1">Resumen general de operaciones del almacén.</p>
        </div>

        {/* TARJETAS DE MÉTRICAS */}
        <div className="grid gap-4 md:grid-cols-3">
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalProducts}</div>
              <p className="text-xs text-zinc-500">Items registrados en sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Alerta Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{data.lowStockProducts}</div>
              <p className="text-xs text-zinc-500">Productos con menos de 5 unidades</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Préstamos Activos</CardTitle>
              <ArrowRightLeft className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{data.activeLoansCount}</div>
              <p className="text-xs text-zinc-500">Herramientas fuera del almacén</p>
            </CardContent>
          </Card>
        </div>

        {/* SECCIÓN INFERIOR: GRÁFICA Y LISTA RECIENTE */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            
            {/* Gráfica (Ocupa 4 columnas) */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Movimientos de la Semana</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                    {/* Componente Cliente para la gráfica */}
                    <DashboardCharts data={data.chartData} />
                </CardContent>
            </Card>

            {/* Lista Reciente (Ocupa 3 columnas) */}
            <Card className="col-span-3">
                <CardHeader>
                    <CardTitle>Actividad Reciente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-8">
                        {data.recentActivity.map((loan: any) => (
                            <div key={loan.id} className="flex items-center">
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {loan.employee?.name}
                                    </p>
                                    <p className="text-sm text-zinc-500">
                                        Retiró: <span className="font-bold">{loan.product?.description}</span>
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-zinc-400">
                                    {new Date(loan.dateOut).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </main>
  )
}