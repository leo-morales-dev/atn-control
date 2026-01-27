"use client"

import { useState } from "react"
import { ArrowRightLeft, Loader2, User, Wrench, Calendar, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createLoan } from "@/app/actions/loans"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"
import { toast } from "sonner"

interface Props {
  products: any[]
  employees: any[]
}

export function NewLoanDialog({ products, employees }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("")
  const [selectedEmployee, setSelectedEmployee] = useState("")

  async function handleSubmit(formData: FormData) {
    if(!selectedProduct) {
        toast.error("Debes seleccionar un producto")
        return
    }
    if(!selectedEmployee) {
        toast.error("Debes seleccionar un empleado")
        return
    }

    setLoading(true)
    // Agregamos manualmente los IDs seleccionados al FormData
    formData.append("productId", selectedProduct)
    formData.append("employeeId", selectedEmployee)

    const result = await createLoan(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Préstamo registrado correctamente")
      setOpen(false)
      setSelectedProduct("")
      setSelectedEmployee("")
    } else {
      toast.error(result.error || "Error al procesar el préstamo")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2 shadow-sm transition-all hover:scale-[1.02]">
          <ArrowRightLeft size={16} /> Prestar Material
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                 <ArrowRightLeft size={16}/>
            </div>
            Registrar Salida
          </DialogTitle>
          <DialogDescription>
            Asigna herramienta o material a un colaborador.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-5 py-2">
          
          {/* SELECCIÓN DE EMPLEADO */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                <User size={12}/> Colaborador
            </Label>
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="h-10 bg-zinc-50/50 border-zinc-200">
                    <SelectValue placeholder="Seleccionar empleado..." />
                </SelectTrigger>
                <SelectContent>
                    {employees.map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>
                            <span className="font-medium">{e.name}</span> 
                            <span className="text-zinc-400 text-xs ml-2">({e.employeeNumber})</span>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          {/* SELECCIÓN DE PRODUCTO (USAMOS TU COMPONENTE AVANZADO) */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
                <Wrench size={12}/> Herramienta / Insumo
            </Label>
            <SearchableProductSelect 
                products={products} 
                value={selectedProduct} 
                onChange={setSelectedProduct} 
            />
             <p className="text-[10px] text-zinc-400">
                Solo se muestran productos con stock disponible.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-zinc-500 uppercase">Cantidad</Label>
                <Input 
                    type="number" 
                    name="quantity" 
                    defaultValue="1" 
                    min="1" 
                    className="text-center font-bold" 
                />
              </div>
              
              <div className="space-y-2">
                 <Label className="text-xs font-semibold text-zinc-500 uppercase">Fecha</Label>
                 <div className="h-10 flex items-center justify-center bg-zinc-100 rounded-md text-sm text-zinc-500 border border-zinc-200 cursor-not-allowed">
                    <Calendar size={14} className="mr-2"/> Hoy
                 </div>
              </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-md border border-amber-100 flex gap-3 items-start">
             <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0"/>
             <p className="text-xs text-amber-800">
                Al registrar este préstamo, el stock se descontará automáticamente del inventario general.
             </p>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-10 mt-2">
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : "Confirmar Préstamo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}