"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, FileSpreadsheet, CalendarClock, Loader2 } from "lucide-react"
import { deleteDamageReport } from "@/app/actions/damages"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface Report {
  id: number
  quantity: number
  reason: string
  notes: string | null
  date: Date
  product: {
    description: string
    shortCode: string | null
    code: string
  }
}

export function DamageHistoryTable({ reports }: { reports: Report[] }) {
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const handleDelete = async (id: number) => {
    if(!confirm("¿Eliminar este reporte? El stock será devuelto al inventario.")) return
    
    setLoadingId(id)
    const res = await deleteDamageReport(id)
    setLoadingId(null)

    if (res.success) toast.success("Reporte eliminado")
    else toast.error("Error al eliminar")
  }

  const exportExcel = () => {
    const data = reports.map(r => ({
        Fecha: new Date(r.date).toLocaleDateString(),
        Hora: new Date(r.date).toLocaleTimeString(),
        Clave_Prov: r.product.shortCode || "N/A",
        Codigo_Interno: r.product.code,
        Producto: r.product.description,
        Cantidad: r.quantity,
        Motivo: r.reason,
        Notas: r.notes || ""
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    
    // Ajustar ancho de columnas
    const wscols = [{wch:12}, {wch:10}, {wch:15}, {wch:15}, {wch:40}, {wch:10}, {wch:15}, {wch:30}]
    ws['!cols'] = wscols

    XLSX.utils.book_append_sheet(wb, ws, "Reportes")
    XLSX.writeFile(wb, "Reporte_Daños_Perdidas.xlsx")
  }

  const getBadgeColor = (reason: string) => {
      switch(reason) {
          case 'Robo': return 'bg-red-100 text-red-700 border-red-200';
          case 'Pérdida': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'Daño': return 'bg-zinc-100 text-zinc-700 border-zinc-200';
          default: return 'bg-blue-50 text-blue-700 border-blue-100';
      }
  }

  return (
    <div className="space-y-4">
        {/* BARRA DE ACCIONES DE LA TABLA */}
        <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportExcel} className="gap-2 border-zinc-200 text-zinc-600 hover:text-[#232323]">
                <FileSpreadsheet size={14}/> Exportar Historial
            </Button>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-[#232323]">
                    <TableRow className="hover:bg-[#232323] border-b-zinc-700">
                        <TableHead className="text-white w-[160px]">Fecha / Hora</TableHead>
                        <TableHead className="text-white w-[140px]">Clave Prov</TableHead>
                        <TableHead className="text-white">Producto</TableHead>
                        <TableHead className="text-white text-center w-[100px]">Cant.</TableHead>
                        <TableHead className="text-white text-center w-[140px]">Motivo</TableHead>
                        <TableHead className="text-white text-right pr-6 w-[100px]">Acción</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                                Sin reportes registrados.
                            </TableCell>
                        </TableRow>
                    ) : (
                        reports.map((report) => (
                            <TableRow key={report.id} className="hover:bg-zinc-50 transition-colors">
                                <TableCell className="text-xs text-zinc-500">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-zinc-700">{new Date(report.date).toLocaleDateString()}</span>
                                        <span>{new Date(report.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="font-mono text-xs font-medium text-zinc-600">
                                    {report.product.shortCode || "---"}
                                </TableCell>
                                <TableCell className="text-sm font-medium text-[#232323]">
                                    {report.product.description}
                                    {report.notes && (
                                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate max-w-[250px]">
                                            Nota: {report.notes}
                                        </p>
                                    )}
                                </TableCell>
                                <TableCell className="text-center font-bold text-[#232323]">
                                    -{report.quantity}
                                </TableCell>
                                <TableCell className="text-center">
                                    <Badge variant="outline" className={`font-normal border ${getBadgeColor(report.reason)}`}>
                                        {report.reason}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right pr-4">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={() => handleDelete(report.id)}
                                        disabled={loadingId === report.id}
                                        className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                                    >
                                        {loadingId === report.id ? <Loader2 className="animate-spin h-3 w-3"/> : <Trash2 size={16} />}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    </div>
  )
}