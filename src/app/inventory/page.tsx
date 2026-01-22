import { getProducts, getInventoryStats } from "@/app/actions/product" // <--- Nueva función importada
import { InventoryForm } from "@/components/InventoryForm"
import { InventoryStats } from "@/components/InventoryStats" // <--- Componente nuevo
import { Product } from "@prisma/client"
import { EditProductDialog } from "@/components/EditProductDialog"
import { Search } from "@/components/Search"
import { Printer, AlertTriangle } from "lucide-react" 
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string, filter?: string }>
}) {
  const params = await searchParams
  const query = params?.query || ""
  const filter = params?.filter || "all"

  // Ejecutamos las dos consultas en paralelo para que sea súper rápido
  const [productsData, statsData] = await Promise.all([
    getProducts(query, filter),
    getInventoryStats()
  ])

  const products = productsData.data
  const stats = statsData.data || { total: 0, tools: 0, consumables: 0, lowStock: 0 }

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventario</h1>
            <p className="text-zinc-500 mt-1">Alta y gestión de activos del almacén.</p>
        </div>

        {/* 1. LAS CARDS DE FILTRADO */}
        <InventoryStats stats={stats} />

        {/* 2. EL FORMULARIO DE REGISTRO */}
        <InventoryForm />

        {/* Buscador */}
        <div className="flex justify-end mb-4">
            <div className="w-full md:w-72">
                <Search placeholder="Buscar herramienta o código..." />
            </div>
        </div>

        {/* Tabla */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
             <Table>
                <TableHeader className="bg-zinc-50">
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Ubicación</TableHead>
                    <TableHead className="text-center">Categoría</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!products || products.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-zinc-500">
                        {query || filter !== 'all' 
                            ? "No hay resultados con estos filtros." 
                            : "Inventario vacío."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    products.map((product: Product) => (
                      <TableRow key={product.id} className="hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="font-mono text-xs font-medium text-zinc-600">
                          {product.code}
                        </TableCell>
                        <TableCell className="font-medium text-zinc-900">
                          {product.description}
                        </TableCell>
                        <TableCell className="text-zinc-500 text-sm">
                          {product.shortCode || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={product.category === 'Herramienta' ? "default" : "secondary"}>
                            {product.category}
                          </Badge>
                        </TableCell>
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
                        <TableCell className="text-right flex justify-end gap-1">
                          <Link 
                            href={`/print/product/${product.id}`} 
                            target="_blank"
                            className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
                            title="Imprimir"
                          >
                            <Printer size={16} />
                          </Link>
                          <EditProductDialog product={product} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
             </Table>
        </div>

      </div>
    </main>
  )
}