"use client"

import { useState } from "react"
import { Pencil } from "lucide-react" // Icono de lápiz
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateProduct } from "../app/actions/product"

// Definimos qué datos necesita este componente para funcionar
interface Props {
  product: {
    id: number
    code: string
    description: string
    category: string
    stock: number
    minStock: number
  }
}

export function EditProductDialog({ product }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    // Pasamos el ID del producto + los datos del formulario
    const result = await updateProduct(product.id, formData)
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
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Código</label>
            <Input name="code" defaultValue={product.code} required />
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Descripción</label>
            <Input name="description" defaultValue={product.description} required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
                <label className="text-sm font-medium">Categoría</label>
                <select 
                    name="category" 
                    defaultValue={product.category}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <option value="Herramienta">Herramienta</option>
                    <option value="Consumible">Consumible</option>
                    <option value="EPP">EPP (Seguridad)</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>

            <div className="grid gap-2">
                <label className="text-sm font-medium">Stock Actual</label>
                <Input name="stock" type="number" defaultValue={product.stock} required />
            </div>

                {/* NUEVO CAMPO */}
                <div className="grid gap-2">
                    <label className="text-sm font-medium text-red-600">Alerta Mínima</label>
                    <Input name="minStock" type="number" defaultValue={product.minStock} required className="bg-red-50 border-red-100" />
                </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-zinc-900 text-white">
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}