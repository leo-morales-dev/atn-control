import { getEmployees, getEmployeeStats } from "@/app/actions/employees"
import { Search } from "@/components/Search"
import { EmployeeRegistrationForm } from "@/components/EmployeeRegistrationForm" // <--- IMPORTANTE
import { Employee } from "@prisma/client"
import Link from "next/link"
import { Eye, Printer, Users, HardHat, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string }>
}) {
  const params = await searchParams
  const query = params?.query || ""
  
  const [employeesData, statsData] = await Promise.all([
    getEmployees(query),
    getEmployeeStats()
  ])

  const employees = employeesData.data || []
  const stats = statsData.data || { total: 0, active: 0, free: 0 }

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- 1. ENCABEZADO (Solo Título) --- */}
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Personal</h1>
            <p className="text-zinc-500 mt-1 text-sm">Gestión de plantilla y credenciales.</p>
        </div>

        {/* --- 2. TARJETAS DE MÉTRICAS (Debajo del Título) --- */}
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-sm border-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Plantilla Total</CardTitle>
                    <Users className="h-4 w-4 text-zinc-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{stats.total}</div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-zinc-200 bg-amber-50/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-amber-600 uppercase">Con Herramienta</CardTitle>
                    <HardHat className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{stats.active}</div>
                    <p className="text-xs text-amber-600 mt-1">Tienen préstamos activos</p>
                </CardContent>
            </Card>

             <Card className="shadow-sm border-zinc-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-green-600 uppercase">Sin Adeudos</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{stats.free}</div>
                    <p className="text-xs text-zinc-400 mt-1">Disponibles</p>
                </CardContent>
            </Card>
        </div>

        {/* --- 3. LAYOUT PRINCIPAL (Formulario Izq | Tabla Der) --- */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
            
            {/* COLUMNA IZQUIERDA: FORMULARIO FIJO */}
            <div className="lg:col-span-4 xl:col-span-3">
                <EmployeeRegistrationForm />
            </div>

            {/* COLUMNA DERECHA: TABLA Y BUSCADOR */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-4">
                {/* Buscador */}
                <div className="bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
                    <Search placeholder="Buscar empleado por nombre o nómina..." />
                </div>

                {/* Tabla */}
                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-zinc-50">
                        <TableRow>
                            <TableHead className="w-[60px] pl-4">Avatar</TableHead>
                            <TableHead>Colaborador</TableHead>
                            <TableHead>Nómina</TableHead>
                            <TableHead className="text-center">Estatus</TableHead>
                            <TableHead className="text-right pr-4">Acciones</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {(!employees || employees.length === 0) ? (
                            <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Users size={32} className="opacity-20"/>
                                    <p>{query ? "Sin resultados." : "Lista vacía."}</p>
                                </div>
                            </TableCell>
                            </TableRow>
                        ) : (
                            employees.map((employee: Employee) => (
                            <TableRow key={employee.id} className="hover:bg-zinc-50/50 transition-colors group">
                                <TableCell className="pl-4">
                                <Avatar className="h-9 w-9 border border-zinc-200">
                                    <AvatarFallback className="bg-zinc-100 text-zinc-700 font-bold text-xs">
                                    {employee.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                </TableCell>
                                
                                <TableCell className="font-medium text-zinc-900">
                                {employee.name}
                                </TableCell>
                                
                                <TableCell className="text-zinc-500 font-mono text-xs">
                                    {employee.employeeNumber || "—"}
                                </TableCell>

                                <TableCell className="text-center">
                                    <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100 shadow-none font-normal text-[10px]">
                                        Activo
                                    </Badge>
                                </TableCell>
                                
                                <TableCell className="text-right pr-4">
                                <div className="flex justify-end gap-1">
                                    <Link 
                                        href={`/print/employee/${employee.id}`} 
                                        target="_blank"
                                    >
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" title="Imprimir Credencial">
                                            <Printer size={16} />
                                        </Button>
                                    </Link>

                                    <Link href={`/employees/${employee.id}`}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:bg-blue-50" title="Ver Expediente">
                                            <Eye size={16} />
                                        </Button>
                                    </Link>
                                </div>
                                </TableCell>
                            </TableRow>
                            ))
                        )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
      </div>
    </main>
  )
}