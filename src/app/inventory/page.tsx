import { getProducts, getInventoryStats } from "@/app/actions/product"
import { InventoryForm } from "@/components/InventoryForm" 
import { InventoryStats } from "@/components/InventoryStats"
import { InventoryManager } from "@/components/InventoryManager"
import { InventorySearch } from "@/components/InventorySearch" // <--- CAMBIO IMPORTANTE
import { BulkDeleteButton } from "@/components/BulkDeleteButton"

export const dynamic = 'force-dynamic'

export default async function InventoryPage({
  searchParams,
}: {
  // Ahora esperamos 'q' porque InventorySearch usa 'q' en la URL
  searchParams?: Promise<{ q?: string, filter?: string }>
}) {
  const params = await searchParams
  const query = params?.q || "" // Leemos el parámetro 'q'
  const filter = params?.filter || "all"

  // Carga de datos en paralelo
  const [productsData, statsData, globalLowStockData] = await Promise.all([
    getProducts(query, filter),
    getInventoryStats(),
    getProducts("", "low_stock")
  ])

  const products = productsData.data || []
  const stats = statsData.data ?? { total: 0, tools: 0, consumables: 0, lowStock: 0 }
  const globalLowStock = globalLowStockData.data || []

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ENCABEZADO */}
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventario</h1>
            <p className="text-zinc-500 mt-1 text-sm">Control total de existencias y reabastecimiento.</p>
        </div>

        {/* 1. ESTADÍSTICAS */}
        <InventoryStats stats={stats} />

        {/* 2. FORMULARIO DE NUEVO INGRESO (Ya incluye ExcelImport dentro) */}
        <InventoryForm productsList={products} />
          
        {/* 3. BARRA DE HERRAMIENTAS INFERIOR */}
        <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-white p-4 rounded-xl border border-zinc-200 shadow-sm">
            <div className="w-full xl:w-96">
                {/* Usamos el buscador inteligente que corrige el escáner */}
                <InventorySearch />
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
                <BulkDeleteButton />
            </div>
        </div>
          
        {/* 4. TABLA GENERAL */}
        <InventoryManager 
            products={products} 
            initialLowStock={globalLowStock}
        />
      </div>
    </main>
  )
}