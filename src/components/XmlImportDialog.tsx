"use client"

import { useState } from "react"
import { FileUp, Save, Link as LinkIcon, Plus, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { parseFacturaXML, processXmlImport } from "@/app/actions/import-xml"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
  existingProducts: Product[] // Pasamos el catálogo para poder elegir
}

export function XmlImportDialog({ existingProducts }: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1) // 1: Subir, 2: Revisar
  const [loading, setLoading] = useState(false)
  const [importItems, setImportItems] = useState<any[]>([])

  // --- PASO 1: SUBIR Y LEER ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    
    setLoading(true)
    const formData = new FormData()
    formData.append('xml', e.target.files[0])

    const result = await parseFacturaXML(formData)
    setLoading(false)

    if (result.success) {
      // Preparamos los items con valores por defecto
      const preparedItems = (result.data || []).map((item: any, index: number) => ({
        id: index,
        originalCode: item.noIdentificacion,
        originalDesc: item.descripcion,
        quantity: item.cantidad,
        
        // Lógica de decisión automática
        action: item.suggestedProduct ? 'link' : 'create',
        linkedProductId: item.suggestedProduct?.id || "",
        
        // Datos para crear nuevo (editables)
        newCode: item.noIdentificacion,
        newDesc: item.descripcion,
        newCategory: 'Consumible', // Default
        newShortCode: '', // Clave corta opcional
      }))
      
      setImportItems(preparedItems)
      setStep(2)
    } else {
      alert(result.error)
    }
  }

  // --- PASO 2: PROCESAR ---
  async function handleFinalSave() {
    // Validar que los vínculos estén completos
    const invalidLinks = importItems.find(i => i.action === 'link' && !i.linkedProductId)
    if (invalidLinks) {
        alert("Hay productos marcados para 'Vincular' pero no has seleccionado con cuál producto.")
        return
    }

    setLoading(true)
    // Convertimos al formato que espera el server action
    const payload = importItems.map(item => ({
        action: item.action,
        linkedProductId: item.action === 'link' ? parseInt(item.linkedProductId) : null,
        quantity: item.quantity,
        // Datos de creación
        code: item.newCode,
        description: item.newDesc,
        category: item.newCategory,
        shortCode: item.newShortCode
    }))

    const result = await processXmlImport(payload)
    setLoading(false)

    if (result.success) {
        setOpen(false)
        setStep(1)
        setImportItems([])
    } else {
        alert(result.error)
    }
  }

  // Helpers para actualizar el estado local de la tabla
  const updateItem = (id: number, field: string, value: any) => {
    setImportItems(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
    ))
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if(!val) setStep(1); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-dashed border-zinc-300">
          <FileUp size={16} /> Importar XML
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importación Masiva de Factura</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-lg bg-zinc-50 m-4">
            <FileUp size={48} className="text-zinc-300 mb-4" />
            <p className="text-zinc-600 font-medium mb-2">Sube tu archivo XML (CFDI)</p>
            <p className="text-xs text-zinc-400 mb-6">Detectaremos productos y cantidades automáticamente</p>
            <Input 
                type="file" 
                accept=".xml" 
                onChange={handleFileUpload} 
                className="max-w-xs bg-white"
                disabled={loading}
            />
            {loading && <p className="mt-4 text-sm animate-pulse">Analizando factura...</p>}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
             <div className="flex-1 overflow-y-auto pr-2">
                <table className="w-full text-sm">
                    <thead className="bg-zinc-100 sticky top-0 z-10">
                        <tr>
                            <th className="p-2 text-left w-1/4">XML (Origen)</th>
                            <th className="p-2 text-center w-[120px]">Acción</th>
                            <th className="p-2 text-left">Destino (Sistema)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                        {importItems.map((item) => (
                            <tr key={item.id} className="group hover:bg-zinc-50">
                                {/* COLUMNA 1: DATOS XML */}
                                <td className="p-3 align-top">
                                    <div className="font-medium text-zinc-900">{item.originalDesc}</div>
                                    <div className="text-xs text-zinc-500 font-mono mt-1">Ref: {item.originalCode}</div>
                                    <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                                        + {item.quantity} pzas
                                    </Badge>
                                </td>

                                {/* COLUMNA 2: SELECTOR DE ACCIÓN */}
                                <td className="p-3 align-top text-center">
                                    <div className="flex flex-col gap-2 items-center">
                                        <ArrowRight className="text-zinc-300 rotate-90 md:rotate-0" />
                                        <select
                                            className="text-xs border rounded p-1"
                                            value={item.action}
                                            onChange={(e) => updateItem(item.id, 'action', e.target.value)}
                                        >
                                            <option value="create">Crear Nuevo</option>
                                            <option value="link">Vincular</option>
                                        </select>
                                    </div>
                                </td>

                                {/* COLUMNA 3: FORMULARIO DINÁMICO */}
                                <td className="p-3 align-top bg-zinc-50/50 rounded-r-lg">
                                    {item.action === 'create' ? (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="col-span-2">
                                                <label className="text-xs text-zinc-500">Descripción Interna</label>
                                                <Input 
                                                    value={item.newDesc} 
                                                    onChange={(e) => updateItem(item.id, 'newDesc', e.target.value)}
                                                    className="h-8 text-xs bg-white" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500">Código</label>
                                                <Input 
                                                    value={item.newCode} 
                                                    onChange={(e) => updateItem(item.id, 'newCode', e.target.value)}
                                                    className="h-8 text-xs bg-white font-mono" 
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-zinc-500">Categoría</label>
                                                <select 
                                                    className="w-full h-8 text-xs border rounded bg-white px-2"
                                                    value={item.newCategory}
                                                    onChange={(e) => updateItem(item.id, 'newCategory', e.target.value)}
                                                >
                                                    <option value="Consumible">Consumible</option>
                                                    <option value="Herramienta">Herramienta</option>
                                                    <option value="EPP">EPP</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="text-xs text-zinc-500 flex items-center gap-1">
                                                    Clave Corta (Opcional)
                                                </label>
                                                <Input 
                                                    value={item.newShortCode} 
                                                    onChange={(e) => updateItem(item.id, 'newShortCode', e.target.value)}
                                                    placeholder="Ej: DISCO-INOX-4"
                                                    className="h-8 text-xs bg-white font-mono" 
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <label className="text-xs text-blue-600 font-medium flex items-center gap-1">
                                                <LinkIcon size={12} /> Sumar a Inventario Existente
                                            </label>
                                            <Select 
                                                value={item.linkedProductId.toString()} 
                                                onValueChange={(val) => updateItem(item.id, 'linkedProductId', val)}
                                            >
                                                <SelectTrigger className="h-9 bg-white">
                                                    <SelectValue placeholder="Buscar producto..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {existingProducts.map((p) => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>
                                                            {p.description} <span className="text-zinc-400">({p.code})</span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-zinc-400">
                                                Se sumarán <b>{item.quantity}</b> unidades al stock actual.
                                            </p>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>

             <div className="mt-4 pt-4 border-t border-zinc-100 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setStep(1)}>Atrás</Button>
                <Button onClick={handleFinalSave} disabled={loading} className="bg-zinc-900 text-white">
                    {loading ? "Procesando..." : `Confirmar Importación (${importItems.length} items)`}
                </Button>
             </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}