import prisma from "@/lib/prisma"
import { HistoryFilters } from "@/components/HistoryFilters"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Activity, AlertTriangle } from "lucide-react"

export const dynamic = 'force-dynamic'

// CAMBIO 1: Definimos el tipo como una Promesa
type Props = {
  searchParams: Promise<{ q?: string; cat?: string; from?: string; to?: string }>
}

export default async function HistoryPage({ searchParams }: Props) {
  
  // CAMBIO 2: Esperamos a que se resuelvan los parámetros antes de usarlos
  const params = await searchParams;

  // --- CONSTRUCCIÓN DE FILTROS ---
  const where: any = {}

  // Usamos 'params' en lugar de 'searchParams' de aquí en adelante

  // 1. Filtro por Búsqueda (Texto)
  if (params.q) {
    where.OR = [
      { description: { contains: params.q } },
      { details: { contains: params.q } },
      { action: { contains: params.q } }
    ]
  }

  // 2. Filtro por Categoría (Botones)
  if (params.cat && params.cat !== 'ALL') {
    
    switch (params.cat) {
        case 'PRESTAMOS':
            where.module = 'PRESTAMOS'
            break;
            
        case 'INVENTARIO':
            where.module = 'INVENTARIO'
            break;

        case 'BAJAS':
            where.OR = [
                { action: { contains: 'BAJA' } },
                { action: { contains: 'DAÑO' } },
                { description: { contains: 'baja' } }
            ]
            break;

        case 'EMPLEADOS':
            where.module = 'EMPLEADOS'
            break;
            
        default:
            where.module = params.cat
            break;
    }
  }

  // 3. Filtro por Fechas
  if (params.from || params.to) {
    where.timestamp = {}
    if (params.from) {
        where.timestamp.gte = new Date(params.from + "T00:00:00")
    }
    if (params.to) {
        where.timestamp.lte = new Date(params.to + "T23:59:59")
    }
  }

  // --- CONSULTA A BASE DE DATOS ---
  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: 100 
  })

  // Helper para colores de badges
  const getBadgeColor = (action: string) => {
      const act = action.toUpperCase()
      if (act.includes("XML") || act.includes("EXCEL") || act.includes("INGRESO")) return "bg-green-100 text-green-700 border-green-200"
      if (act.includes("PRESTAMO")) return "bg-blue-100 text-blue-700 border-blue-200"
      if (act.includes("DEVOLUCION")) return "bg-indigo-100 text-indigo-700 border-indigo-200"
      if (act.includes("BAJA") || act.includes("DAÑO")) return "bg-red-100 text-red-700 border-red-200"
      if (act.includes("EMPLEADO")) return "bg-purple-100 text-purple-700 border-purple-200"
      return "bg-zinc-100 text-zinc-600 border-zinc-200"
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#232323] flex items-center gap-3">
                    <Activity className="text-zinc-400" /> Historial de Movimientos
                </h1>
                <p className="text-zinc-500 mt-1 text-sm">
                    Registro inmutable de todas las operaciones del sistema.
                </p>
            </div>
        </div>

        {/* CONTROLES (FILTROS) */}
        <HistoryFilters />

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-zinc-50">
                    <TableRow>
                        <TableHead className="w-[180px]">Fecha / Hora</TableHead>
                        <TableHead className="w-[220px]">Tipo de Acción</TableHead>
                        <TableHead>Descripción del Evento</TableHead>
                        <TableHead className="w-[300px]">Detalles Técnicos</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={4} className="h-40 text-center text-zinc-500">
                                <div className="flex flex-col items-center justify-center gap-3">
                                    <div className="bg-zinc-100 p-3 rounded-full">
                                        <FileText size={24} className="text-zinc-400"/>
                                    </div>
                                    <p className="font-medium">No hay registros con estos filtros.</p>
                                    <p className="text-xs text-zinc-400">Intenta cambiar la categoría o las fechas.</p>
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : (
                        logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-zinc-50 transition-colors group">
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-700 text-xs">
                                            {new Date(log.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1 mt-0.5">
                                            <Clock size={10} />
                                            {new Date(log.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {log.action.includes("BAJA") && <AlertTriangle size={14} className="text-red-500" />}
                                        
                                        <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 border ${getBadgeColor(log.action)}`}>
                                            {log.action}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="font-medium text-zinc-700 text-sm py-3">
                                    {log.description}
                                </TableCell>
                                <TableCell className="py-3">
                                    {log.details ? (
                                        <code className="text-[10px] text-zinc-500 bg-zinc-50 px-2 py-1 rounded border border-zinc-100 block w-fit max-w-full truncate font-mono" title={log.details}>
                                            {log.details}
                                        </code>
                                    ) : (
                                        <span className="text-zinc-300 text-xs italic">---</span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>

      </div>
    </main>
  )
}