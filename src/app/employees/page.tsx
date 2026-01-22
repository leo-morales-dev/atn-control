import { getEmployees } from "@/app/actions/employees"
import { AddEmployeeDialog } from "@/components/AddEmployeeDialog"
import { EditEmployeeDialog } from "@/components/EditEmployeeDialog"
import { Search } from "@/components/Search"
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export const dynamic = 'force-dynamic'

// Recibimos los parámetros de búsqueda (searchParams)
export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>
}) {
  // 1. Procesar la búsqueda
  const params = await searchParams
  const query = params?.query || ""
  
  // 2. Obtener empleados filtrados
  const { data: employees } = await getEmployees(query)

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Encabezado y Buscador */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Personal</h1>
            <p className="text-zinc-500 mt-1">Directorio de empleados habilitados para préstamos.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-64">
                <Search placeholder="Buscar por nombre o nómina..." />
            </div>
            <AddEmployeeDialog />
          </div>
        </div>

        {/* Tabla */}
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
                    {query ? "No se encontraron empleados con esa búsqueda." : "No hay empleados registrados."}
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((employee: Employee) => (
                  <TableRow key={employee.id} className="hover:bg-zinc-50/50 transition-colors">
                    <TableCell>
                      <Avatar className="h-9 w-9 border border-zinc-200">
                        <AvatarFallback className="bg-zinc-100 text-zinc-600 text-xs font-bold">
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
                    
                    {/* Acciones unificadas en una sola celda para mantener el orden */}
                    <TableCell className="text-right flex justify-end gap-2">
                        {/* Botón Imprimir Credencial */}
                        <Link 
                          href={`/print/employee/${employee.id}`} 
                          target="_blank"
                          className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
                          title="Imprimir Credencial"
                        >
                          <Printer size={16} />
                        </Link>

                        {/* Botón Editar */}
                        <EditEmployeeDialog employee={employee} />
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