import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"

export default async function ProductLabelPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const productId = parseInt(resolvedParams.id)

  if (isNaN(productId)) return notFound()

  const product = await prisma.product.findUnique({
    where: { id: productId }
  })

  if (!product) return notFound()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 print:bg-white print:p-0 print:block">
      
      {/* DISEÑO DE ETIQUETA (Tamaño aprox 6cm x 4cm)
        Perfecto para impresoras térmicas o recortar
      */}
      <div className="w-[240px] h-[160px] bg-white border-2 border-black flex flex-row overflow-hidden print:border-2 print:m-0">
        
        {/* Lado Izquierdo: QR */}
        <div className="w-[100px] flex items-center justify-center border-r-2 border-black bg-white p-1">
             <QRCodeDisplay text={product.code} />
        </div>

        {/* Lado Derecho: Info */}
        <div className="flex-1 flex flex-col justify-between p-2">
            <div>
                <p className="text-[10px] font-bold uppercase text-zinc-500 leading-none mb-1">
                    PROPIEDAD DE LA EMPRESA
                </p>
                <h2 className="text-sm font-extrabold leading-tight text-black line-clamp-3">
                    {product.description}
                </h2>
            </div>

            <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-500 uppercase">CÓDIGO</p>
                <p className="font-mono text-sm font-black text-black">{product.code}</p>
            </div>
        </div>
      </div>

      <div className="mt-8 text-zinc-400 text-sm print:hidden text-center max-w-md">
        <p>Vista previa de etiqueta (6x4 cm aprox).</p>
        <p>Usa <strong>Ctrl + P</strong> y selecciona "Ninguno" en márgenes para imprimir en etiquetas adhesivas.</p>
      </div>
    </div>
  )
}