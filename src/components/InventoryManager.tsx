"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation" 
import { Product } from "@prisma/client"
import { Printer, AlertTriangle, CheckSquare, Square, Filter, XCircle, Bell, BellOff, RotateCcw, QrCode } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditProductDialog } from "@/components/EditProductDialog"
import { ProviderKeyDisplay } from "@/components/ProviderKeyDisplay"
import { DeleteProductButton } from "@/components/DeleteProductButton"
import { LowStockAlert } from "@/components/LowStockAlert"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Props {
  products: Product[]
  initialLowStock?: Product[] 
}

export function InventoryManager({ products, initialLowStock = [] }: Props) {
  const router = useRouter() 
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all')
  const [alertSnoozedUntil, setAlertSnoozedUntil] = useState<number | null>(null)

  const alertProducts = initialLowStock.length > 0 ? initialLowStock : products

  useEffect(() => {
     checkSnoozeStatus()
  }, [])

  const checkSnoozeStatus = () => {
      const snooze = localStorage.getItem("inventory_alert_snooze")
      if (snooze && parseInt(snooze) > new Date().getTime()) {
          setAlertSnoozedUntil(parseInt(snooze))
      } else {
          setAlertSnoozedUntil(null)
      }
  }

  const resetAlert = () => {
      localStorage.removeItem("inventory_alert_snooze")
      setAlertSnoozedUntil(null)
      window.dispatchEvent(new Event("storage")) 
  }

  const filteredProducts = products.filter(product => {
      if (filterMode === 'low') {
          return product.stock <= product.minStock
      }
      return true 
  })

  const lowStockCount = products.filter(p => p.stock <= p.minStock).length

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const toggleAll = () => {
    if (selectedIds.length === filteredProducts.length) setSelectedIds([]) 
    else setSelectedIds(filteredProducts.map(p => p.id)) 
  }

  return (
    <div>
        <LowStockAlert 
            products={alertProducts} 
            onReview={() => {
                router.push('/inventory?filter=low_stock')
            }} 
            onSnoozeChange={checkSnoozeStatus} 
        />

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                Inventario General
                {filterMode === 'low' && (
                    <Badge variant="destructive" className="ml-2">Filtro: Stock Bajo</Badge>
                )}
            </h2>
            
            <div className="flex gap-2 items-center">
                
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className={alertSnoozedUntil ? "text-orange-500 bg-orange-50 border-orange-200" : "text-zinc-400"}>
                            {alertSnoozedUntil ? <BellOff size={18} /> : <Bell size={18} />}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" align="end">
                        <div className="space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
                                <Bell size={14}/> Configuración de Alertas
                            </h4>
                            
                            {alertSnoozedUntil ? (
                                <div className="bg-orange-50 p-3 rounded-md border border-orange-100 text-xs space-y-2">
                                    <p className="text-orange-800 font-bold flex items-center gap-2">
                                        <BellOff size={12}/> Alertas Silenciadas
                                    </p>
                                    <p className="text-orange-600">
                                        Volverán a sonar el: <br/>
                                        <span className="font-mono bg-white px-1 rounded border border-orange-200 mt-1 inline-block">
                                            {new Date(alertSnoozedUntil).toLocaleString()}
                                        </span>
                                    </p>
                                    <Button size="sm" onClick={resetAlert} className="w-full bg-zinc-900 text-white hover:bg-zinc-800 h-8 text-xs mt-2">
                                        <RotateCcw size={12} className="mr-2"/> Reactivar Ahora
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-xs text-zinc-500 p-2 bg-zinc-50 rounded border border-zinc-100">
                                    Las alertas están activas. Si el sistema detecta stock bajo, te avisará automáticamente.
                                </div>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                <div className="h-6 w-px bg-zinc-200 mx-1" />

                {filterMode === 'low' ? (
                    <Button variant="outline" onClick={() => setFilterMode('all')} className="gap-2 text-zinc-600">
                        <XCircle size={16}/> Mostrar Todo
                    </Button>
                ) : (
                    <Button 
                        variant="outline" 
                        onClick={() => setFilterMode('low')} 
                        className={`gap-2 ${lowStockCount > 0 ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-zinc-500'}`}
                    >
                        <Filter size={16}/> 
                        Ver Bajo Stock ({lowStockCount})
                    </Button>
                )}
            </div>
        </div>

        {selectedIds.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-4 animate-in slide-in-from-bottom-5">
                <span className="font-bold">{selectedIds.length} seleccionados</span>
                <div className="h-4 w-px bg-zinc-700" />
                <Link href={`/print/bulk?ids=${selectedIds.join(",")}`}>
                    <Button size="sm" className="bg-white text-zinc-900 hover:bg-zinc-200 gap-2 rounded-full">
                        <Printer size={16} /> Imprimir Etiquetas
                    </Button>
                </Link>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setSelectedIds([])}
                    className="text-zinc-400 hover:text-white"
                >
                    Cancelar
                </Button>
            </div>
        )}

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="w-[50px] text-center">
                        <Button variant="ghost" size="icon" onClick={toggleAll} className="h-6 w-6">
                            {selectedIds.length > 0 && selectedIds.length === filteredProducts.length 
                                ? <CheckSquare size={16} className="text-zinc-900" /> 
                                : <Square size={16} className="text-zinc-400" />
                            }
                        </Button>
                    </TableHead>

                    {/* NUEVA COLUMNA: CÓDIGO QR */}
                    <TableHead className="w-[140px]">Código QR</TableHead>

                    <TableHead className="w-[180px]">Ref. Proveedor</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center w-[120px]">Categoría</TableHead>
                    <TableHead className="text-right w-[100px]">Stock</TableHead>
                    <TableHead className="text-right w-[100px]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-zinc-500">
                        {filterMode === 'low' 
                            ? "¡Todo en orden! No hay productos con stock bajo en esta vista." 
                            : "Sin resultados."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts.map((product) => {
                      const isSelected = selectedIds.includes(product.id)
                      const isLowStock = product.stock <= product.minStock

                      return (
                        <TableRow key={product.id} className={`transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-zinc-50/50'}`}>
                            <TableCell className="text-center">
                                <div onClick={() => toggleSelect(product.id)} className="cursor-pointer flex justify-center">
                                    {isSelected 
                                        ? <CheckSquare size={16} className="text-blue-600" /> 
                                        : <Square size={16} className="text-zinc-300" />
                                    }
                                </div>
                            </TableCell>

                            {/* DATO DEL CÓDIGO */}
                            <TableCell className="font-mono text-xs text-zinc-500">
                                <div className="flex items-center gap-1.5">
                                    <QrCode size={12} className="text-zinc-300" />
                                    {product.code}
                                </div>
                            </TableCell>

                            <TableCell>
                              <ProviderKeyDisplay shortCode={product.shortCode} />
                            </TableCell>

                            <TableCell className="font-medium text-zinc-900">
                              {product.description}
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge variant={product.category === 'Herramienta' ? "default" : "secondary"}>
                                {product.category}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-right font-bold">
                              {isLowStock ? (
                                  <div className="flex items-center justify-end gap-1 text-red-600 animate-pulse">
                                      <AlertTriangle size={14} />
                                      <span>{product.stock}</span>
                                  </div>
                              ) : (
                                  <span className="text-green-600">{product.stock}</span>
                              )}
                            </TableCell>

                            <TableCell className="text-right flex justify-end gap-1">
                              <Link 
                                href={`/print/bulk?ids=${product.id}`} 
                                className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
                                title="Imprimir Etiqueta"
                              >
                                <Printer size={16} />
                              </Link>
                              <EditProductDialog product={product} />
                              <DeleteProductButton 
                                productId={product.id} 
                                description={product.description} 
                              />
                            </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
             </Table>
        </div>
    </div>
  )
}