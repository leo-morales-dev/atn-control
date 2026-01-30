"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteEmployee } from "@/app/actions/employees" // Crearemos esta función en el paso 2
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Props {
  id: number
  name: string
  hasLoans: boolean
}

export function DeleteEmployeeButton({ id, name, hasLoans }: Props) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (hasLoans) {
        toast.error("No se puede eliminar", {
            description: "El empleado tiene herramientas prestadas. Deben devolverlas primero."
        })
        setOpen(false)
        return
    }

    setLoading(true)
    const result = await deleteEmployee(id)
    setLoading(false)

    if (result.success) {
      toast.success("Empleado eliminado")
      setOpen(false)
      router.refresh()
    } else {
      toast.error("Error", { description: result.error })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50" title="Eliminar Empleado">
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Trash2 size={16} />}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar a {name}?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se eliminará al empleado del directorio, pero su historial de préstamos pasados permanecerá como registro.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
                e.preventDefault()
                handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? "Eliminando..." : "Sí, Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}