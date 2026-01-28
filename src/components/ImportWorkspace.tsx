"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileUp, Save, Link as LinkIcon, ArrowRight, Wand2, Trash2, Hammer, PaintBucket, RotateCcw, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { parseFacturaXML, processXmlImport } from "@/app/actions/import-xml"
import { SearchableProductSelect } from "@/components/SearchableProductSelect"

interface Props {
  existingProducts: { id: number, description: string, code: string }[]
}

export function ImportWorkspace({ existingProducts }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importItems, setImportItems] = useState<any[]>([])

  // --- 1. SUBIR XML ---
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return
    setLoading(true)
    const formData = new FormData()
    formData.append('xml', e.target.files[0])

    const result = await parseFacturaXML(formData)
    setLoading(false)

    if (result.success) {
      const preparedItems = (result.data || []).map((item: any, index: number) => ({
        id: index,
        originalCode: item.noIdentificacion,
        originalDesc: item.descripcion,
        // CORRECCIÓN 1: Capturamos el proveedor del XML (o ponemos uno default)
        originalProvider: item.providerName || "Proveedor General", 
        quantity: item.cantidad,
        
        // Acción por defecto: CREAR (para decisión manual)
        action: 'create',
        linkedProductId: item.suggestedProduct?.id || "",
        
        // Datos nuevos
        newCode: '', 
        newShortCode: item.noIdentificacion, 
        newDesc: item.descripcion,
        newCategory: 'Consumible',
        
        // Stock Mínimo por defecto
        newMinStock: 5 
      }))
      setImportItems(preparedItems)
      setStep(2)
    } else {
      alert(result.error)
    }
  }

  // --- 2. ACCIONES RÁPIDAS ---
  const applyRandomCodes = () => {
    setImportItems(prev => prev.map(item => {
        if (item.action !== 'create') return item
        // Generamos código solo si el campo está vacío (para no sobrescribir manuales)
        if (item.newCode) return item 
        
        const randomCode = "PROD-" + Math.random().toString(36).substring(2, 8).toUpperCase()
        return { ...item, newCode: randomCode }
    }))
  }

  const applyCategoryToAll = (category: string) => {
    setImportItems(prev => prev.map(item => {
        if (item.action !== 'create') return item
        return { ...item, newCategory: category }
    }))
  }

  const toggleIgnore = (id: number) => {
    setImportItems(prev => prev.map(item => {
        if (item.id !== id) return item
        if (item.action === 'ignore') {
             return { ...item, action: 'create' } // Al restaurar, vuelve a create
        }
        return { ...item, action: 'ignore' }
    }))
  }

  // --- 3. GUARDAR ---
  async function handleFinalSave() {
    const itemsToProcess = importItems.filter(i => i.action !== 'ignore')
    
    if (itemsToProcess.length === 0) {
        alert("No hay items para procesar.")
        return
    }

    // A. Validar Vínculos
    const invalidLinks = itemsToProcess.find(i => i.action === 'link' && !i.linkedProductId)
    if (invalidLinks) {
        alert("Hay productos marcados para 'Vincular' sin producto seleccionado.")
        return
    }

    // B. Validar Códigos QR Vacíos
    const emptyCodes = itemsToProcess.find(i => i.action === 'create' && !i.newCode?.trim())
    
    if (emptyCodes) {
        alert("⚠️ Faltan Códigos QR\n\nNo podemos guardar productos sin identificación. Por favor, escribe un código manual o usa el botón 'Códigos Mágicos' para generarlos automáticamente.")
        return 
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
        // CORRECCIÓN 2: Enviamos el nombre del proveedor para guardarlo en la BD
        providerName: item.originalProvider 
    }))

    const result = await processXmlImport(payload)
    setLoading(false)

    if (result.success) {
        router.push("/inventory")
        router.refresh()
    } else {
        alert("Error al guardar: " + result.error)
    }
  }

  const updateItem = (id: number, field: string, value: any) => {
    setImportItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item))
  }

  if (step === 1) {
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
        {/* BARRA DE ACCIONES RÁPIDAS */}
        <Card className="bg-white border-zinc-200 shadow-sm sticky top-4 z-20">
            <CardContent className="p-4 flex flex-wrap items-center gap-4 justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-700 mr-2">Acciones Rápidas:</span>
                    
                    <Button variant="outline" size="sm" onClick={applyRandomCodes} className="gap-2 h-8" title="Generar códigos solo para los vacíos">
                        <Wand2 size={14} className="text-purple-600" />
                        Códigos Mágicos
                    </Button>

                    <div className="h-4 w-px bg-zinc-200 mx-1" />

                    <Button variant="outline" size="sm" onClick={() => applyCategoryToAll('Herramienta')} className="gap-2 h-8">
                        <Hammer size={14} className="text-blue-600" />
                        Todo Herramientas
                    </Button>
                    
                    <Button variant="outline" size="sm" onClick={() => applyCategoryToAll('Consumible')} className="gap-2 h-8">
                        <PaintBucket size={14} className="text-amber-600" />
                        Todo Consumibles
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" onClick={() => setStep(1)} className="text-zinc-500">
                        Cancelar
                    </Button>
                    <Button onClick={handleFinalSave} disabled={loading} className="bg-zinc-900 text-white shadow-md hover:bg-zinc-800">
                        <Save size={16} className="mr-2" />
                        {loading ? "Guardando..." : `Importar ${importItems.filter(i => i.action !== 'ignore').length} Productos`}
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* TABLA DE TRABAJO */}
        <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th className="p-3 text-left w-1/4 font-medium text-zinc-500">Origen (XML)</th>
                        <th className="p-3 text-center w-[140px] font-medium text-zinc-500">Acción</th>
                        <th className="p-3 text-left font-medium text-zinc-500">Destino (Tu Sistema)</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                    {importItems.map((item) => {
                        const isIgnored = item.action === 'ignore'
                        return (
                        <tr key={item.id} className={`group transition-colors ${isIgnored ? 'bg-zinc-50 opacity-50' : 'hover:bg-blue-50/10'}`}>
                            
                            {/* 1. XML INFO */}
                            <td className="p-4 align-top">
                                <div className={`font-medium ${isIgnored ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                                    {item.originalDesc}
                                </div>
                                {/* CORRECCIÓN 3: Mostramos visualmente el proveedor detectado */}
                                <div className="text-xs text-zinc-500 font-mono mt-1">
                                    <span className="font-bold text-zinc-400 mr-1">PROV:</span>
                                    {item.originalProvider}
                                </div>
                                <div className="text-xs text-zinc-400 font-mono mt-0.5">
                                    Clave: {item.originalCode}
                                </div>
                                <Badge variant="secondary" className="mt-2 text-zinc-600">
                                    + {item.quantity} pzas
                                </Badge>
                            </td>

                            {/* 2. SELECTOR ACCIÓN */}
                            <td className="p-4 align-top">
                                <div className="flex flex-col items-center gap-2">
                                    <ArrowRight className={`rotate-90 md:rotate-0 ${isIgnored ? 'text-zinc-200' : 'text-blue-200'}`} />
                                    <select
                                        className="text-xs border rounded p-1.5 w-full bg-white font-medium"
                                        value={item.action}
                                        onChange={(e) => updateItem(item.id, 'action', e.target.value)}
                                        disabled={isIgnored}
                                    >
                                        <option value="create">Crear Nuevo</option>
                                        <option value="link">Vincular</option>
                                    </select>
                                </div>
                            </td>

                            {/* 3. FORMULARIO */}
                            <td className="p-4 align-top">
                                {isIgnored ? (
                                    <span className="text-xs italic text-zinc-400">Este producto será ignorado.</span>
                                ) : item.action === 'create' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-100">
                                        
                                        {/* DESCRIPCIÓN */}
                                        <div className="md:col-span-12">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400">Descripción</label>
                                            <Input 
                                                value={item.newDesc} 
                                                onChange={(e) => updateItem(item.id, 'newDesc', e.target.value)}
                                                className="h-8 text-xs bg-white" 
                                            />
                                        </div>

                                        {/* CÓDIGO QR */}
                                        <div className="md:col-span-4">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400">Código (QR)</label>
                                            <Input 
                                                value={item.newCode} 
                                                onChange={(e) => updateItem(item.id, 'newCode', e.target.value)}
                                                placeholder="Generar o Escanear"
                                                className={`h-8 text-xs bg-white font-mono ${!item.newCode ? "border-red-300 focus:border-red-500 bg-red-50/50" : "border-zinc-300"}`}
                                            />
                                        </div>

                                        {/* CLAVE CORTA (PROV) */}
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400">Clave Prov.</label>
                                            <Input 
                                                value={item.newShortCode} 
                                                onChange={(e) => updateItem(item.id, 'newShortCode', e.target.value)}
                                                className="h-8 text-xs bg-white font-mono text-zinc-500" 
                                            />
                                        </div>

                                        {/* CATEGORÍA */}
                                        <div className="md:col-span-3">
                                            <label className="text-[10px] uppercase font-bold text-zinc-400">Categoría</label>
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

                                        {/* STOCK MÍNIMO */}
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] uppercase font-bold text-red-400 flex items-center gap-1">
                                                Min <AlertTriangle size={10} />
                                            </label>
                                            <Input 
                                                type="number"
                                                value={item.newMinStock} 
                                                onChange={(e) => updateItem(item.id, 'newMinStock', e.target.value)}
                                                className="h-8 text-xs bg-red-50 border-red-100 text-center font-bold text-red-600 focus:border-red-300" 
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 shadow-sm">
                                        <label className="text-[10px] uppercase font-bold text-blue-500 mb-1.5 block flex items-center gap-1">
                                            <LinkIcon size={10} /> Vincular a Stock Existente
                                        </label>

                                        {/* BUSCADOR INTELIGENTE */}
                                        <SearchableProductSelect 
                                            products={existingProducts}
                                            value={item.linkedProductId.toString()}
                                            onChange={(val) => updateItem(item.id, 'linkedProductId', val)}
                                        />

                                        <p className="text-[10px] text-zinc-400 mt-2 ml-1">
                                            Se sumarán <b>{item.quantity}</b> unidades.
                                        </p>
                                    </div>
                                )}
                            </td>

                            {/* 4. BOTÓN IGNORAR */}
                            <td className="p-4 align-top text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => toggleIgnore(item.id)}
                                    className={isIgnored ? "text-green-600 hover:text-green-700 bg-green-50" : "text-zinc-400 hover:text-red-500 hover:bg-red-50"}
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