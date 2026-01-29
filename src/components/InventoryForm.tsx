"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation" 
import { Wand2, Loader2, AlertTriangle, Link as LinkIcon, FileUp, PackagePlus, Truck } from "lucide-react" // Agregué Truck icon
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

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
    productsList?: Product[]
}

export function InventoryForm({ productsList = [] }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("create") 
  const [category, setCategory] = useState("Herramienta")
  const [selectedProductId, setSelectedProductId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  // --- HANDLERS DE SANITIZACIÓN ---
  const handleNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }

  const handleCodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = e.target.value
        .toUpperCase()
        .replace(/\s/g, '')
        .replace(/'/g, '-');
  }

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
    
    // --- VALIDACIONES ---
    if (activeTab === "create") {
        const code = formData.get("code") as string;
        const shortCode = formData.get("shortCode") as string;
        const description = formData.get("description") as string;
        // const providerName = formData.get("providerName") as string; // Opcional validarlo si quieres

        const exists = productsList.some(p => p.code.toUpperCase() === code.toUpperCase().trim());
        if (exists) {
            toast.error("Código Duplicado", { 
                description: `El código '${code}' ya pertenece a otro producto.` 
            });
            setLoading(false); return;
        }

        if (!shortCode.trim()) {
            toast.error("Falta Referencia", { description: "La clave del proveedor es obligatoria." });
            setLoading(false); return;
        }

        if (!description.trim()) {
             toast.error("Falta Descripción", { description: "Escribe el nombre del producto." });
             setLoading(false); return;
        }

        formData.append("category", category)
    }

    if (activeTab === "link") {
        const shortCode = formData.get("shortCode") as string;

        if (!selectedProductId) {
            toast.error("Selección Requerida", { description: "Debes buscar un producto." })
            setLoading(false); return
        }

        if (!shortCode.trim()) {
            toast.error("Falta Referencia", { description: "Ingresa la clave del proveedor." });
            setLoading(false); return
        }

        formData.append("linkedProductId", selectedProductId)
    }

    // --- PROCESAR ---
    const result = await createOrUpdateProduct(formData)
    setLoading(false)

    if (result.success) {
      toast.success(activeTab === "create" ? "Producto Registrado" : "Stock Actualizado")
      formRef.current?.reset()
      setSelectedProductId("")
      router.refresh()
    } else {
      toast.error("Error", { description: result.error })
    }
  }

  return (
    <Card className="mb-6 border-zinc-200 shadow-sm bg-white overflow-hidden">
      <CardHeader className="py-3 px-5 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-[#232323] flex items-center justify-center shadow-sm">
                <PackagePlus className="text-white" size={18} />
            </div>
            <span className="font-bold text-xl text-[#232323]">Nuevo Ingreso</span>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                type="button" // Importante: type button para no enviar form
                onClick={() => router.push('/inventory/import')}
                className="h-10 w-[140px] gap-2 bg-[#de2d2d] text-white hover:bg-[#de2d2d]/90 shadow-sm px-3 font-medium border-none text-xs"
            >
                <FileUp size={16} /> Importar XML
            </Button>
            <ExcelImport /> 
        </div>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 pt-5">
        <form ref={formRef} action={handleSubmit}>
            <Tabs defaultValue="create" value={activeTab} onValueChange={setActiveTab} className="w-full">
                
                <TabsList className="h-11 mb-5 bg-zinc-100 p-1 w-full sm:w-auto inline-flex justify-start rounded-lg">
                    <TabsTrigger value="create" className="text-xs h-9 px-5 font-bold rounded-md data-[state=active]:bg-[#232323] data-[state=active]:text-white">
                        Crear Nuevo
                    </TabsTrigger>
                    <TabsTrigger value="link" className="text-xs h-9 px-5 font-bold rounded-md data-[state=active]:bg-[#232323] data-[state=active]:text-white">
                        Sumar a Existente
                    </TabsTrigger>
                </TabsList>

                {/* --- MODO CREAR --- */}
                <TabsContent value="create" className="mt-0 animate-in fade-in-50">
                    <div className="grid grid-cols-12 gap-4 items-end">
                        {/* Fila 1 */}
                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Código / QR</Label>
                            <div className="flex gap-1">
                                <Input 
                                    name="code" 
                                    placeholder="PROD-..." 
                                    required={activeTab === 'create'} 
                                    onChange={handleCodeInput} 
                                    className="h-10 text-sm uppercase font-mono bg-zinc-50" 
                                />
                                <Button type="button" variant="outline" size="icon" onClick={generateCode} className="h-10 w-10 shrink-0">
                                    <Wand2 size={16} className="text-zinc-400" />
                                </Button>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-6 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Descripción</Label>
                            <Input name="description" placeholder="Nombre del producto..." required={activeTab === 'create'} className="h-10 text-sm bg-zinc-50" />
                        </div>

                        <div className="col-span-12 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Categoría</Label>
                            <Select value={category} onValueChange={setCategory}>
                                <SelectTrigger className="h-10 text-sm bg-zinc-50"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Herramienta">Herramienta</SelectItem>
                                    <SelectItem value="Consumible">Consumible</SelectItem>
                                    <SelectItem value="EPP">EPP</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fila 2: Proveedor y Cantidades */}
                        <div className="col-span-6 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">Ref. Prov (Clave)</Label>
                            <Input name="shortCode" placeholder="Ej: DCD996" className="h-10 text-sm bg-blue-50/50 border-blue-100 text-blue-800 font-mono" />
                        </div>

                        {/* NUEVO CAMPO: PROVEEDOR */}
                        <div className="col-span-6 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                                <Truck size={12}/> Proveedor
                            </Label>
                            <Input name="providerName" placeholder="Ej: Dewalt / Bosch" className="h-10 text-sm bg-blue-50/50 border-blue-100 text-blue-800" />
                        </div>

                        <div className="col-span-6 md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-bold text-red-600 uppercase tracking-wide flex items-center gap-1">
                                Min <AlertTriangle size={12}/>
                            </Label>
                            <Input name="minStock" inputMode="numeric" defaultValue="5" onChange={handleNumberInput} className="h-10 text-sm text-center bg-red-50 border-red-200 text-red-700 font-bold" />
                        </div>

                         <div className="col-span-6 md:col-span-2 space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#232323] uppercase tracking-wide">Cant.</Label>
                            <Input name="quantity" inputMode="numeric" defaultValue="1" onChange={handleNumberInput} required className="h-10 text-base font-bold text-center border-zinc-300 focus:border-[#232323]" />
                        </div>
                        
                        {/* Botón Full Width en Mobile, o ajustado */}
                        <div className="col-span-12 md:col-span-2">
                             <Button type="submit" disabled={loading} className="w-full h-10 bg-[#232323] hover:bg-[#232323]/90 text-white text-xs font-bold uppercase">
                                {loading ? <Loader2 className="animate-spin" /> : "Guardar"}
                            </Button>
                        </div>
                    </div>
                </TabsContent>

                {/* --- MODO VINCULAR --- */}
                <TabsContent value="link" className="mt-0 animate-in fade-in-50">
                    <div className="grid grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 md:col-span-4 space-y-1.5">
                            <Label className="text-[10px] font-bold text-blue-600 uppercase tracking-wide flex items-center gap-1">
                                <LinkIcon size={14}/> Buscar Producto
                            </Label>
                            <SearchableProductSelect products={productsList} value={selectedProductId} onChange={setSelectedProductId} />
                        </div>

                        <div className="col-span-6 md:col-span-3 space-y-1.5">
                             <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Ref. Prov (Clave)</Label>
                             <Input name="shortCode" placeholder="Clave..." className="h-10 text-sm bg-zinc-50 font-mono" />
                        </div>

                        {/* NUEVO CAMPO: PROVEEDOR EN VINCULAR */}
                        <div className="col-span-6 md:col-span-3 space-y-1.5">
                            <Label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Proveedor</Label>
                            <Input name="providerName" placeholder="Nombre..." className="h-10 text-sm bg-zinc-50" />
                        </div>

                        <div className="col-span-6 md:col-span-1 space-y-1.5">
                            <Label className="text-[10px] font-bold text-[#232323] uppercase tracking-wide">Cant.</Label>
                            <Input name="quantity" inputMode="numeric" defaultValue="1" onChange={handleNumberInput} required className="h-10 text-base font-bold text-center border-zinc-300" />
                        </div>

                        <div className="col-span-6 md:col-span-1">
                             <Button type="submit" disabled={loading} className="w-full h-10 bg-[#232323] text-white text-xs font-bold uppercase">
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