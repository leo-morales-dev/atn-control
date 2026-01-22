"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createProduct } from "@/app/actions/products" // Importamos la acción del servidor

export function AddProductDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    // Llamamos a la Server Action que creamos antes
    const result = await createProduct(formData) 
    setLoading(false)

    if (result.success) {
      setOpen(false) // Cerramos el modal si todo salió bien
      // El revalidatePath en el servidor se encargará de refrescar la tabla
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white gap-2">
          <Plus size={16} /> Nuevo Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Material</DialogTitle>
        </DialogHeader>
        
        {/* Usamos action={handleSubmit} para aprovechar las Server Actions */}
        <form action={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="code" className="text-sm font-medium">Código QR (Largo)</label>
            <Input id="code" name="code" placeholder="Ej: ABR-100001" required />
          </div>
          
          <div className="grid gap-2">
            <label htmlFor="shortCode" className="text-sm font-medium">Ubicación / Clave Corta</label>
            <Input id="shortCode" name="shortCode" placeholder="Ej: PASILLO-1" />
          </div>

          <div className="grid gap-2">
            <label htmlFor="description" className="text-sm font-medium">Descripción</label>
            <Input id="description" name="description" placeholder="Ej: Disco de corte 4.5" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label htmlFor="stock" className="text-sm font-medium">Stock Inicial</label>
              <Input id="stock" name="stock" type="number" defaultValue="1" required />
            </div>
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">Categoría</label>
              <select 
                name="category" 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="consumible">Consumible</option>
                <option value="herramienta">Herramienta</option>
              </select>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="mt-4 w-full">
            {loading ? "Guardando..." : "Guardar Producto"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}