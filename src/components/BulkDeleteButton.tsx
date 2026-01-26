"use client"

import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { deleteProducts } from "@/app/actions/product"

export function BulkDeleteButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentFilter = searchParams.get("filter") || "all"

  const getLabel = () => {
    switch (currentFilter) {
      case "Herramienta": return "Borrar Herramientas"
      case "Consumible": return "Borrar Consumibles"
      case "low_stock": return "Borrar Stock Bajo"
      default: return "Borrar Todo"
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    const result = await deleteProducts(currentFilter)
    setLoading(false)

    if (result.success) {
      setOpen(false)
      if (currentFilter !== 'all') {
         router.push('/inventory') 
      }
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <>
      <Button 
        variant="destructive" 
        onClick={() => setOpen(true)}
        className="gap-2 bg-red-600 hover:bg-red-700 text-white shadow-sm"
      >
        <Trash2 size={16} />
        {getLabel()}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} />
              ¿Estás seguro?
            </DialogTitle>
            <DialogDescription className="pt-2 text-zinc-600">
              Se eliminarán de la lista de inventario los productos de la categoría: 
              <span className="font-bold text-zinc-900 block mt-1">{getLabel()}</span>
              <br/>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md inline-block">
                Nota: El historial de préstamos se conservará.
              </span>
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirmar Eliminación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}