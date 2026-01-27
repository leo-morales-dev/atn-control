"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Link as LinkIcon, Wand2, PackagePlus, AlertTriangle, Loader2 } from "lucide-react"
import { createOrUpdateProduct } from "@/app/actions/product"
import { toast } from "sonner"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
  existingProducts: Product[]
}

export function CreateProductDialog({ existingProducts }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create")
  const [category, setCategory] = useState("Herramienta")
  const [selectedProductId, setSelectedProductId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  // Función para generar código aleatorio (La "Varita Mágica")
  const generateCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const form = formRef.current
    if (form) {
        const codeInput = form.querySelector('input[name="code"]') as HTMLInputElement
        if (codeInput) codeInput.value = `PROD-${randomPart}`
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.append("mode", activeTab)
    
    if (activeTab === "link") {
        if (!selectedProductId) {
             toast.error("Debes seleccionar un producto existente")
             setLoading(false)
             return
        }
        formData.append("linkedProductId", selectedProductId)
    } else {
        formData.append("category", category)
    }

    const res = await createOrUpdateProduct(formData)
    setLoading(false)

    if (res.success) {
      toast.success(activeTab === "create" ? "Producto registrado" : "Stock actualizado")
      setOpen(false)
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2 shadow-sm">
          <Plus size={16} /> Nuevo Ingreso
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             <PackagePlus className="text-blue-600"/> Registrar Entrada
          </DialogTitle>
          <DialogDescription>
            Da de alta un nuevo material o suma stock a uno existente.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={handleSubmit} className="mt-2">
            <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-zinc-100">
                    <TabsTrigger value="create">Crear Nuevo</TabsTrigger>
                    <TabsTrigger value="link">Sumar a Existente</TabsTrigger>
                </TabsList>

                {/* --- CREAR --- */}
                <TabsContent value="create" className="space-y-4 animate-in fade-in-50">
                    <div className="grid grid-cols-12 gap-3">
                        <div className="col-span-4 space-y-1.5">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Código / QR</Label>
                            <div className="flex gap-1">
                                <Input name="code" placeholder="Escanear..." required={activeTab === 'create'} className="h-9" />
                                <Button type="button" variant="outline" size="icon" onClick={generateCode} className="shrink-0 h-9 w-9 text-zinc-400 hover:text-blue-600">
                                    <Wand2 size={14} />
                                </Button>
                            </div>
                        </div>
                        <div className="col-span-8 space-y-1.5">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Descripción</Label>
                            <Input name="description" placeholder="Ej: Taladro Percutor..." required={activeTab === 'create'} className="h-9" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                                    <SelectItem value="Consumible">Consumible</SelectItem>
                                    <SelectItem value="EPP">EPP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs uppercase text-zinc-500 font-bold">Ref. Prov (Opcional)</Label>
                            <Input name="shortCode" placeholder="Ej: FAC-123" className="h-9" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-red-50 rounded-md border border-red-100">
                        <AlertTriangle className="text-red-500" size={16}/>
                        <div className="flex-1">
                             <Label className="text-xs text-red-700 font-bold">Alerta de Stock Mínimo</Label>
                             <p className="text-[10px] text-red-600">Te avisaremos cuando queden menos de:</p>
                        </div>
                        <Input name="minStock" type="number" defaultValue="5" className="w-20 h-8 bg-white border-red-200 text-center font-bold text-red-700" />
                    </div>
                </TabsContent>

                {/* --- VINCULAR --- */}
                <TabsContent value="link" className="space-y-4 animate-in fade-in-50">
                     <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-2">
                        <Label className="text-blue-700 font-bold flex items-center gap-2">
                            <LinkIcon size={14}/> Buscar Producto
                        </Label>
                        <SearchableProductSelect 
                            products={existingProducts}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                        />
                     </div>
                     <div className="space-y-1.5">
                        <Label className="text-xs uppercase text-zinc-500 font-bold">Nueva Ref. Proveedor (Opcional)</Label>
                        <Input name="shortCode" placeholder="Si la factura trae clave nueva..." className="h-9" />
                    </div>
                </TabsContent>
            </Tabs>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-end gap-3">
                <div className="space-y-1.5 w-32">
                     <Label className="text-xs uppercase text-zinc-800 font-bold">Cantidad</Label>
                     <Input name="quantity" type="number" min="1" defaultValue="1" required className="text-center font-bold text-lg h-10" />
                </div>
                <Button type="submit" disabled={loading} className="flex-1 h-10 bg-zinc-900 text-white hover:bg-zinc-800 font-medium">
                    {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : (activeTab === 'create' ? "Guardar Nuevo Producto" : "Sumar al Inventario")}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}