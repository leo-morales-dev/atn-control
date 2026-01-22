"use client"

import { useState } from "react"
import { UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { createEmployee } from "@/app/actions/employees"

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createEmployee(formData)
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
        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2">
          <UserPlus size={16} /> Registrar Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nuevo Empleado</DialogTitle>
        </DialogHeader>
        <DialogDescription>
            Ingresa los datos del empleado para habilitarlo en el sistema.
          </DialogDescription>
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">Nombre Completo</label>
            <Input id="name" name="name" placeholder="Ej: Juan Pérez" required />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="employeeNumber" className="text-sm font-medium">
              Nómina / ID <span className="text-zinc-400 font-normal text-xs">(Dejar vacío para auto-generar)</span>
            </label>
            <Input 
              id="employeeNumber" 
              name="employeeNumber" 
              placeholder="Ej: EMP-1234 o Vacío" 
            />
          </div>

          <Button type="submit" disabled={loading} className="mt-2 w-full">
            {loading ? "Guardando..." : "Guardar Empleado"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}