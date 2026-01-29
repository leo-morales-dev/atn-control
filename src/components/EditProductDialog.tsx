"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Loader2, Save, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { updateProduct } from "@/app/actions/product"
import { toast } from "sonner" // Importamos las alertas bonitas

interface Product {
  id: number
  code: string
  shortCode: string | null
  description: string
  category: string
  minStock: number
}

export function EditProductDialog({ product }: { product: Product }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Estados locales para el formulario
  const [category, setCategory] = useState(product.category)

  // --- SANITIZACIÓN DE INPUTS ---
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Elimina cualquier caracter que no sea número (0-9)
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value
        .toUpperCase()
        .replace(/\s/g, '')
        .replace(/'/g, '-'); // <--- MAGIA AQUÍ
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append("id", product.id.toString())
    formData.append("category", category)

    const code = formData.get("code") as string;
    const description = formData.get("description") as string;

    // Validaciones básicas antes de enviar
    if (!code.trim()) {
        toast.error("Falta Código", { description: "El código QR no puede estar vacío." });
        setLoading(false);
        return;
    }
    if (!description.trim()) {
        toast.error("Falta Descripción", { description: "El nombre del producto es obligatorio." });
        setLoading(false);
        return;
    }

    const res = await updateProduct(formData)
    setLoading(false)

    if (res.success) {
      toast.success("Producto Actualizado", { description: "Los cambios se han guardado correctamente." })
      setOpen(false)
      router.refresh()
    } else {
      // AQUÍ ES DONDE CAMBIAMOS LA ALERTA POR DEFECTO POR LA DE SONNER
      // Si el error es por duplicado (Prisma error P2002), el server action suele devolver el mensaje
      toast.error("Error al actualizar", { 
          description: res.error.includes("Unique constraint") 
            ? "Ese Código QR ya está registrado en otro producto." 
            : res.error 
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-[#232323] hover:bg-zinc-100">
          <Pencil size={16} />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#232323]">
            <div className="bg-[#232323] p-1.5 rounded-md">
                <Pencil size={14} className="text-white"/>
            </div>
            Editar Producto
          </DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="grid gap-4 py-4">
          
          {/* CÓDIGO QR */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right text-xs font-bold text-zinc-500 uppercase">
              Código
            </Label>
            <Input
              id="code"
              name="code"
              defaultValue={product.code}
              onChange={handleCodeInput} // Sanitización
              className="col-span-3 font-mono uppercase"
            />
          </div>

          {/* REF PROVEEDOR */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="shortCode" className="text-right text-xs font-bold text-zinc-500 uppercase">
              Ref. Prov
            </Label>
            <Input
              id="shortCode"
              name="shortCode"
              defaultValue={product.shortCode || ""}
              className="col-span-3 font-mono text-zinc-600"
              placeholder="Opcional"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-xs font-bold text-zinc-500 uppercase">
              Descripción
            </Label>
            <Input
              id="description"
              name="description"
              defaultValue={product.description}
              className="col-span-3"
            />
          </div>

          {/* CATEGORÍA (SIN EPP) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right text-xs font-bold text-zinc-500 uppercase">
              Categoría
            </Label>
            <div className="col-span-3">
                <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                    <SelectItem value="Consumible">Consumible</SelectItem>
                    {/* Se eliminó la opción EPP */}
                </SelectContent>
                </Select>
            </div>
          </div>

          {/* STOCK MÍNIMO (SANITIZADO) */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStock" className="text-right text-xs font-bold text-red-500 uppercase flex items-center justify-end gap-1">
              Min <AlertTriangle size={10}/>
            </Label>
            <Input
              id="minStock"
              name="minStock"
              defaultValue={product.minStock}
              onChange={handleNumberInput} // Sanitización (Solo números)
              className="col-span-3 text-center font-bold text-red-600 bg-red-50 border-red-100 focus:border-red-300"
              inputMode="numeric"
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={loading} className="bg-[#232323] hover:bg-[#232323]/90 text-white font-bold w-full sm:w-auto">
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save size={16} className="mr-2" />}
              Guardar Cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}