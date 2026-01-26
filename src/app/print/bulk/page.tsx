import prisma from "@/lib/prisma"
import { BulkPrintManager } from "@/components/BulkPrintManager" // <--- NUEVO
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function BulkPrintPage({
  searchParams,
}: {
  searchParams?: Promise<{ ids?: string }>
}) {
  const params = await searchParams
  const idsString = params?.ids || ""
  
  const ids = idsString.split(",").map(id => parseInt(id)).filter(id => !isNaN(id))

  if (ids.length === 0) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
            <p className="text-zinc-500">No hay productos seleccionados.</p>
            <Link href="/inventory"><Button>Volver al Inventario</Button></Link>
        </div>
    )
  }

  const products = await prisma.product.findMany({
    where: { id: { in: ids } }
  })

  return (
    <div className="min-h-screen bg-gray-50 p-8 print:p-0 print:bg-white">
      
      {/* Cabecera Simple */}
      <div className="max-w-6xl mx-auto mb-6 flex items-center gap-4 print:hidden">
        <Link href="/inventory">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white"><ArrowLeft /></Button>
        </Link>
        <div>
            <h1 className="text-xl font-bold text-zinc-900">Vista Previa de Impresión</h1>
            <p className="text-sm text-zinc-500">
                {products.length} productos seleccionados. Ajusta las medidas según tu papel.
            </p>
        </div>
      </div>

      {/* EL GESTOR INTERACTIVO */}
      <div className="max-w-6xl mx-auto">
         <BulkPrintManager products={products} />
      </div>
    </div>
  )
}