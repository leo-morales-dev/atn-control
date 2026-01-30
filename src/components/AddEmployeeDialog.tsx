"use client"

import { useState } from "react"
import { UserPlus, Loader2, Save, Fingerprint, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { createEmployee } from "@/app/actions/employees"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function AddEmployeeDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createEmployee(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Empleado registrado exitosamente")
      setOpen(false)
      router.refresh()
    } else {
      toast.error("Error al registrar", { description: result.error })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#232323] hover:bg-[#232323]/90 text-white gap-2 h-9 text-xs font-bold uppercase shadow-sm">
          <UserPlus size={16} /> Nuevo Empleado
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] border-zinc-200 p-0 overflow-hidden">
        <DialogHeader className="bg-zinc-50/50 px-6 py-4 border-b border-zinc-100">
          <DialogTitle className="flex items-center gap-2 text-[#232323]">
             <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                <UserPlus size={16} />
             </div>
             Nuevo Colaborador
          </DialogTitle>
          <DialogDescription className="text-zinc-500 text-xs">
            Ingresa los datos para dar de alta un nuevo empleado en el sistema.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="px-6 py-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <User size={14} /> Nombre Completo
            </Label>
            <Input 
                id="name" 
                name="name" 
                placeholder="Ej: Juan Pérez González" 
                required 
                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-10"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="employeeNumber" className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
               <Fingerprint size={14} /> Nómina / ID <span className="text-zinc-400 font-normal text-[10px] ml-auto lowercase normal-case">(Opcional: Dejar vacío para auto-generar)</span>
            </Label>
            <Input 
              id="employeeNumber" 
              name="employeeNumber" 
              placeholder="Ej: EMP-2024-001" 
              className="bg-zinc-50 border-zinc-200 font-mono text-zinc-600 h-10"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="w-full bg-[#232323] hover:bg-[#232323]/90 text-white font-bold h-10">
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4" />}
                {loading ? "Registrando..." : "Guardar Empleado"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}