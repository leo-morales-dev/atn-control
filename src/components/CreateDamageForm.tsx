"use client"

import { useState, useMemo } from "react"
import { AlertTriangle, Loader2, QrCode, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"
import { createDamageReport } from "@/app/actions/damages"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Product {
    id: number
    description: string
    code: string
    shortCode: string | null
    stock: number 
    supplierCodes: { id: number, code: string, provider: string | null }[]
}

interface Props {
    products: Product[]
}

export function CreateDamageForm({ products }: Props) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState("")

    const selectedProduct = useMemo(() =>
        products.find(p => p.id.toString() === selectedProductId),
        [selectedProductId, products])

    const hasMultipleKeys = selectedProduct && selectedProduct.supplierCodes && selectedProduct.supplierCodes.length > 0

    // --- SOLUCIÓN AL ERROR DE LLAVES DUPLICADAS ---
    // Filtramos para que NO aparezca en la lista si es igual al código original
    const uniqueSupplierCodes = useMemo(() => {
        if (!selectedProduct || !selectedProduct.supplierCodes) return [];
        return selectedProduct.supplierCodes.filter(sc => sc.code !== selectedProduct.shortCode);
    }, [selectedProduct]);

    async function handleSubmit(formData: FormData) {
        if (!selectedProductId) {
            toast.error("Falta Producto", { description: "Debes escanear o seleccionar un producto." })
            return
        }

        setLoading(true)
        setSuccess(false)
        
        formData.append("productId", selectedProductId)

        const type = formData.get("reason")
        const description = formData.get("notes")
        
        if (type) formData.set("type", type) 
        if (description) formData.set("description", description)

        const res = await createDamageReport(formData)
        setLoading(false)

        if (res.success) {
            toast.success("Baja registrada", { description: "Stock actualizado correctamente." })
            setSuccess(true)
            setSelectedProductId("")
            
            const form = document.getElementById('damage-form') as HTMLFormElement;
            if (form) form.reset();
            
            router.refresh()
        } else {
            toast.error("Error al registrar", { description: res.error })
        }
    }

    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-[#232323]">
                    <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center">
                        <AlertTriangle className="text-red-600" size={18} />
                    </div>
                    <h2 className="text-lg font-bold">Nuevo Reporte de Baja</h2>
                </div>
                {success && (
                    <span className="text-xs font-bold text-green-600 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle size={14} /> Registrado
                    </span>
                )}
            </div>

            <p className="text-sm text-zinc-500 mb-4">
                Escanea el producto dañado. Esto descontará stock inmediatamente.
            </p>

            <form id="damage-form" action={handleSubmit} className="space-y-5">

                <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#232323] uppercase flex items-center gap-2">
                        <QrCode size={14} /> Escanear Producto
                    </Label>
                    <div className="bg-zinc-50 p-1 rounded-lg border border-zinc-200">
                        <SearchableProductSelect
                            products={products}
                            value={selectedProductId}
                            onChange={setSelectedProductId}
                        />
                    </div>
                </div>

                {hasMultipleKeys && selectedProduct && (
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
                                    {/* Opción Principal: Le ponemos key fija para evitar colisiones */}
                                    {selectedProduct.shortCode && (
                                        <SelectItem key="main-code" value={selectedProduct.shortCode}>
                                            {selectedProduct.shortCode} (Original)
                                        </SelectItem>
                                    )}
                                    
                                    {/* Opciones Adicionales: Usamos la lista filtrada */}
                                    {uniqueSupplierCodes.map((sc) => (
                                        <SelectItem key={`supp-${sc.id}`} value={sc.code}>
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
                            max={selectedProduct?.stock || 9999}
                            defaultValue="1"
                            className="font-bold text-center h-10 focus:border-[#232323]"
                        />
                         {selectedProduct && (
                            <p className="text-[10px] text-zinc-400 text-center">
                                Max: {selectedProduct.stock}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-bold text-[#232323] uppercase">Motivo</Label>
                        <Select name="reason" defaultValue="DAÑO">
                            <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAÑO">Daño / Rotura</SelectItem>
                                <SelectItem value="PERDIDA">Extravío / Pérdida</SelectItem>
                                <SelectItem value="ROBO">Robo</SelectItem>
                                <SelectItem value="CADUCADO">Caducado / Vencido</SelectItem>
                                <SelectItem value="DEFECTO">Defecto de Fábrica</SelectItem>
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
                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : "Confirmar Baja"}
                </Button>
            </form>
        </div>
    )
}