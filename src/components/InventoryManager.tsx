"use client"

import { useState } from "react"
import Link from "next/link"
import { Product } from "@prisma/client"
import { Printer, AlertTriangle, CheckSquare, Square } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditProductDialog } from "@/components/EditProductDialog"
import { ProviderKeyDisplay } from "@/components/ProviderKeyDisplay"
import { DeleteProductButton } from "@/components/DeleteProductButton"

interface Props {
  products: Product[]
}

export function InventoryManager({ products }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Función para seleccionar/deseleccionar uno
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  // Función para seleccionar TODO lo que se ve en pantalla
  const toggleAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]) // Desmarcar todo
    } else {
      setSelectedIds(products.map(p => p.id)) // Marcar todo
    }
  }

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-zinc-800">Inventario General</h2>
            {/* El botón se eliminó porque ya tenemos el formulario arriba */}
        </div>

        {/* BARRA FLOTANTE DE ACCIONES (Solo aparece si seleccionas algo) */}
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
                            {selectedIds.length > 0 && selectedIds.length === products.length 
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
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        Sin resultados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product) => {
                      const isSelected = selectedIds.includes(product.id)
                      
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
                              {product.stock <= product.minStock ? (
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