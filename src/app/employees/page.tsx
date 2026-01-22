import { getEmployees } from "@/app/actions/employees"
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog"
import { Employee } from "@prisma/client"
import Link from "next/link"
import { Printer } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar" // Necesitaremos instalar esto abajo

export const dynamic = 'force-dynamic'

export default async function EmployeesPage() {
  const { data: employees } = await getEmployees()

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Personal</h1>
            <p className="text-zinc-500 mt-1">Directorio de empleados habilitados para préstamos.</p>
          </div>
          <AddEmployeeDialog />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>ID / Nómina</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!employees || employees.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-zinc-500">
                    No hay empleados registrados.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee: Employee) => (
                  <TableRow key={employee.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell>
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs">
                          {employee.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-zinc-900">
                      {employee.name}
                    </TableCell>
                    <TableCell className="text-zinc-500 font-mono text-sm">
                      {employee.employeeNumber || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <button className="text-sm text-zinc-500 hover:text-zinc-900 underline">
                        Historial
                      </button>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                    {/* Botón de Imprimir */}
                    <Link 
                      href={`/print/employee/${employee.id}`} 
                      target="_blank" // ¡Importante! Abre nueva pestaña
                      className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
                      title="Imprimir Credencial"
                    >
                      <Printer size={16} />
                    </Link>
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