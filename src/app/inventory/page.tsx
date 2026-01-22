import { getProducts } from "@/app/actions/product"
import { AddProductDialog } from "@/components/AddProductDialog"
import { Product } from "@prisma/client" // <--- ¡Importante!
import { EditProductDialog } from "@/components/EditProductDialog"
import { Printer } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export const dynamic = 'force-dynamic'

export default async function Home() {
  const { data: products } = await getProducts()

  return (
    <main className="min-h-screen bg-gray-50/50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Inventario</h1>
            <p className="text-zinc-500 mt-1">Gestiona el stock y los activos del almacén.</p>
          </div>
          <AddProductDialog />
        </div>

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
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                    No hay productos registrados aún. ¡Agrega el primero!
                  </TableCell>
                </TableRow>
              ) : (
                /* Aquí aplicamos el tipo explícito :Product */
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
                      <Badge variant={product.category === 'herramienta' ? "default" : "secondary"}>
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                       <span className={product.stock < 5 ? "text-red-600" : "text-green-600"}>
                        {product.stock}
                       </span>
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-1">
                      {/* Botón Imprimir (Ya lo tenías) */}
                      <Link 
                        href={`/print/product/${product.id}`} 
                        target="_blank"
                        className="p-2 hover:bg-zinc-100 rounded-md text-zinc-600 transition-colors"
                        title="Imprimir Etiqueta"
                      >
                        <Printer size={16} />
                      </Link>

                      {/* NUEVO: Botón Editar */}
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