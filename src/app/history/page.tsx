import prisma from "@/lib/prisma"
import { HistoryFilters } from "@/components/HistoryFilters"
import { HistoryPagination } from "@/components/HistoryPagination" 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Activity, AlertTriangle, QrCode } from "lucide-react"

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ q?: string; cat?: string; from?: string; to?: string; page?: string }>
}

export default async function HistoryPage({ searchParams }: Props) {
  const params = await searchParams;

  const currentPage = Number(params.page) || 1
  const itemsPerPage = 10 

  const where: any = {}

  if (params.q) {
    where.OR = [
      { description: { contains: params.q } }, 
      { details: { contains: params.q } },
      { action: { contains: params.q } }
    ]
  }

  if (params.cat && params.cat !== 'ALL') {
    switch (params.cat) {
        case 'PRESTAMOS': where.module = 'PRESTAMOS'; break;
        case 'INVENTARIO': where.module = 'INVENTARIO'; break;
        case 'BAJAS': 
            where.OR = [
                { action: { contains: 'BAJA' } }, 
                { action: { contains: 'DAÑO' } }, 
                { description: { contains: 'baja' } }
            ]
            break;
        case 'EMPLEADOS': where.module = 'EMPLEADOS'; break;
        default: where.module = params.cat; break;
    }
  }

  if (params.from || params.to) {
    where.timestamp = {}
    if (params.from) where.timestamp.gte = new Date(params.from + "T00:00:00")
    if (params.to) where.timestamp.lte = new Date(params.to + "T23:59:59")
  }

  const totalItems = await prisma.systemLog.count({ where })
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const logs = await prisma.systemLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage
  })

  // --- EXTRACTOR DE CÓDIGO (LÓGICA BLINDADA) ---
  const extractCode = (log: any) => {
    const text = `${log.details || ''} ${log.description || ''}`;
    
    // 1. ESTRATEGIA PRINCIPAL (Para los nuevos logs generados por el sistema)
    // Buscamos la etiqueta "Código:" y capturamos TODO hasta encontrar un pipe '|' o el fin de la línea.
    // Esto soluciona que "desaparezcan" códigos que tenían espacios.
    const labelMatch = text.match(/Código:\s*([^|]+)/i);
    
    if (labelMatch && labelMatch[1]) {
        // Limpiamos espacios sobrantes (trim) y devolvemos.
        return labelMatch[1].trim().toUpperCase();
    }

    // 2. ESTRATEGIA SECUNDARIA (Para registros viejos)
    // Solo buscamos patrones estrictos del sistema (PROD, HER, etc.)
    const systemPattern = /\b(PROD|HER|CON|EMP|LOAN)-[A-Z0-9]+\b/i;
    const match = text.match(systemPattern);

    if (match) {
        const foundCode = match[0].toUpperCase();
        
        // FILTRO DE SEGURIDAD ANTI-PROVEEDOR:
        // Verificamos si 15 caracteres antes del código encontrado existen palabras como "Ref" o "Prov".
        // Si es así, asumimos que es un código de proveedor y NO lo mostramos.
        const index = text.toUpperCase().indexOf(foundCode);
        const prefixContext = text.substring(Math.max(0, index - 15), index).toUpperCase();
        
        if (prefixContext.includes("REF") || prefixContext.includes("PROV")) {
            return null; // Es un proveedor, lo ignoramos.
        }

        return foundCode;
    }

    return null;
  }

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
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#232323] flex items-center gap-3">
                    <Activity className="text-zinc-400" /> Historial de Movimientos
                </h1>
                <p className="text-zinc-500 mt-1 text-sm">
                    Registro inmutable de todas las operaciones del sistema.
                    <span className="ml-2 bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full text-xs font-mono">
                        {totalItems} eventos
                    </span>
                </p>
            </div>
        </div>

        <HistoryFilters />

        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="bg-zinc-50">
                        <TableRow>
                            <TableHead className="w-[140px]">Fecha</TableHead>
                            <TableHead className="w-[140px]">Código QR</TableHead>
                            <TableHead className="w-[180px]">Acción</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="w-[200px]">Detalles Extra</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-40 text-center text-zinc-500">
                                    <div className="flex flex-col items-center justify-center gap-3">
                                        <div className="bg-zinc-100 p-3 rounded-full">
                                            <FileText size={24} className="text-zinc-400"/>
                                        </div>
                                        <p className="font-medium">No hay registros con estos filtros.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            logs.map((log) => {
                                const code = extractCode(log);
                                
                                return (
                                    <TableRow key={log.id} className="hover:bg-zinc-50 transition-colors group text-xs">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-zinc-700">
                                                    {new Date(log.timestamp).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {new Date(log.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </TableCell>

                                        <TableCell>
                                            {code ? (
                                                <div className="flex items-center gap-1.5 bg-zinc-100 px-2 py-1 rounded w-fit border border-zinc-200 group-hover:bg-white group-hover:border-zinc-300 transition-colors">
                                                    <QrCode size={12} className="text-zinc-400"/>
                                                    <span className="font-mono font-bold text-zinc-700 text-[10px]">
                                                        {code}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300 text-[10px] pl-2">-</span>
                                            )}
                                        </TableCell>

                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {log.action.includes("BAJA") && <AlertTriangle size={14} className="text-red-500" />}
                                                <Badge variant="outline" className={`font-semibold text-[10px] uppercase tracking-wide px-2 py-0.5 border ${getBadgeColor(log.action)}`}>
                                                    {log.action}
                                                </Badge>
                                            </div>
                                        </TableCell>

                                        <TableCell className="font-medium text-zinc-700 py-3">
                                            {params.q ? (
                                                <span className="bg-yellow-100 text-zinc-900 rounded px-1">
                                                    {log.description}
                                                </span>
                                            ) : log.description}
                                        </TableCell>

                                        <TableCell className="py-3">
                                            {log.details ? (
                                                <div className="text-[10px] text-zinc-500 font-mono truncate max-w-[180px]" title={log.details}>
                                                    {log.details}
                                                </div>
                                            ) : (
                                                <span className="text-zinc-300 italic">---</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            
            <HistoryPagination totalPages={totalPages} currentPage={currentPage} />
            
        </div>
      </div>
    </main>
  )
}