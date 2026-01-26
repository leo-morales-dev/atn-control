"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Link as LinkIcon, Wand2, Plus } from "lucide-react"
import { createOrUpdateProduct } from "@/app/actions/product"
import { toast } from "sonner"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"
import Link from "next/link"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
  existingProducts: Product[]
}

export function ProductEntryForm({ existingProducts }: Props) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create") // 'create' | 'link'
  
  // Estados del formulario
  const [category, setCategory] = useState("Herramienta")
  const [selectedProductId, setSelectedProductId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    
    // Inyectamos el modo y datos que no van en inputs directos
    formData.append("mode", activeTab)
    if (activeTab === "link") {
        if (!selectedProductId) {
            toast.error("Debes seleccionar un producto para vincular")
            setLoading(false)
            return
        }
        formData.append("linkedProductId", selectedProductId)
    } else {
        formData.append("category", category)
    }

    const res = await createOrUpdateProduct(formData)

    if (res.success) {
      toast.success(activeTab === "create" ? "Producto registrado correctamente" : "Stock actualizado correctamente")
      formRef.current?.reset() // Limpiar formulario
      setSelectedProductId("") // Limpiar selección
      // Opcional: Volver a tab 'create'
    } else {
      toast.error("Error: " + res.error)
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-zinc-200 shadow-sm p-6 mb-8">
      
      {/* CABECERA: Título y Botón Importar */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-zinc-900">Nuevo Ingreso Manual</h2>
        <Link href="/import">
            <Button variant="outline" size="sm" className="gap-2 text-zinc-600 border-dashed border-zinc-300">
                <Wand2 size={14} /> Importar XML
            </Button>
        </Link>
      </div>

      <form ref={formRef} action={handleSubmit}>
        <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
            
            {/* PESTAÑAS TIPO "PILL" */}
            <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6 bg-zinc-100 p-1 rounded-lg">
                <TabsTrigger value="create" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Crear Nuevo
                </TabsTrigger>
                <TabsTrigger value="link" className="rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                    Vincular Existente
                </TabsTrigger>
            </TabsList>

            <div className="flex flex-col lg:flex-row gap-6 items-end">
                
                {/* --- ÁREA VARIABLE SEGÚN PESTAÑA --- */}
                <div className="flex-1 w-full">
                    
                    {/* CASO 1: CREAR NUEVO */}
                    <TabsContent value="create" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Código */}
                            <div className="md:col-span-3 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Código / Serial</Label>
                                <Input name="code" placeholder="Escanear..." className="bg-zinc-50/50" required={activeTab === 'create'} />
                            </div>
                            
                            {/* Descripción */}
                            <div className="md:col-span-4 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Descripción</Label>
                                <Input name="description" placeholder="Nombre del producto..." className="bg-zinc-50/50" required={activeTab === 'create'} />
                            </div>

                            {/* Categoría */}
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Categoría</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="bg-zinc-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Herramienta">Herramienta</SelectItem>
                                        <SelectItem value="Consumible">Consumible</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Ref. Proveedor */}
                            <div className="md:col-span-2 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Ref. Prov. (Opcional)</Label>
                                <Input name="shortCode" placeholder="Ej: FAC-123" className="bg-zinc-50/50" />
                            </div>

                            {/* Min Stock */}
                            <div className="md:col-span-1 space-y-1.5">
                                <Label className="text-xs text-red-500 font-medium">Min.</Label>
                                <Input name="minStock" type="number" defaultValue="5" className="bg-red-50/50 border-red-100 text-red-900" />
                            </div>
                        </div>
                    </TabsContent>

                    {/* CASO 2: VINCULAR */}
                    <TabsContent value="link" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            
                            {/* Buscador */}
                            <div className="md:col-span-6 space-y-1.5">
                                <Label className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                    <LinkIcon size={12}/> Buscar Producto a Vincular
                                </Label>
                                <SearchableProductSelect 
                                    products={existingProducts}
                                    value={selectedProductId}
                                    onChange={setSelectedProductId}
                                />
                            </div>

                            {/* Nueva Ref */}
                            <div className="md:col-span-4 space-y-1.5">
                                <Label className="text-xs text-zinc-500">Nueva Ref. Proveedor (Opcional)</Label>
                                <Input name="shortCode" placeholder="Si es un código nuevo..." className="bg-zinc-50/50" />
                            </div>
                            
                            <div className="md:col-span-2 pb-2 text-xs text-zinc-400">
                                Se actualizará el stock y las referencias.
                            </div>
                        </div>
                    </TabsContent>
                </div>

                {/* --- ÁREA COMÚN (CANTIDAD Y BOTÓN) --- */}
                <div className="flex items-end gap-3 w-full lg:w-auto border-t lg:border-t-0 lg:border-l border-zinc-100 pt-4 lg:pt-0 lg:pl-6">
                    <div className="space-y-1.5 w-24">
                        <Label className="text-xs text-zinc-500 font-bold">Cantidad</Label>
                        <Input 
                            name="quantity" 
                            type="number" 
                            min="1" 
                            defaultValue="1" 
                            required 
                            className="font-bold text-center"
                        />
                    </div>
                    <Button type="submit" disabled={loading} className="bg-zinc-900 hover:bg-zinc-800 min-w-[120px]">
                        {loading ? "..." : (activeTab === 'create' ? "Registrar" : "Sumar Stock")}
                    </Button>
                </div>

            </div>
        </Tabs>
      </form>
    </div>
  )
}