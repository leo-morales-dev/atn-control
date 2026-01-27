"use client"

import { useState, useMemo } from "react"
import { AlertTriangle, Loader2, FileWarning, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableProductSelect } from "@/components/SearchableProductSelect" 
import { createDamageReport } from "@/app/actions/damages"
import { toast } from "sonner"

interface Product {
  id: number
  description: string
  code: string
  shortCode: string | null
  supplierCodes: { id: number, code: string, provider: string | null }[]
}

interface Props {
  products: Product[]
}

export function CreateDamageDialog({ products }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState("")

  // Encontrar el producto seleccionado completo
  const selectedProduct = useMemo(() => 
    products.find(p => p.id.toString() === selectedProductId), 
  [selectedProductId, products])

  // Determinar si tiene múltiples claves
  const hasMultipleKeys = selectedProduct && selectedProduct.supplierCodes.length > 0

  async function handleSubmit(formData: FormData) {
    if (!selectedProductId) {
      toast.error("Debes escanear un producto")
      return
    }

    setLoading(true)
    formData.append("productId", selectedProductId)
    
    const res = await createDamageReport(formData)
    setLoading(false)

    if (res.success) {
      toast.success("Baja registrada correctamente")
      setOpen(false)
      setSelectedProductId("")
    } else {
      toast.error(res.error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#232323] hover:bg-[#232323]/90 text-white gap-2 shadow-sm">
          <AlertTriangle size={16} /> Reportar Daño / Pérdida
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#232323]">
            <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                <FileWarning className="text-red-600" size={18}/>
            </div>
            Nuevo Reporte de Baja
          </DialogTitle>
          <DialogDescription>
            Escanea el código QR del producto dañado.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-5 mt-2">
            
            {/* 1. ESCÁNER QR (Buscador) */}
            <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#232323] uppercase flex items-center gap-2">
                    <QrCode size={14}/> Escanear Producto
                </Label>
                <div className="bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                    <SearchableProductSelect 
                        products={products} 
                        value={selectedProductId} 
                        onChange={setSelectedProductId} 
                    />
                </div>
            </div>

            {/* 2. SELECTOR DE CLAVE (Solo si hay múltiples) */}
            {hasMultipleKeys && (
                <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                    <Label className="text-xs font-bold text-blue-600 uppercase">
                        Selecciona la Clave del Proveedor
                    </Label>
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-700 mb-2">Este producto tiene varias claves registradas. ¿A cuál corresponde el daño?</p>
                        <Select name="supplierCode" required>
                            <SelectTrigger className="h-9 bg-white border-blue-200 text-blue-900">
                                <SelectValue placeholder="Seleccionar clave..." />
                            </SelectTrigger>
                            <SelectContent>
                                {/* Opción Default */}
                                {selectedProduct.shortCode && (
                                    <SelectItem value={selectedProduct.shortCode}>
                                        {selectedProduct.shortCode} (Principal)
                                    </SelectItem>
                                )}
                                {/* Opciones Adicionales */}
                                {selectedProduct.supplierCodes.map((sc) => (
                                    <SelectItem key={sc.id} value={sc.code}>
                                        {sc.code} {sc.provider ? `- ${sc.provider}` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#232323] uppercase">Cantidad</Label>
                    <Input 
                        name="quantity" 
                        type="number" 
                        min="1" 
                        defaultValue="1" 
                        className="font-bold text-center h-10 focus:border-[#232323]" 
                    />
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#232323] uppercase">Motivo</Label>
                    <Select name="reason" defaultValue="Daño">
                        <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Daño">Daño / Rotura</SelectItem>
                            <SelectItem value="Pérdida">Extravío / Pérdida</SelectItem>
                            <SelectItem value="Robo">Robo</SelectItem>
                            <SelectItem value="Caducado">Caducado / Vencido</SelectItem>
                            <SelectItem value="Defecto">Defecto de Fábrica</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#232323] uppercase">Observaciones</Label>
                <Textarea 
                    name="notes" 
                    placeholder="Detalles..." 
                    className="resize-none h-20 text-sm bg-zinc-50"
                />
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#232323] hover:bg-[#232323]/90 text-white h-10 font-bold">
                {loading ? <Loader2 className="animate-spin h-4 w-4"/> : "Confirmar Baja"}
            </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}