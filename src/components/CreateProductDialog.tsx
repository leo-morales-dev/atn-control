"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs" // <--- IMPORTANTE
import { Plus, Link as LinkIcon, Box } from "lucide-react"
import { createOrUpdateProduct } from "@/app/actions/product"
import { toast } from "sonner"
import { SearchableProductSelect } from "@/components/SearchableProductSelect" // <--- REUTILIZAMOS

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
  existingProducts: Product[] // Necesitamos la lista para el buscador
}

export function CreateProductDialog({ existingProducts }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create") // 'create' | 'link'
  
  // Estado para MODO VINCULAR
  const [selectedProductId, setSelectedProductId] = useState("")
  
  // Estado para CATEGORÍA
  const [category, setCategory] = useState("Herramienta")

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    // Agregamos manualmente el modo y datos extra al FormData
    formData.append("mode", activeTab)
    if (activeTab === "link") {
        formData.append("linkedProductId", selectedProductId)
    } else {
        formData.append("category", category)
    }

    const res = await createOrUpdateProduct(formData)

    if (res.success) {
      toast.success(activeTab === "create" ? "Producto creado" : "Stock actualizado")
      setOpen(false)
      // Resetear campos básicos si es necesario
    } else {
      toast.error("Error: " + res.error)
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
          <Plus size={18} /> Nuevo Ingreso
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Entrada de Material</DialogTitle>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4 mt-2">
            
            <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
                    <TabsTrigger value="link">Sumar a Existente</TabsTrigger>
                </TabsList>

                {/* --- PESTAÑA 1: CREAR NUEVO --- */}
                <TabsContent value="create" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Código Interno / QR</Label>
                            <Input name="code" placeholder="Escanear o escribir..." required={activeTab === 'create'} />
                        </div>
                        <div className="space-y-2">
                            <Label>Ref. Proveedor (Opcional)</Label>
                            <Input name="shortCode" placeholder="Ej: PROV-123" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input name="description" placeholder="Nombre del producto..." required={activeTab === 'create'} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                                    <SelectItem value="Consumible">Consumible</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Stock Mínimo</Label>
                            <Input name="minStock" type="number" defaultValue="5" />
                        </div>
                    </div>
                </TabsContent>

                {/* --- PESTAÑA 2: VINCULAR --- */}
                <TabsContent value="link" className="space-y-4">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <Label className="text-blue-700 mb-2 block flex items-center gap-2">
                            <LinkIcon size={14}/> Buscar Producto en Inventario
                        </Label>
                        <SearchableProductSelect 
                            products={existingProducts}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                        />
                     </div>

                     <div className="space-y-2">
                        <Label>Nueva Ref. Proveedor (Opcional)</Label>
                        <Input 
                            name="shortCode" 
                            placeholder="Si la factura trae un código nuevo..." 
                        />
                        <p className="text-[10px] text-zinc-400">
                            Si escribes algo aquí, se agregará a la lista de referencias del producto.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- CAMPOS COMUNES (Cantidad y Botón) --- */}
            <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-end gap-4">
                    <div className="flex-1 space-y-2">
                        <Label>Cantidad a Ingresar</Label>
                        <Input 
                            name="quantity" 
                            type="number" 
                            min="1" 
                            defaultValue="1" 
                            required 
                            className="text-lg font-bold text-blue-600"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="w-1/2 bg-zinc-900">
                        {loading ? "Guardando..." : "Registrar Entrada"}
                    </Button>
                </div>
            </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}