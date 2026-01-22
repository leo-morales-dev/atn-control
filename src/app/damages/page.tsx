import prisma from "@/lib/prisma"
import { getIncidents } from "@/app/actions/damages"
import { ReportDamageDialog } from "@/components/ReportDamageDialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export const dynamic = 'force-dynamic'

export default async function DamagesPage() {
  const { data: incidents } = await getIncidents()
  const products = await prisma.product.findMany({ orderBy: { description: 'asc' }})
  const employees = await prisma.employee.findMany({ orderBy: { name: 'asc' }})

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Reportes y Daños</h1>
            <p className="text-zinc-500 mt-1">Bitácora de herramientas averiadas o perdidas.</p>
          </div>
          <ReportDamageDialog products={products} employees={employees} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-red-50">
              <TableRow>
                <TableHead className="text-red-900">Fecha</TableHead>
                <TableHead className="text-red-900">Producto</TableHead>
                <TableHead className="text-red-900">Responsable</TableHead>
                <TableHead className="text-red-900">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!incidents || incidents.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                    No hay incidentes reportados. ¡Todo marcha bien!
                  </TableCell>
                </TableRow>
              ) : (
                incidents.map((item: any) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs text-zinc-500">
                      {new Date(item.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {item.product?.description}
                    </TableCell>
                    <TableCell>
                      {item.employee ? item.employee.name : "—"}
                    </TableCell>
                    <TableCell className="text-zinc-600 max-w-md truncate" title={item.description}>
                      {item.description}
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