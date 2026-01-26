import { getProducts, getInventoryStats } from "@/app/actions/product"
import { InventoryForm } from "@/components/InventoryForm"
import { InventoryStats } from "@/components/InventoryStats"
import { InventoryManager } from "@/components/InventoryManager"
import { Search } from "@/components/Search"
import { BulkDeleteButton } from "@/components/BulkDeleteButton"

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string, filter?: string }>
}) {
  const params = await searchParams
  const query = params?.query || ""
  const filter = params?.filter || "all"

  // Ejecutamos 3 consultas en paralelo:
  // 1. Productos de la tabla (con filtros del usuario)
  // 2. Estadísticas para las tarjetas de arriba
  // 3. Alerta Global de Stock Bajo (para que avise siempre, sin importar el filtro)
  const [productsData, statsData, globalLowStockData] = await Promise.all([
    getProducts(query, filter),
    getInventoryStats(),
    getProducts("", "low_stock") // <--- Esto alimenta la alerta global
  ])

  const products = productsData.data || []
  
  // CORRECCIÓN DEL ERROR AQUÍ:
  // Usamos '??' para garantizar que si data viene undefined, use el objeto por defecto.
  // Esto calma a TypeScript.
  const stats = statsData.data ?? { total: 0, tools: 0, consumables: 0, lowStock: 0 }
  
  const globalLowStock = globalLowStockData.data || []

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventario</h1>
            <p className="text-zinc-500 mt-1">Alta y gestión de activos del almacén.</p>
        </div>

        {/* 1. ESTADÍSTICAS (Ya no dará error) */}
        <InventoryStats stats={stats} />

        {/* 2. FORMULARIO */}
        <InventoryForm productsList={products} />

        {/* BUSCADOR Y BORRADO MASIVO */}
        <div className="flex flex-col md:flex-row justify-end items-center gap-3 mb-4">
              <BulkDeleteButton />
              <div className="w-full md:w-72">
                <Search placeholder="Buscar herramienta o código..." />
            </div>
        </div>
          
        {/* 3. TABLA Y GESTOR (Con alerta global restaurada) */}
        <InventoryManager 
            products={products} 
            initialLowStock={globalLowStock} // <--- Pasamos la lista de vigilancia
        />
      </div>
    </main>
  )
}