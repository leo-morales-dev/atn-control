"use client"

import { useState, useRef } from "react"
import { Wand2, Loader2, AlertTriangle, Link as LinkIcon, FileUp, PackagePlus } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createOrUpdateProduct } from "@/app/actions/product"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"
import { toast } from "sonner"
import Link from "next/link"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
    productsList?: Product[]
}

// IMPORTANTE: El nombre de la función debe ser InventoryForm
export function InventoryForm({ productsList = [] }: Props) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create") 
  const [category, setCategory] = useState("Herramienta")
  const [selectedProductId, setSelectedProductId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

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
            toast.error("Selecciona un producto")
            setLoading(false)
            return
        }
        formData.append("linkedProductId", selectedProductId)
    } else {
        formData.append("category", category)
    }

    const result = await createOrUpdateProduct(formData)
    setLoading(false)

    if (result.success) {
      toast.success(activeTab === "create" ? "Registrado" : "Stock actualizado")
      formRef.current?.reset()
      setSelectedProductId("")
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Card className="mb-6 border-zinc-200 shadow-sm bg-white overflow-hidden">
      
      <CardHeader className="py-2 px-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-center justify-between h-10">
        <div className="flex items-center gap-2">
            <PackagePlus className="text-blue-600" size={16} />
            <span className="font-bold text-sm text-zinc-800">Nuevo Ingreso</span>
        </div>
        
        <Link href="/inventory/import">
            <Button 
                size="sm" 
                className="h-7 text-xs gap-2 bg-zinc-900 text-white hover:bg-zinc-800 shadow-sm px-3"
            >
                <FileUp size={12} /> Importar XML
            </Button>
        </Link>
      </CardHeader>
      
      <CardContent className="px-4 pb-3 pt-3">
        <form ref={formRef} action={handleSubmit}>
            <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <TabsList className="h-10 mb-3 bg-zinc-100/80 p-1 w-full sm:w-auto inline-flex justify-start">
                    <TabsTrigger 
                        value="create" 
                        className="text-xs h-8 px-4 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        Crear Nuevo
                    </TabsTrigger>
                    <TabsTrigger 
                        value="link" 
                        className="text-xs h-8 px-4 font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                    >
                        Sumar a Existente
                    </TabsTrigger>
                </TabsList>

                {/* --- MODO CREAR --- */}
                <TabsContent value="create" className="mt-0">
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-12 md:col-span-3 space-y-0.5">
                            <Label className="text-[10px] font-semibold text-zinc-500 uppercase">Código / QR</Label>
                            <div className="flex gap-1">
                                <Input name="code" placeholder="Escanear..." required={activeTab === 'create'} className="h-8 text-xs bg-zinc-50" />
                                <Button type="button" variant="outline" size="icon" onClick={generateCode} className="h-8 w-8 shrink-0 text-zinc-400">
                                    <Wand2 size={12} />
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-6 space-y-0.5">
                            <Label className="text-[10px] font-semibold text-zinc-500 uppercase">Descripción</Label>
                            <Input name="description" placeholder="Ej: Taladro..." required={activeTab === 'create'} className="h-8 text-xs bg-zinc-50" />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-0.5">
                            <Label className="text-[10px] font-semibold text-zinc-500 uppercase">Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-8 text-xs bg-zinc-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                                    <SelectItem value="Consumible">Consumible</SelectItem>
                                    <SelectItem value="EPP">EPP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-0.5">
                            <Label className="text-[10px] font-semibold text-zinc-500 uppercase">Ref. Prov (Opcional)</Label>
                            <Input name="shortCode" placeholder="Ej: FAC-123" className="h-8 text-xs bg-zinc-50" />
                        </div>

                        <div className="col-span-6 md:col-span-2 space-y-0.5">
                            <Label className="text-[10px] font-semibold text-red-500 uppercase flex items-center gap-1">
                                Min <AlertTriangle size={10}/>
                            </Label>
                            <Input name="minStock" type="number" defaultValue="5" className="h-8 text-xs text-center bg-red-50/50 border-red-100" />
                        </div>

                         <div className="col-span-6 md:col-span-2 space-y-0.5">
                            <Label className="text-[10px] font-bold text-zinc-800 uppercase">Cant.</Label>
                            <Input name="quantity" type="number" defaultValue="1" min="1" required className="h-8 text-sm font-bold text-center" />
                        </div>

                        <div className="col-span-12 md:col-span-5">
                            <Button type="submit" disabled={loading} className="w-full h-8 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase tracking-wide">
                                {loading ? <Loader2 className="animate-spin h-3 w-3" /> : "Registrar"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- MODO VINCULAR --- */}
                <TabsContent value="link" className="mt-0">
                    <div className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-12 md:col-span-6 space-y-0.5">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                                <LinkIcon size={12}/> Producto a Vincular
                            </Label>
                            <SearchableProductSelect products={productsList} value={selectedProductId} onChange={setSelectedProductId} />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-0.5">
                             <Label className="text-[10px] font-semibold text-zinc-500 uppercase">Ref. Prov (Opcional)</Label>
                             <Input name="shortCode" placeholder="Nueva clave..." className="h-8 text-xs bg-zinc-50" />
                        </div>

                        <div className="col-span-4 md:col-span-1 space-y-0.5">
                            <Label className="text-[10px] font-bold text-zinc-800 uppercase">Cant.</Label>
                            <Input name="quantity" type="number" defaultValue="1" min="1" required className="h-8 text-sm font-bold text-center" />
                        </div>

                        <div className="col-span-8 md:col-span-2">
                             <Button type="submit" disabled={loading} className="w-full h-8 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold uppercase">
                                {loading ? "..." : "Sumar"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

            </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}