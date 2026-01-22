"use client"

import { useState, useRef } from "react"
import { Plus, Wand2, Loader2, AlertTriangle } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createProduct } from "@/app/actions/product"

export function InventoryForm() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const generateCode = () => {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase()
    const codeInput = document.getElementById("code-input") as HTMLInputElement
    if (codeInput) {
      codeInput.value = `PROD-${randomPart}`
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createProduct(formData)
    setLoading(false)

    if (result.success) {
      formRef.current?.reset()
    } else {
      alert("Error: " + result.error)
    }
  }

  return (
    <Card className="mb-8 border-zinc-200 shadow-sm bg-white">
      <CardHeader className="pb-3 border-b border-zinc-100">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Plus className="h-5 w-5 text-zinc-500" />
          Nuevo Ingreso
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form ref={formRef} action={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          
          {/* CÓDIGO */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-medium text-zinc-700">Código / Serial</label>
            <div className="flex gap-2">
                <Input 
                    id="code-input"
                    name="code" 
                    placeholder="Escanea o genera..." 
                    required 
                    className="font-mono bg-zinc-50"
                />
                <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    onClick={generateCode}
                    title="Generar código automático"
                    className="shrink-0 text-zinc-500 hover:text-zinc-900"
                >
                    <Wand2 size={16} />
                </Button>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-3 space-y-2">
            <label className="text-sm font-medium text-zinc-700">Descripción</label>
            <Input name="description" placeholder="Ej: Taladro Percutor 1/2" required />
          </div>

          {/* CATEGORÍA */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium text-zinc-700">Categoría</label>
            <select 
                name="category" 
                className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 focus:outline-none"
            >
                <option value="Herramienta">Herramienta</option>
                <option value="Consumible">Consumible</option>
                <option value="EPP">EPP</option>
            </select>
          </div>

           {/* STOCK INICIAL */}
           <div className="md:col-span-1 space-y-2">
            <label className="text-sm font-medium text-zinc-700">Cant.</label>
            <Input name="stock" type="number" defaultValue="1" min="0" required className="text-center" />
          </div>

          {/* STOCK MÍNIMO (ALERTA) */}
          <div className="md:col-span-1 space-y-2">
            <label className="text-sm font-medium text-red-600 flex items-center gap-1">
                Min. <AlertTriangle size={12}/>
            </label>
            <Input 
                name="minStock" 
                type="number" 
                defaultValue="5" 
                min="0" 
                required 
                className="text-center border-red-100 bg-red-50/50 focus:border-red-300" 
                title="Alerta cuando baje de esta cantidad"
            />
          </div>

          {/* BOTÓN */}
          <div className="md:col-span-2">
            <Button type="submit" disabled={loading} className="w-full bg-zinc-900 hover:bg-zinc-800 text-white">
                {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Registrar"}
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  )
}