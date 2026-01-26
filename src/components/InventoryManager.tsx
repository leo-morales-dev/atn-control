"use client"

import { useState } from "react"
import Link from "next/link"
import { Product } from "@prisma/client"
import { Printer, AlertTriangle, CheckSquare, Square, Filter, XCircle } from "lucide-react" // <--- Importar Filter y XCircle
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditProductDialog } from "@/components/EditProductDialog"
import { ProviderKeyDisplay } from "@/components/ProviderKeyDisplay"
import { DeleteProductButton } from "@/components/DeleteProductButton"
import { LowStockAlert } from "@/components/LowStockAlert" // <--- IMPORTAR LA ALERTA

interface Props {
  products: Product[]
}

export function InventoryManager({ products }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'low'>('all') // <--- NUEVO ESTADO DE FILTRO

  // Lógica de filtrado
  const filteredProducts = products.filter(product => {
      if (filterMode === 'low') {
          return product.stock <= product.minStock
      }
      return true // 'all'
  })

  // Calcular conteo para mostrar en el botón
  const lowStockCount = products.filter(p => p.stock <= p.minStock).length

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const toggleAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]) 
    } else {
      setSelectedIds(filteredProducts.map(p => p.id)) 
    }
  }

  return (
    <div>
        {/* --- INYECTAMOS LA ALERTA AQUÍ --- */}
        <LowStockAlert 
            products={products} 
            onReview={() => setFilterMode('low')} 
        />

        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                Inventario General
                {filterMode === 'low' && (
                    <Badge variant="destructive" className="ml-2">Filtro: Stock Bajo</Badge>
                )}
            </h2>
            
            {/* BOTÓN DE FILTRO MANUAL */}
            <div className="flex gap-2">
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

        {/* BARRA FLOTANTE DE ACCIONES (Igual que antes) */}
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

        {/* TABLA CON CHECKBOXES */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    {/* COLUMNA 0: CHECKBOX */}
                    <TableHead className="w-[50px] text-center">
                        <Button variant="ghost" size="icon" onClick={toggleAll} className="h-6 w-6">
                            {selectedIds.length > 0 && selectedIds.length === filteredProducts.length 
                                ? <CheckSquare size={16} className="text-zinc-900" /> 
                                : <Square size={16} className="text-zinc-400" />
                            }
                        </Button>
                    </TableHead>

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
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        {filterMode === 'low' 
                            ? "¡Todo en orden! No hay productos con stock bajo." 
                            : "Sin resultados."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    // USAMOS filteredProducts EN LUGAR DE products
                    filteredProducts.map((product) => {
                      const isSelected = selectedIds.includes(product.id)
                      const isLowStock = product.stock <= product.minStock

                      return (
                        <TableRow key={product.id} className={`transition-colors ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-zinc-50/50'}`}>
                            
                            {/* 0. CHECKBOX ROW */}
                            <TableCell className="text-center">
                                <div onClick={() => toggleSelect(product.id)} className="cursor-pointer flex justify-center">
                                    {isSelected 
                                        ? <CheckSquare size={16} className="text-blue-600" /> 
                                        : <Square size={16} className="text-zinc-300" />
                                    }
                                </div>
                            </TableCell>

                            {/* 1. REF PROVEEDOR */}
                            <TableCell>
                              <ProviderKeyDisplay shortCode={product.shortCode} />
                            </TableCell>

                            {/* 2. DESCRIPCIÓN */}
                            <TableCell className="font-medium text-zinc-900">
                              {product.description}
                            </TableCell>

                            {/* 3. CATEGORÍA */}
                            <TableCell className="text-center">
                              <Badge variant={product.category === 'Herramienta' ? "default" : "secondary"}>
                                {product.category}
                              </Badge>
                            </TableCell>

                            {/* 4. STOCK */}
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

                            {/* 5. ACCIONES */}
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