"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
    FileUp, Save, Link as LinkIcon, ArrowRight, Wand2, Trash2, 
    Hammer, PaintBucket, RotateCcw, AlertTriangle, PlusCircle, Box, AlertOctagon 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Asegúrate de tener este componente ui/alert o usa un div normal
import { parseFacturaXML, processXmlImport } from "@/app/actions/import-xml"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"
import { toast } from "sonner" 

interface Props {
  existingProducts: { id: number, description: string, code: string, stock?: number }[]
}

export function ImportWorkspace({ existingProducts }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importItems, setImportItems] = useState<any[]>([])
  
  // NUEVO ESTADO: Información de la factura
const [invoiceInfo, setInvoiceInfo] = useState<{ uuid: string, isDuplicate: boolean, provider: string, details?: string } | null>(null)

  // --- 1. SUBIR XML ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    setLoading(true)
    const formData = new FormData()
    formData.append('xml', e.target.files[0])

    const result = await parseFacturaXML(formData)
    setLoading(false)

    if (result.success && result.data) {
      const { items, invoiceInfo } = result.data
      
      const preparedItems = (items || []).map((item: any, index: number) => ({
        id: index,
        originalCode: item.noIdentificacion,
        originalDesc: item.descripcion,
        originalProvider: item.providerName || "Proveedor General", 
        quantity: item.cantidad,
        action: 'create', 
        linkedProductId: item.suggestedProduct?.id || "",
        newCode: '', 
        newShortCode: item.noIdentificacion, 
        newDesc: item.descripcion,
        newCategory: 'Consumible',
        newMinStock: 5 
      }))
      
      setImportItems(preparedItems)
      setInvoiceInfo(invoiceInfo) // Guardamos info de la factura
      setStep(2)
      
      // ALERTA INMEDIATA SI ES DUPLICADA
      if (invoiceInfo.isDuplicate) {
          toast.error("¡Factura Duplicada!", { 
              description: "Este XML ya fue importado anteriormente. Revisa con cuidado antes de continuar.",
              duration: 8000
          })
      } else {
          toast.success("Factura analizada correctamente")
      }
    } else {
      toast.error("Error al leer XML", { description: result.error })
    }
  }

  // ... (Funciones applyRandomCodes, applyCategoryToAll, applyActionToAll, toggleIgnore SIN CAMBIOS) ...
  const applyRandomCodes = () => {
    setImportItems(prev => prev.map(item => {
        if (item.action !== 'create') return item
        if (item.newCode) return item 
        const randomCode = "PROD-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        return { ...item, newCode: randomCode }
    }))
    toast.info("Códigos generados para campos vacíos")
  }

  const applyCategoryToAll = (category: string) => {
    setImportItems(prev => prev.map(item => {
        if (item.action !== 'create') return item
        return { ...item, newCategory: category }
    }))
  }

  const applyActionToAll = (action: 'create' | 'link') => {
    setImportItems(prev => prev.map(item => {
        if (item.action === 'ignore') return item
        return { ...item, action: action }
    }))
  }

  const toggleIgnore = (id: number) => {
    setImportItems(prev => prev.map(item => {
        if (item.id !== id) return item
        if (item.action === 'ignore') {
             return { ...item, action: 'create' } 
        }
        return { ...item, action: 'ignore' }
    }))
  }

  // --- 3. GUARDAR Y VALIDAR ---
  async function handleFinalSave() {
    const itemsToProcess = importItems.filter(i => i.action !== 'ignore')
    
    if (itemsToProcess.length === 0) {
        toast.warning("Nada que procesar", { description: "Todos los items están marcados como ignorar." })
        return
    }

    // SI ES DUPLICADA, PEDIMOS CONFIRMACIÓN EXTRA
    if (invoiceInfo?.isDuplicate) {
        const confirm = window.confirm("ADVERTENCIA: Esta factura ya fue registrada anteriormente.\n\n¿Estás SEGURO de que quieres volver a importarla? Esto podría duplicar el stock.")
        if (!confirm) return
    }

    // ... (Validaciones anteriores de links, códigos vacíos, duplicados internos y externos SIN CAMBIOS) ...
    const invalidLinks = itemsToProcess.find(i => 
        i.action === 'link' && (!i.linkedProductId || i.linkedProductId.toString() === "0" || i.linkedProductId === "")
    )
    if (invalidLinks) {
        toast.error("Faltan Selecciones en 'Vincular'", { description: "Selecciona un producto para vincular." }); return
    }

    const emptyCodes = itemsToProcess.find(i => i.action === 'create' && !i.newCode?.trim())
    if (emptyCodes) {
        toast.error("Faltan Códigos QR", { description: "Genera o escribe los códigos faltantes." }); return 
    }

    const codesInBatch = itemsToProcess.filter(i => i.action === 'create').map(i => i.newCode?.trim().toUpperCase());
    const uniqueCodes = new Set(codesInBatch);
    if (uniqueCodes.size !== codesInBatch.length) {
        toast.error("Códigos Duplicados en Lista", { description: "No puedes repetir códigos en la misma importación." }); return;
    }

    const dbConflict = itemsToProcess.find(item => 
        item.action === 'create' && 
        existingProducts.some(ep => ep.code.toUpperCase() === item.newCode?.trim().toUpperCase())
    );
    if (dbConflict) {
        toast.error("Código Ya Existe", { description: `El código '${dbConflict.newCode}' ya existe.` }); return;
    }

    setLoading(true)
    const payload = itemsToProcess.map(item => ({
        action: item.action,
        linkedProductId: item.action === 'link' ? parseInt(item.linkedProductId) : null,
        quantity: item.quantity,
        code: item.newCode, 
        description: item.newDesc,
        category: item.newCategory,
        shortCode: item.newShortCode,
        minStock: parseInt(item.newMinStock),
        providerName: item.originalProvider 
    }))

    // ENVIAMOS EL UUID AL SERVIDOR PARA REGISTRARLO
    const result = await processXmlImport({ 
        items: payload, 
        invoiceUuid: invoiceInfo?.uuid 
    })
    
    setLoading(false)

    if (result.success) {
        toast.success("Importación Exitosa")
        router.push("/inventory")
        router.refresh()
    } else {
        toast.error("Error al guardar", { description: result.error })
    }
  }

  // ... (Resto de funciones updateItem y getLinkedProductInfo SIN CAMBIOS) ...
  const updateItem = (id: number, field: string, value: any) => {
    if (field === 'newMinStock' || field === 'quantity') {
        const clean = value.toString().replace(/[^0-9]/g, '');
        value = clean === '' ? '' : parseInt(clean, 10);
    }
    if (field === 'newCode') {
        value = value.toString().toUpperCase().replace(/\s/g, '');
    }
    setImportItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  const getLinkedProductInfo = (id: string) => {
      return existingProducts.find(p => p.id.toString() === id);
  }

  if (step === 1) {
    // ... (Vista de carga SIN CAMBIOS) ...
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] border-2 border-dashed border-zinc-200 rounded-xl bg-zinc-50/50">
            <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                <FileUp size={48} className="text-zinc-400" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Cargar Factura XML</h2>
            <p className="text-zinc-500 mb-6 text-center max-w-md">
                Sube tu CFDI 3.3 o 4.0. Detectaremos automáticamente los productos y te ayudaremos a organizarlos.
            </p>
            <div className="relative">
                <Button className="pointer-events-none bg-zinc-900 text-white">Seleccionar Archivo</Button>
                <Input 
                    type="file" 
                    accept=".xml" 
                    onChange={handleFileUpload} 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={loading}
                />
            </div>
            {loading && <p className="mt-4 text-sm animate-pulse text-zinc-500">Analizando estructura del XML...</p>}
        </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* NUEVO: ALERTA DE FACTURA DUPLICADA */}
        {invoiceInfo?.isDuplicate && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-4 animate-in fade-in slide-in-from-top-2 mb-4">
                <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-yellow-800 font-bold mb-1">¡Atención: Productos ya registrados!</h4>
                    <p className="text-sm text-yellow-700 mb-2">
                        El sistema detectó que este XML contiene claves de proveedor que ya existen en tu inventario.
                        <br/>
                        <span className="font-mono bg-yellow-100 px-1 rounded text-xs mt-1 inline-block">
                            {invoiceInfo.details || "Coincidencia encontrada en base de datos."}
                        </span>
                    </p>
                    <div className="flex gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={() => setStep(1)} className="bg-white border-yellow-200 text-yellow-700 hover:bg-yellow-100 h-8 text-xs">
                            Cancelar Importación
                        </Button>
                        {/* Mensaje visual indicando que puede continuar */}
                        <div className="text-xs text-yellow-600 flex items-center italic">
                            Puedes continuar si deseas sumar stock (Vincular).
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* BARRA DE ACCIONES RÁPIDAS */}
        <Card className={`bg-white shadow-sm sticky top-4 z-20 transition-colors ${invoiceInfo?.isDuplicate ? 'border-red-200 ring-2 ring-red-100' : 'border-zinc-200'}`}>
             {/* ... (Contenido de la barra SIN CAMBIOS IMPORTANTE) ... */}
            <CardContent className="p-3 flex flex-col md:flex-row flex-wrap items-center gap-4 justify-between">
                
                {/* GRUPO IZQUIERDO */}
                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-1 shrink-0">Lotes:</span>
                    
                    <Button variant="outline" size="sm" onClick={() => applyActionToAll('create')} className="gap-1.5 h-7 text-xs bg-zinc-50 text-zinc-600 hover:text-green-700 hover:bg-green-50 hover:border-green-200">
                        <PlusCircle size={12} /> Todo Crear
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => applyActionToAll('link')} className="gap-1.5 h-7 text-xs bg-zinc-50 text-zinc-600 hover:text-blue-700 hover:bg-blue-50 hover:border-blue-200">
                        <LinkIcon size={12} /> Todo Vincular
                    </Button>

                    <div className="h-4 w-px bg-zinc-200 mx-1 shrink-0" />

                    <Button variant="outline" size="sm" onClick={applyRandomCodes} className="gap-1.5 h-7 text-xs bg-zinc-50 text-zinc-600 hover:text-purple-700 hover:bg-purple-50 hover:border-purple-200">
                        <Wand2 size={12} /> Códigos QR
                    </Button>

                    <div className="h-4 w-px bg-zinc-200 mx-1 shrink-0" />

                    <Button variant="outline" size="sm" onClick={() => applyCategoryToAll('Herramienta')} className="gap-1.5 h-7 text-xs bg-zinc-50 text-zinc-600 hover:text-zinc-900">
                        <Hammer size={12} /> Herramientas
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => applyCategoryToAll('Consumible')} className="gap-1.5 h-7 text-xs bg-zinc-50 text-zinc-600 hover:text-zinc-900">
                        <PaintBucket size={12} /> Consumibles
                    </Button>
                </div>

                {/* GRUPO DERECHO */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500 h-8 text-xs">
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleFinalSave} 
                        disabled={loading} 
                        className={`h-8 text-xs font-bold px-4 shadow-md text-white ${invoiceInfo?.isDuplicate ? 'bg-red-600 hover:bg-red-700' : 'bg-[#de2d2d] hover:bg-[#de2d2d]/90'}`}
                    >
                        <Save size={14} className="mr-2" />
                        {loading ? "Guardando..." : `Importar ${importItems.filter(i => i.action !== 'ignore').length} Ítems`}
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* ... (TABLA DE TRABAJO SIN CAMBIOS) ... */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
             {/* El contenido de la tabla sigue igual */}
             <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th className="p-3 text-left w-[25%] font-medium text-zinc-500 pl-6">Producto en Factura</th>
                        <th className="p-3 text-center w-[180px] font-medium text-zinc-500">Acción</th>
                        <th className="p-3 text-left font-medium text-zinc-500">Configuración en Sistema</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {importItems.map((item) => {
                        const isIgnored = item.action === 'ignore';
                        const linkedInfo = item.linkedProductId ? getLinkedProductInfo(item.linkedProductId) : null;

                        return (
                        <tr key={item.id} className={`group transition-colors ${isIgnored ? 'bg-zinc-50/80 opacity-60' : 'hover:bg-zinc-50/50'}`}>
                             {/* ... (CONTENIDO DE CELDAS IDÉNTICO AL ANTERIOR) ... */}
                             {/* Nota: Copia el contenido interno de las celdas de tu archivo anterior aquí, no cambia nada en la tabla */}
                             {/* 1. XML INFO */}
                            <td className="p-4 align-top pl-6">
                                <div className={`font-semibold text-sm ${isIgnored ? 'text-zinc-400 line-through' : 'text-zinc-800'}`}>
                                    {item.originalDesc}
                                </div>
                                <div className="flex flex-col gap-1 mt-1.5">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] text-zinc-500 font-mono border-zinc-200 bg-white">
                                            {item.originalCode}
                                        </Badge>
                                        <Badge variant="secondary" className="text-[10px] bg-zinc-100 text-zinc-600">
                                            x {item.quantity}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 truncate max-w-[200px]" title={item.originalProvider}>
                                        {item.originalProvider}
                                    </span>
                                </div>
                            </td>

                            {/* 2. SELECTOR ACCIÓN */}
                            <td className="p-4 align-top">
                                <div className="flex justify-center">
                                    <Select 
                                        value={item.action} 
                                        onValueChange={(val) => updateItem(item.id, 'action', val)}
                                        disabled={isIgnored}
                                    >
                                        <SelectTrigger className={`
                                            h-8 w-[160px] text-xs font-medium border-zinc-200 shadow-sm transition-all
                                            ${item.action === 'create' ? 'bg-green-50 text-green-700 border-green-200 hover:border-green-300' : ''}
                                            ${item.action === 'link' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-300' : ''}
                                        `}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="create" className="text-xs font-medium focus:bg-green-50 focus:text-green-700">
                                                <div className="flex items-center gap-2">
                                                    <PlusCircle size={14} /> Crear Nuevo
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="link" className="text-xs font-medium focus:bg-blue-50 focus:text-blue-700">
                                                <div className="flex items-center gap-2">
                                                    <LinkIcon size={14} /> Vincular Existente
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {!isIgnored && (
                                    <div className="flex justify-center mt-2">
                                        <ArrowRight className={`rotate-90 md:rotate-0 text-zinc-200`} size={16} />
                                    </div>
                                )}
                            </td>

                            {/* 3. FORMULARIO */}
                            <td className="p-4 align-top">
                                {isIgnored ? (
                                    <div className="h-full flex items-center justify-start text-zinc-400 text-xs italic bg-zinc-50/50 p-4 rounded-lg border border-zinc-100 border-dashed">
                                        Producto ignorado. No se importará.
                                    </div>
                                ) : item.action === 'create' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white p-4 rounded-xl border border-zinc-200 shadow-sm transition-shadow hover:shadow-md">
                                        
                                        <div className="md:col-span-12">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Descripción en Sistema</label>
                                            <Input 
                                                value={item.newDesc} 
                                                onChange={(e) => updateItem(item.id, 'newDesc', e.target.value)}
                                                className="h-8 text-xs bg-zinc-50/50 border-zinc-200 focus:bg-white transition-all" 
                                            />
                                        </div>

                                        <div className="md:col-span-4">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Código (QR)</label>
                                            <Input 
                                                value={item.newCode} 
                                                onChange={(e) => updateItem(item.id, 'newCode', e.target.value)}
                                                placeholder="Generar..."
                                                className={`h-8 text-xs font-mono transition-all ${!item.newCode ? "border-red-200 bg-red-50 focus:border-red-400" : "bg-zinc-50/50 border-zinc-200"}`}
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Clave Prov.</label>
                                            <Input 
                                                value={item.newShortCode} 
                                                onChange={(e) => updateItem(item.id, 'newShortCode', e.target.value)}
                                                className="h-8 text-xs bg-zinc-50/50 border-zinc-200 font-mono text-zinc-600" 
                                            />
                                        </div>

                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400 mb-1 block">Categoría</label>
                                            <select 
                                                className="w-full h-8 text-xs border border-zinc-200 rounded-md bg-zinc-50/50 px-2 focus:ring-2 focus:ring-black/5 outline-none transition-all"
                                                value={item.newCategory}
                                                onChange={(e) => updateItem(item.id, 'newCategory', e.target.value)}
                                            >
                                                <option value="Consumible">Consumible</option>
                                                <option value="Herramienta">Herramienta</option>
                                                <option value="EPP">EPP</option>
                                            </select>
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1 mb-1">
                                                Min <AlertTriangle size={10} />
                                            </label>
                                            <Input 
                                                type="number"
                                                value={item.newMinStock} 
                                                onChange={(e) => updateItem(item.id, 'newMinStock', e.target.value)}
                                                className="h-8 text-xs bg-red-50/50 border-red-100 text-center font-bold text-red-600 focus:border-red-300" 
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-100 shadow-sm">
                                        <label className="text-[10px] uppercase font-bold text-blue-600 mb-2 block flex items-center gap-1.5">
                                            <LinkIcon size={12} /> Buscar Producto para Sumar Stock
                                        </label>

                                        <div className="bg-white rounded-md border border-blue-100">
                                            <SearchableProductSelect 
                                                products={existingProducts}
                                                value={item.linkedProductId.toString()}
                                                onChange={(val) => updateItem(item.id, 'linkedProductId', val)}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between mt-3 px-1">
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none shadow-none">
                                                    + {item.quantity} unidades
                                                </Badge>
                                            </div>
                                            
                                            {linkedInfo && (
                                                <div className="flex items-center gap-3 text-[10px] text-zinc-500 bg-white/60 px-2 py-1 rounded border border-blue-100">
                                                    <span className="flex items-center gap-1">
                                                        <Box size={10} className="text-zinc-400"/>
                                                        Stock: <b>{linkedInfo.stock || 0}</b>
                                                    </span>
                                                    <span className="h-3 w-px bg-zinc-300"></span>
                                                    <span className="font-mono text-zinc-600">{linkedInfo.code}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </td>

                            {/* 4. BOTÓN IGNORAR */}
                            <td className="p-4 align-top text-right pr-6">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => toggleIgnore(item.id)}
                                    className={`
                                        h-8 w-8 transition-all duration-200
                                        ${isIgnored 
                                            ? "text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100" 
                                            : "text-zinc-300 hover:text-red-500 hover:bg-red-50"}
                                    `}
                                    title={isIgnored ? "Restaurar" : "Ignorar este producto"}
                                >
                                    {isIgnored ? <RotateCcw size={16} /> : <Trash2 size={16} />}
                                </Button>
                            </td>
                        </tr>
                    )})}
                </tbody>
            </table>
        </div>
    </div>
  )
}