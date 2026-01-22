import { getHistory } from "@/app/actions/history"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function HistoryPage() {
  const { data: history } = await getHistory()

  // Función auxiliar para elegir el color según el estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'prestado':
        return <Badge variant="outline" className="border-orange-500 text-orange-600 bg-orange-50">En uso</Badge>
      case 'devuelto':
        return <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">Devuelto</Badge>
      case 'consumido':
        return <Badge variant="secondary" className="bg-zinc-200 text-zinc-700">Consumido</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Historial General</h1>
            <p className="text-zinc-500 mt-1">Registro cronológico de todos los movimientos (últimos 50).</p>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead>Fecha Salida</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Producto / Código</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead>Estado Actual</TableHead>
                <TableHead>Fecha Retorno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!history || history.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                    No hay movimientos registrados en el sistema.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((record: any) => (
                  <TableRow key={record.id} className="hover:bg-zinc-50/50">
                    <TableCell className="text-zinc-600 font-medium text-sm">
                      {new Date(record.dateOut).toLocaleDateString()} 
                      <span className="text-xs text-zinc-400 ml-1">
                        {new Date(record.dateOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-zinc-900">
                        {record.employee ? record.employee.name : <span className="text-red-400 italic">Eliminado</span>}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {record.backupEmployee || record.employee?.employeeNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="block text-zinc-800">{record.product ? record.product.description : record.backupProduct}</span>
                      <span className="text-xs font-mono text-zinc-400">
                        {record.product ? record.product.code : "N/A"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center font-bold text-zinc-600">
                      {record.quantity}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(record.status)}
                    </TableCell>
                    <TableCell className="text-sm text-zinc-500">
                      {record.dateReturn ? new Date(record.dateReturn).toLocaleDateString() : "-"}
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