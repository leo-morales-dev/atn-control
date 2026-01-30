import { getEmployees, getEmployeeStats } from "@/app/actions/employees"
import { Search } from "@/components/Search"
import { EmployeeInlineForm } from "@/components/EmployeeInlineForm"
import { Pagination } from "@/components/Pagination"
import { DeleteEmployeeButton } from "@/components/DeleteEmployeeButton"
import { Employee } from "@prisma/client"
import Link from "next/link"
import { Eye, Users, HardHat, CheckCircle2, UserCircle, Printer } from "lucide-react"
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

interface EmployeeWithLoans extends Employee {
    loans?: { id: number }[]
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; filter?: string; page?: string }>
}) {
  const params = await searchParams
  const query = params?.query || ""
  const currentFilter = params?.filter || "all"
  const currentPage = Number(params?.page) || 1
  
  const [employeesData, statsData] = await Promise.all([
    getEmployees(query, currentFilter, currentPage),
    getEmployeeStats()
  ])

  const employees = (employeesData.data || []) as EmployeeWithLoans[]
  const totalPages = employeesData.totalPages || 1
  const stats = statsData.data || { total: 0, active: 0, free: 0 }

  const getCardStyle = (filterKey: string) => {
      const isActive = currentFilter === filterKey
      return isActive 
        ? "bg-[#de2d2d] border-[#de2d2d] text-white shadow-md ring-1 ring-[#de2d2d]"
        : "bg-white border-zinc-200 text-zinc-600 hover:border-[#de2d2d]/50 hover:shadow-sm cursor-pointer transition-all"
  }
  const getIconStyle = (filterKey: string) => {
      const isActive = currentFilter === filterKey
      return isActive ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"
  }
  const getTitleStyle = (filterKey: string) => {
      const isActive = currentFilter === filterKey
      return isActive ? "text-white/90" : "text-zinc-500"
  }
  const getValueStyle = (filterKey: string) => {
      const isActive = currentFilter === filterKey
      return isActive ? "text-white" : "text-zinc-900"
  }

  return (
    <main className="min-h-screen bg-[#f4f4f5] p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* --- ENCABEZADO Y FILTROS (SE MANTIENEN IGUAL) --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#232323]">Directorio de Personal</h1>
                <p className="text-zinc-500 mt-1 text-sm">Administra la plantilla y monitorea el estado de préstamos.</p>
            </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Link href="/employees?filter=all" className="block group">
                <Card className={`border transition-colors duration-200 ${getCardStyle('all')}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-[10px] font-bold uppercase tracking-wider ${getTitleStyle('all')}`}>Total Empleados</CardTitle>
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${getIconStyle('all')}`}><Users size={14} /></div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getValueStyle('all')}`}>{stats.total}</div>
                    </CardContent>
                </Card>
            </Link>

            <Link href="/employees?filter=with_loans" className="block group">
                <Card className={`border transition-colors duration-200 ${getCardStyle('with_loans')}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-[10px] font-bold uppercase tracking-wider ${getTitleStyle('with_loans')}`}>Con Préstamos</CardTitle>
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${getIconStyle('with_loans')}`}><HardHat size={14} /></div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getValueStyle('with_loans')}`}>{stats.active}</div>
                    </CardContent>
                </Card>
            </Link>

             <Link href="/employees?filter=available" className="block group">
                <Card className={`border transition-colors duration-200 ${getCardStyle('available')}`}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className={`text-[10px] font-bold uppercase tracking-wider ${getTitleStyle('available')}`}>Disponibles</CardTitle>
                        <div className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${getIconStyle('available')}`}><CheckCircle2 size={14} /></div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${getValueStyle('available')}`}>{stats.free}</div>
                    </CardContent>
                </Card>
            </Link>
        </div>

        {/* --- LAYOUT PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            <div className="lg:col-span-4 space-y-6">
                <EmployeeInlineForm />
            </div>

            <div className="lg:col-span-8 space-y-6">
                
                <div className="flex items-center gap-4 bg-white p-2 rounded-xl border border-zinc-200 shadow-sm">
                    <div className="flex-1">
                        <Search placeholder="Buscar por nombre, ID o nómina..." />
                    </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden min-h-[400px] flex flex-col justify-between">
                    <div className="overflow-auto">
                        <Table>
                            <TableHeader className="bg-zinc-50/50">
                            <TableRow className="border-zinc-100">
                                <TableHead className="w-[50px] pl-4 py-3 font-semibold text-xs text-zinc-500 uppercase">Avatar</TableHead>
                                <TableHead className="font-semibold text-xs text-zinc-500 uppercase">Colaborador</TableHead>
                                <TableHead className="font-semibold text-xs text-zinc-500 uppercase">ID Auto-Gen</TableHead>
                                <TableHead className="text-center font-semibold text-xs text-zinc-500 uppercase">Estado</TableHead>
                                <TableHead className="text-right pr-4 font-semibold text-xs text-zinc-500 uppercase">Acciones</TableHead>
                            </TableRow>
                            </TableHeader>
                            <TableBody>
                            {(!employees || employees.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-60 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                                                <UserCircle size={24} className="text-zinc-300"/>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="font-medium text-zinc-900">Lista vacía</p>
                                                <p className="text-xs">Usa el formulario de la izquierda para agregar.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                employees.map((employee) => {
                                    const hasLoans = Boolean(employee.loans && employee.loans.length > 0);
                                    
                                    return (
                                    <TableRow key={employee.id} className="hover:bg-zinc-50/50 transition-colors group border-zinc-100">
                                        <TableCell className="pl-4 py-3">
                                            <Avatar className="h-8 w-8 border border-white shadow-sm ring-1 ring-zinc-100">
                                                <AvatarFallback className="bg-zinc-100 text-zinc-600 font-bold text-[10px]">
                                                {employee.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-zinc-700">{employee.name}</span>
                                                <span className="text-[10px] text-zinc-400">ID Ref: {employee.id}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-mono text-[10px] bg-zinc-50 text-zinc-600 border-zinc-200">
                                                {employee.employeeNumber || "PENDIENTE"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {hasLoans ? (
                                                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 shadow-none font-bold text-[10px] px-2 py-0.5 rounded-full">CON PRÉSTAMO</Badge>
                                            ) : (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none font-bold text-[10px] px-2 py-0.5 rounded-full">DISPONIBLE</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <div className="flex justify-end gap-1 opacity-100">
                                                
                                                {/* --- CAMBIO AQUÍ: QUITAMOS target="_blank" --- */}
                                                <Link href={`/print/employee/${employee.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-zinc-900" title="Imprimir Credencial">
                                                        <Printer size={16} />
                                                    </Button>
                                                </Link>

                                                <Link href={`/employees/${employee.id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-blue-600 hover:bg-blue-50" title="Ver Detalles">
                                                        <Eye size={16} />
                                                    </Button>
                                                </Link>

                                                <DeleteEmployeeButton 
                                                    id={employee.id} 
                                                    name={employee.name} 
                                                    hasLoans={hasLoans} 
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    )
                                })
                            )}
                            </TableBody>
                        </Table>
                    </div>
                    
                    <Pagination totalPages={totalPages} currentPage={currentPage} />
                    
                </div>
            </div>
        </div>
      </div>
    </main>
  )
}