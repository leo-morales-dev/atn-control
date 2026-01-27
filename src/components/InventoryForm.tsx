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
import { ExcelImport } from "@/components/ExcelImport"
import Link from "next/link"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
    productsList?: Product[]
}

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
      
      {/* HEADER CON TÍTULO GRANDE Y BOTONES NEGROS */}
      <CardHeader className="py-3 px-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-center justify-between">
        
        {/* TÍTULO AUMENTADO */}
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#232323] flex items-center justify-center shadow-sm">
                <PackagePlus className="text-white" size={18} />
            </div>
            <span className="font-bold text-xl text-[#232323]">Nuevo Ingreso</span>
        </div>
        
        {/* BOTONES DE IMPORTACIÓN NEGROS */}
        <div className="flex items-center gap-3">
            {/* El componente ExcelImport ya tiene el botón negro configurado */}
            <ExcelImport /> 
            
            <Link href="/inventory/import">
                <Button 
                    size="sm" 
                    className="h-9 text-xs gap-2 bg-[#232323] text-white hover:bg-[#232323]/90 shadow-sm px-4 font-medium"
                >
                    <FileUp size={14} /> Importar XML
                </Button>
            </Link>
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 pt-5">
        <form ref={formRef} action={handleSubmit}>
            <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <TabsList className="h-11 mb-5 bg-zinc-100 p-1 w-full sm:w-auto inline-flex justify-start rounded-lg">
                    <TabsTrigger 
                        value="create" 
                        className="text-xs h-9 px-5 font-bold rounded-md transition-all data-[state=active]:bg-[#232323] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        Crear Nuevo
                    </TabsTrigger>
                    <TabsTrigger 
                        value="link" 
                        className="text-xs h-9 px-5 font-bold rounded-md transition-all data-[state=active]:bg-[#232323] data-[state=active]:text-white data-[state=active]:shadow-sm"
                    >
                        Sumar a Existente
                    </TabsTrigger>
                </TabsList>

                {/* --- MODO CREAR --- */}
                <TabsContent value="create" className="mt-0 animate-in fade-in-50">
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Código / QR</Label>
                            <div className="flex gap-1">
                                <Input name="code" placeholder="Escanear..." required={activeTab === 'create'} className="h-10 text-sm bg-zinc-50 border-zinc-200 focus:bg-white transition-all" />
                                <Button type="button" variant="outline" size="icon" onClick={generateCode} className="h-10 w-10 shrink-0 text-zinc-400 hover:text-[#232323] border-zinc-200">
                                    <Wand2 size={16} />
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-6 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Descripción</Label>
                            <Input name="description" placeholder="Ej: Taladro Percutor Inalámbrico..." required={activeTab === 'create'} className="h-10 text-sm bg-zinc-50 border-zinc-200 focus:bg-white transition-all" />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-10 text-sm bg-zinc-50 border-zinc-200"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                                    <SelectItem value="Consumible">Consumible</SelectItem>
                                    <SelectItem value="EPP">EPP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Ref. Prov (Opcional)</Label>
                            <Input name="shortCode" placeholder="Ej: FAC-123" className="h-10 text-sm bg-zinc-50 border-zinc-200" />
                        </div>

                        <div className="col-span-6 md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-1">
                                Min <AlertTriangle size={12}/>
                            </Label>
                            <Input name="minStock" type="number" defaultValue="5" className="h-10 text-sm text-center bg-red-50 border-red-200 text-red-700 font-bold focus:ring-red-200" />
                        </div>

                         <div className="col-span-6 md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#232323] uppercase tracking-wide">Cant.</Label>
                            <Input name="quantity" type="number" defaultValue="1" min="1" required className="h-10 text-base font-bold text-center border-zinc-300 focus:border-[#232323]" />
                        </div>

                        <div className="col-span-12 md:col-span-5">
                            <Button type="submit" disabled={loading} className="w-full h-10 bg-[#232323] hover:bg-[#232323]/90 text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all hover:scale-[1.01]">
                                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Registrar Producto"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- MODO VINCULAR --- */}
                <TabsContent value="link" className="mt-0 animate-in fade-in-50">
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 md:col-span-6 space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                                <LinkIcon size={14}/> Buscar Producto Existente
                            </Label>
                            <SearchableProductSelect products={productsList} value={selectedProductId} onChange={setSelectedProductId} />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                             <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Ref. Prov (Opcional)</Label>
                             <Input name="shortCode" placeholder="Nueva clave..." className="h-10 text-sm bg-zinc-50 border-zinc-200" />
                        </div>

                        <div className="col-span-4 md:col-span-1 space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#232323] uppercase tracking-wide">Cant.</Label>
                            <Input name="quantity" type="number" defaultValue="1" min="1" required className="h-10 text-base font-bold text-center border-zinc-300 focus:border-[#232323]" />
                        </div>

                        <div className="col-span-8 md:col-span-2">
                             <Button type="submit" disabled={loading} className="w-full h-10 bg-[#232323] hover:bg-[#232323]/90 text-white text-xs font-bold uppercase tracking-widest shadow-md transition-all hover:scale-[1.01]">
                                {loading ? "..." : "Sumar Stock"}
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