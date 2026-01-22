"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateEmployee } from "@/app/actions/employees"

interface Props {
  employee: {
    id: number
    name: string
    employeeNumber: string | null // Puede ser null en la BD
  }
}

export function EditEmployeeDialog({ employee }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await updateEmployee(employee.id, formData)
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-900">
          <Pencil size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Empleado</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Nombre Completo</label>
            <Input name="name" defaultValue={employee.name} required />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Número de Empleado / ID</label>
            <Input name="employeeNumber" defaultValue={employee.employeeNumber || ""} required />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}