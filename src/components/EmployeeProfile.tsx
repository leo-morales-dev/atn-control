"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, User, History, Package, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updateEmployee } from "@/app/actions/employees"
import { toast } from "sonner"

interface Props {
  employee: any
  history: any[]
}

export function EmployeeProfile({ employee, history }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  async function handleSubmit(formData: FormData) {
    setSaving(true)
    const result = await updateEmployee(employee.id, formData)
    setSaving(false)
    
    if (result.success) {
      toast.success("Información actualizada correctamente")
      router.refresh()
    } else {
      toast.error("Error al actualizar: " + result.error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* CABECERA DE NAVEGACIÓN */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
            <Button variant="outline" size="icon" className="h-9 w-9">
                <ArrowLeft size={16} />
            </Button>
        </Link>
        <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{employee.name}</h1>
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
                <Badge variant="secondary" className="font-mono">ID: {employee.employeeNumber || "S/N"}</Badge>
                <span>•</span>
                <span>Expediente de Personal</span>
            </div>
        </div>
      </div>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 bg-zinc-100/80">
            <TabsTrigger value="history">Historial de Movimientos</TabsTrigger>
            <TabsTrigger value="profile">Editar Perfil</TabsTrigger>
        </TabsList>

        {/* --- PESTAÑA 1: HISTORIAL (Lo más importante primero) --- */}
        <TabsContent value="history" className="mt-6">
            <Card className="border-zinc-200 shadow-sm">
                <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <History className="text-blue-600" size={20}/> Registro de Actividad
                            </CardTitle>
                            <CardDescription>
                                Histórico de préstamos, devoluciones y consumo de materiales.
                            </CardDescription>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-zinc-900">{history.length}</span>
                            <p className="text-xs text-zinc-500 font-medium uppercase">Movimientos Totales</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-zinc-50">
                            <TableRow>
                                <TableHead className="w-[140px]">Fecha</TableHead>
                                <TableHead>Producto / Herramienta</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead className="text-center">Estatus</TableHead>
                                <TableHead className="text-right">Devolución</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package size={32} className="opacity-20"/>
                                            <span>Sin movimientos registrados</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                history.map((loan) => {
                                    const isReturned = !!loan.dateReturn
                                    const isConsumable = loan.status === 'consumido'
                                    
                                    return (
                                        <TableRow key={loan.id} className="hover:bg-zinc-50/50">
                                            <TableCell className="text-zinc-600">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-xs">
                                                        {new Date(loan.dateOut).toLocaleDateString()}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-400">
                                                        {new Date(loan.dateOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            
                                            <TableCell className="font-medium text-zinc-800">
                                                {loan.product?.description || loan.backupProduct || "Producto desconocido"}
                                                {loan.quantity > 1 && (
                                                    <Badge variant="outline" className="ml-2 text-[10px] h-5 bg-white">
                                                        x{loan.quantity}
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] font-normal text-zinc-500 bg-zinc-100 border border-zinc-200">
                                                    {loan.product?.category || "N/A"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="text-center">
                                                {isConsumable ? (
                                                    <Badge className="bg-purple-50 text-purple-700 border-purple-200 shadow-none hover:bg-purple-100">
                                                        Consumido
                                                    </Badge>
                                                ) : isReturned ? (
                                                    <Badge className="bg-green-50 text-green-700 border-green-200 shadow-none hover:bg-green-100">
                                                        Devuelto
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 shadow-none hover:bg-amber-100 flex w-fit mx-auto items-center gap-1">
                                                        <Clock size={10} /> Pendiente
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="text-right text-xs text-zinc-500">
                                                {loan.dateReturn ? (
                                                    <div className="flex flex-col items-end">
                                                        <span>{new Date(loan.dateReturn).toLocaleDateString()}</span>
                                                        <span className="text-[10px] opacity-70">
                                                            {new Date(loan.dateReturn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    isConsumable ? "-" : <span className="text-amber-600 font-bold text-[10px]">EN USO</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- PESTAÑA 2: EDITAR DATOS --- */}
        <TabsContent value="profile" className="mt-6">
             <Card className="max-w-2xl border-zinc-200 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <User className="text-zinc-500" size={20}/> Datos Personales
                    </CardTitle>
                    <CardDescription>
                        Actualiza la información básica del empleado.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-6">
                        <div className="grid gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900">Nombre Completo</label>
                                <Input 
                                    name="name" 
                                    defaultValue={employee.name} 
                                    required 
                                    className="bg-white" 
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-900">Número de Empleado / ID</label>
                                <Input 
                                    name="employeeNumber" 
                                    defaultValue={employee.employeeNumber || ""} 
                                    required 
                                    className="bg-white font-mono" 
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                            <Button type="button" variant="ghost" onClick={() => router.back()}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-zinc-900 text-white hover:bg-zinc-800 min-w-[140px]">
                                {saving ? "Guardando..." : <><Save size={16} className="mr-2"/> Guardar Cambios</>}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}