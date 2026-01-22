import prisma from "@/lib/prisma"
import { getActiveLoans } from "@/app/actions/loans"
import { NewLoanDialog } from "@/components/NewLoanDialog"
import { ReturnButton } from "@/components/ReturnButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  // 1. Obtener datos paralelos (Préstamos, Productos Disponibles, Empleados)
  const loansData = getActiveLoans()
  const productsData = prisma.product.findMany({ where: { stock: { gt: 0 } } }) // Solo con stock > 0
  const employeesData = prisma.employee.findMany({ orderBy: { name: 'asc' } })

  // Esperar a que todo cargue
  const [{ data: loans }, products, employees] = await Promise.all([
    loansData, productsData, employeesData
  ])

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Préstamos Activos</h1>
            <p className="text-zinc-500 mt-1">Material actualmente fuera del almacén.</p>
          </div>
          {/* Pasamos los productos y empleados al formulario */}
          <NewLoanDialog products={products} employees={employees} />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Empleado</TableHead>
                <TableHead>Fecha Salida</TableHead>
                <TableHead className="text-center">Cant.</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!loans || loans.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-zinc-500">
                    No hay préstamos activos. Todo está en orden.
                  </TableCell>
                </TableRow>
              ) : (
                loans.map((loan: any) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">
                      {loan.product?.description}
                      <div className="text-xs text-zinc-500">{loan.product?.code}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <span className="font-medium text-zinc-700">{loan.employee?.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-zinc-500 text-sm">
                      {new Date(loan.dateOut).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary">{loan.quantity}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <ReturnButton id={loan.id} />
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