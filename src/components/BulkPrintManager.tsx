"use client"

import { useState } from "react"
import { ProductLabel } from "@/components/ProductLabel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings2, RotateCcw, Printer, Edit2, AlertCircle } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Product {
  id: number
  code: string
  description: string
  shortCode: string | null
  category: string
}

// LÍMITES DE SEGURIDAD (En CM)
const MIN_SIZE_CM = 1.5; 
const MAX_SIZE_CM = 20; // Límite basado en la óptica del escáner y ancho de impresoras

export function BulkPrintManager({ products }: { products: Product[] }) {
  const [globalSize, setGlobalSize] = useState({ width: 6, height: 4 })
  const [overrides, setOverrides] = useState<Record<number, { width: number, height: number }>>({})

  // --- 1. MANEJAR CAMBIOS (Mientras escribes) ---
  const handleChange = (
    key: 'width' | 'height', 
    val: string, 
    mode: 'global' | 'individual', 
    id?: number,
    currentHeight?: number,
    currentWidth?: number
  ) => {
    // Si borran todo, guardamos 0 temporalmente
    const num = val === '' ? 0 : parseFloat(val);

    if (mode === 'global') {
        setGlobalSize(prev => ({ ...prev, [key]: num }));
    } else if (id !== undefined) {
        setOverrides(prev => ({
             ...prev, 
             [id]: { 
                width: key === 'width' ? num : (currentWidth || globalSize.width),
                height: key === 'height' ? num : (currentHeight || globalSize.height)
             } 
        }));
    }
  }

  // --- 2. VALIDAR AL SALIR (OnBlur) ---
  // Aquí aplicamos la ley: ni muy chico, ni muy grande
  const handleBlur = (
    key: 'width' | 'height', 
    mode: 'global' | 'individual', 
    id?: number,
    currentVal?: number
  ) => {
    let finalVal = currentVal || 0;

    // A. Si está vacío o es menor al mínimo -> Ajustar al Mínimo
    if (!currentVal || currentVal < MIN_SIZE_CM) {
        finalVal = MIN_SIZE_CM;
    } 
    // B. Si es mayor al máximo -> Ajustar al Máximo
    else if (currentVal > MAX_SIZE_CM) {
        finalVal = MAX_SIZE_CM;
    } 
    // C. Si está bien, no hacemos nada (retornamos para evitar render innecesario)
    else {
        return;
    }

    // Aplicar corrección
    if (mode === 'global') {
        setGlobalSize(prev => ({ ...prev, [key]: finalVal }));
    } else if (id !== undefined && overrides[id]) {
        setOverrides(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [key]: finalVal
            }
        }));
    }
  }

  const resetIndividual = (id: number) => {
    const newOverrides = { ...overrides }
    delete newOverrides[id]
    setOverrides(newOverrides)
  }

  return (
    <div>
      {/* --- BARRA DE CONTROL GLOBAL --- */}
      <div className="bg-white p-4 rounded-xl border border-zinc-200 shadow-sm mb-8 flex flex-wrap items-center justify-between gap-6 print:hidden">
         
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-zinc-700 font-medium">
                <Settings2 size={20} className="text-blue-600" />
                <span>Medidas (cm):</span>
            </div>
            
            <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Ancho</Label>
                <Input 
                    type="number" 
                    step="0.1"
                    min={MIN_SIZE_CM}
                    max={MAX_SIZE_CM}
                    value={globalSize.width || ''} 
                    onChange={(e) => handleChange('width', e.target.value, 'global')}
                    onBlur={() => handleBlur('width', 'global', undefined, globalSize.width)}
                    className="w-20 h-8"
                />
                <span className="text-xs text-zinc-400">cm</span>
            </div>
            <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Alto</Label>
                <Input 
                    type="number" 
                    step="0.1"
                    min={MIN_SIZE_CM}
                    max={MAX_SIZE_CM}
                    value={globalSize.height || ''} 
                    onChange={(e) => handleChange('height', e.target.value, 'global')}
                    onBlur={() => handleBlur('height', 'global', undefined, globalSize.height)}
                    className="w-20 h-8"
                />
                <span className="text-xs text-zinc-400">cm</span>
            </div>
            <div className="text-[10px] text-zinc-400 flex flex-col justify-center border-l pl-4 ml-2 leading-tight">
                <span className="flex items-center gap-1"><AlertCircle size={10}/> Min: {MIN_SIZE_CM} cm</span>
                <span>Max: {MAX_SIZE_CM} cm</span>
            </div>
         </div>

         <div className="flex items-center gap-3">
             <Button 
                variant="outline" 
                size="sm" 
                onClick={() => { setGlobalSize({width: 6, height: 4}); setOverrides({}) }}
             >
                <RotateCcw size={14} className="mr-2"/> Reset
             </Button>
             <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-700 gap-2 text-white">
                <Printer size={16}/> Imprimir
             </Button>
         </div>
      </div>

      {/* --- GRILLA --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:block print:w-auto print:m-0">
         <style type="text/css" media="print">
            {`
              @page { size: auto; margin: 0mm; }
              body { margin: 0px; }
              .label-wrapper { 
                 break-inside: avoid; 
                 page-break-inside: avoid;
                 display: inline-block;
                 margin: 0.2cm; 
                 position: relative;
              }
              .edit-controls { display: none !important; }
            `}
         </style>

         {products.map(product => {
            const size = overrides[product.id] || globalSize
            const isCustomized = !!overrides[product.id]

            // PROTECCIÓN VISUAL
            const displayWidth = Math.min(Math.max(size.width, MIN_SIZE_CM), MAX_SIZE_CM)
            const displayHeight = Math.min(Math.max(size.height, MIN_SIZE_CM), MAX_SIZE_CM)

            return (
            <div key={product.id} className="label-wrapper group relative flex flex-col items-center">
                <ProductLabel 
                    product={product} 
                    width={displayWidth} 
                    height={displayHeight}
                    className={isCustomized ? "ring-2 ring-blue-500 ring-offset-2 print:ring-0" : ""}
                />

                <div className="edit-controls absolute -top-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button size="icon" className="h-8 w-8 rounded-full shadow-md bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600">
                                <Edit2 size={14} />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-3 z-50">
                            <div className="space-y-3">
                                <h4 className="font-medium text-xs text-zinc-500 uppercase flex justify-between">
                                    Personalizado
                                </h4>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Ancho</Label>
                                        <Input 
                                            type="number"
                                            step="0.1" 
                                            min={MIN_SIZE_CM}
                                            max={MAX_SIZE_CM}
                                            className="h-7 text-xs" 
                                            value={size.width || ''}
                                            onChange={(e) => handleChange('width', e.target.value, 'individual', product.id, size.height, size.width)}
                                            onBlur={() => handleBlur('width', 'individual', product.id, size.width)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Alto</Label>
                                        <Input 
                                            type="number" 
                                            step="0.1"
                                            min={MIN_SIZE_CM}
                                            max={MAX_SIZE_CM}
                                            className="h-7 text-xs" 
                                            value={size.height || ''}
                                            onChange={(e) => handleChange('height', e.target.value, 'individual', product.id, size.height, size.width)}
                                            onBlur={() => handleBlur('height', 'individual', product.id, size.height)}
                                        />
                                    </div>
                                </div>
                                <div className="text-[10px] text-center text-zinc-400 border-t pt-2 mt-1">
                                    Rango válido: {MIN_SIZE_CM} - {MAX_SIZE_CM} cm
                                </div>
                                {isCustomized && (
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="w-full text-xs h-7 text-red-500 hover:bg-red-50"
                                        onClick={() => resetIndividual(product.id)}
                                    >
                                        <RotateCcw size={12} className="mr-2"/> Usar Global
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                
                <span className="edit-controls mt-2 text-[10px] text-zinc-400 font-mono">
                    {size.width || 0}cm x {size.height || 0}cm {isCustomized && "(Individual)"}
                </span>
            </div>
         )})}
      </div>
    </div>
  )
}