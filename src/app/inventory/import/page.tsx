import { getProducts } from "@/app/actions/product"
import { ImportWorkspace } from "@/components/ImportWorkspace"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ImportPage() {
  // Traemos los productos para el buscador de vinculación
  const { data: products } = await getProducts()

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header simple con botón de volver */}
        <div className="flex items-center gap-4">
            <Link href="/inventory">
                <Button variant="ghost" size="icon" className="rounded-full">
                    <ArrowLeft size={20} />
                </Button>
            </Link>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Importación Masiva</h1>
                <p className="text-zinc-500">Procesa facturas y actualiza tu inventario en segundos.</p>
            </div>
        </div>

        {/* El componente principal */}
        <ImportWorkspace existingProducts={products || []} />

      </div>
    </main>
  )
}