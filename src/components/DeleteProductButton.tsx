"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import { deleteProductById } from "@/app/actions/product"
import { toast } from "sonner" // O usa alert() si no tienes sonner

interface Props {
  productId: number
  description: string
}

export function DeleteProductButton({ productId, description }: Props) {
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteProductById(productId)
    
    if (!result.success) {
      alert("Error al eliminar: " + result.error)
      setLoading(false)
    }
    // Si es exitoso, Next.js recargará la página automáticamente gracias a revalidatePath
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-zinc-400 hover:text-red-600 hover:bg-red-50"
            title="Eliminar producto"
        >
          <Trash2 size={16} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar este producto?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de archivar: <span className="font-bold text-zinc-900">{description}</span>.
            <br />
            Desaparecerá del inventario activo, pero su historial de préstamos se conservará.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
              e.preventDefault() // Evita que se cierre solo antes de terminar
              handleDelete()
            }}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sí, Eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}