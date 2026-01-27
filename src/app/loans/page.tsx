import prisma from "@/lib/prisma"
import { getActiveLoans } from "@/app/actions/loans"
import { NewLoanDialog } from "@/components/NewLoanDialog"
import { ReturnButton } from "@/components/ReturnButton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "@/components/Search"
import { ArrowRightLeft, Clock, CheckCircle2, AlertTriangle, Users } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function LoansPage() {
  const loansData = getActiveLoans()
  const productsData = prisma.product.findMany({ where: { stock: { gt: 0 } } })
  const employeesData = prisma.employee.findMany({ orderBy: { name: 'asc' } })

  const [{ data: loans }, products, employees] = await Promise.all([
    loansData, productsData, employeesData
  ])

  const loansList = loans || []

  // Calculamos KPIs rápidos
  const totalLoans = loansList.length
  // Suponemos que préstamos de más de 3 días son "tardíos" (puedes ajustar esta lógica)
  const lateLoans = loansList.filter((l: any) => {
      const diffTime = Math.abs(new Date().getTime() - new Date(l.dateOut).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays > 3; 
  }).length

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- ENCABEZADO --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Control de Préstamos</h1>
            <p className="text-zinc-500 mt-1">Gestión de entradas y salidas de material.</p>
          </div>
          <div className="flex items-center gap-2">
             {/* Aquí podríamos poner un selector de fechas en el futuro */}
             <NewLoanDialog products={products} employees={employees} />
          </div>
        </div>

        {/* --- TARJETAS DE MÉTRICAS (KPIs) --- */}
        <div className="grid gap-4 md:grid-cols-3">
             <Card className="border-l-4 border-l-blue-500 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-zinc-500 uppercase">Total Activos</CardTitle>
                    <ArrowRightLeft className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">{totalLoans}</div>
                    <p className="text-xs text-zinc-500 mt-1">Herramientas prestadas</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-amber-500 shadow-sm bg-amber-50/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-amber-700 uppercase">Sin Devolver (+3 días)</CardTitle>
                    <Clock className="h-4 w-4 text-amber-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-amber-800">{lateLoans}</div>
                    <p className="text-xs text-amber-600 mt-1">Requieren seguimiento</p>
                </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 shadow-sm">
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-bold text-green-700 uppercase">Disponibilidad</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-zinc-900">98%</div>
                    <p className="text-xs text-zinc-500 mt-1">Sistema operativo</p>
                </CardContent>
            </Card>
        </div>

        {/* --- BARRA DE HERRAMIENTAS --- */}
        <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
             <div className="w-full sm:w-96 relative">
                 <Search placeholder="Buscar por empleado o herramienta..." />
             </div>
             <div className="flex items-center gap-2 text-sm text-zinc-500">
                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                <span>Actualizado en tiempo real</span>
             </div>
        </div>

        {/* --- TABLA PRINCIPAL --- */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader className="bg-zinc-50">
              <TableRow>
                <TableHead className="pl-6">Herramienta / Producto</TableHead>
                <TableHead>Colaborador Responsable</TableHead>
                <TableHead>Fecha de Salida</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead className="text-right pr-6">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(!loansList || loansList.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-48 text-center text-zinc-500">
                     <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-zinc-100 flex items-center justify-center">
                             <CheckCircle2 size={24} className="text-zinc-400"/>
                        </div>
                        <p>No hay préstamos activos. Todo el material está en almacén.</p>
                     </div>
                  </TableCell>
                </TableRow>
              ) : (
                loansList.map((loan: any) => {
                  const isLate = (new Date().getTime() - new Date(loan.dateOut).getTime()) / (1000 * 60 * 60 * 24) > 3;

                  return (
                    <TableRow key={loan.id} className="hover:bg-zinc-50/50 group transition-colors">
                      {/* COLUMNA PRODUCTO */}
                      <TableCell className="pl-6 font-medium">
                         <div className="flex flex-col">
                            <span className="text-zinc-900">{loan.product?.description}</span>
                            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                                {loan.product?.code} 
                                {loan.quantity > 1 && <Badge variant="secondary" className="h-4 px-1 text-[9px]">x{loan.quantity}</Badge>}
                            </span>
                         </div>
                      </TableCell>

                      {/* COLUMNA EMPLEADO (CON AVATAR) */}
                      <TableCell>
                        <div className="flex items-center gap-3">
                           <Avatar className="h-8 w-8 border border-zinc-200">
                                <AvatarFallback className="bg-zinc-100 text-zinc-600 text-[10px] font-bold">
                                    {loan.employee?.name?.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                           </Avatar>
                           <div className="flex flex-col">
                               <span className="text-sm font-medium text-zinc-700">{loan.employee?.name}</span>
                               <span className="text-[10px] text-zinc-400">ID: {loan.employee?.employeeNumber || "---"}</span>
                           </div>
                        </div>
                      </TableCell>

                      {/* COLUMNA FECHA */}
                      <TableCell className="text-zinc-500 text-sm">
                        <div className="flex items-center gap-2">
                             <Clock size={14} className="text-zinc-300"/>
                             {new Date(loan.dateOut).toLocaleDateString()}
                             <span className="text-xs text-zinc-400 ml-1">
                                {new Date(loan.dateOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                        </div>
                      </TableCell>

                      {/* COLUMNA ESTADO */}
                      <TableCell className="text-center">
                        {isLate ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 pr-2">
                                <AlertTriangle size={10} /> +3 días
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                En uso
                            </Badge>
                        )}
                      </TableCell>

                      {/* COLUMNA ACCIÓN (BOTÓN DEVOLVER) */}
                      <TableCell className="text-right pr-6">
                         <ReturnButton id={loan.id} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </main>
  )
}