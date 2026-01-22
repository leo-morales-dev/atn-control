"use client"

import { useState } from "react"
import { ArrowRightLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createLoan } from "@/app/actions/loans"

// Definimos qué datos necesitamos recibir
interface Props {
  products: any[]
  employees: any[]
}

export function NewLoanDialog({ products, employees }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createLoan(formData)
    setLoading(false)

    if (result.success) {
      setOpen(false)
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white gap-2">
          <ArrowRightLeft size={16} /> Prestar Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Salida</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Empleado</label>
            <select name="employeeId" className="flex h-10 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm" required>
              <option value="">Seleccionar...</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.employeeNumber})</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Herramienta / Producto</label>
            <select name="productId" className="flex h-10 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm" required>
              <option value="">Seleccionar...</option>
              {products.map(p => (
                <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                   {p.description} (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
             <label className="text-sm font-medium">Cantidad</label>
             <input type="number" name="quantity" defaultValue="1" min="1" className="flex h-10 w-full rounded-md border px-3" />
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Procesando..." : "Confirmar Préstamo"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}