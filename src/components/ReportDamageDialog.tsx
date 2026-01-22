"use client"

import { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription // Agregado para accesibilidad
} from "@/components/ui/dialog"
import { reportDamage } from "@/app/actions/damages"

interface Props {
  products: any[]
  employees: any[]
}

export function ReportDamageDialog({ products, employees }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await reportDamage(formData)
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
        <Button variant="destructive" className="gap-2 bg-red-600 hover:bg-red-700 text-white">
          <AlertTriangle size={16} /> Reportar Daño
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reportar Avería o Pérdida</DialogTitle>
          <DialogDescription>
            Registra un incidente para ajustar el inventario y el historial.
          </DialogDescription>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Origen del problema</label>
            <select name="type" className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm" required>
                <option value="directo">Daño en Almacén (Restar Stock)</option>
                <option value="prestamo">Devolución Rota (Cerrar Préstamo)</option>
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Producto Afectado</label>
            <select name="productId" className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm" required>
              <option value="">Seleccionar...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.description} ({p.code})</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Empleado Responsable (Opcional)</label>
            <select name="employeeId" className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm">
              <option value="">Nadie / Desconocido</option>
              {employees.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
             <label className="text-sm font-medium">Descripción del daño</label>
             <Textarea 
                name="description" 
                placeholder="Ej: Motor quemado por sobreuso..." 
                required 
             />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
            {loading ? "Registrando..." : "Confirmar Baja"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}