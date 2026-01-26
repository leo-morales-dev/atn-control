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
import { BulkDeleteButton } from "@/components/BulkDeleteButton"
import { ProviderKeyDisplay } from "@/components/ProviderKeyDisplay"
import { InventoryManager } from "@/components/InventoryManager"

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
        <InventoryForm productsList={products} />

        {/* Buscador */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-3 mb-4">
              <BulkDeleteButton />
              <div className="w-full md:w-72">
                <Search placeholder="Buscar herramienta o código..." />
            </div>
        </div>
          <InventoryManager products={products || []} />
      </div>
    </main>
  )
}