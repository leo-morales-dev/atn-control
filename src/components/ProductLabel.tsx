"use client"

import { QRCodeSVG } from "qrcode.react"
import { cn } from "@/lib/utils"

interface Product {
  code: string
  description: string
  shortCode: string | null
  category: string
}

interface Props {
  product: Product
  width?: number  // AHORA ES EN CM
  height?: number // AHORA ES EN CM
  className?: string
}

// Valores por defecto ahora en CM (6 x 4)
export function ProductLabel({ product, width = 6, height = 4, className }: Props) {
  
  // Cálculo de escala para el QR
  // 1cm son aprox 37.8 pixeles en pantalla/impresión a 96dpi
  // Usamos un factor de 35 para asegurar margen
  const qrBaseSize = Math.min(width, height)
  const qrPixelSize = qrBaseSize * 30 // Factor ajustado para cm

  return (
    <div 
      className={cn("border border-black bg-white flex flex-row overflow-hidden break-inside-avoid page-break-inside-avoid mx-auto transition-all duration-300", className)}
      style={{ 
        width: `${width}cm`,   // UNIDAD CM
        height: `${height}cm`  // UNIDAD CM
      }}
    >
      
      {/* LADO IZQUIERDO: QR */}
      <div 
        className="flex items-center justify-center p-1 border-r border-black/10 shrink-0"
        style={{ width: `${width * 0.38}cm` }} 
      >
        <QRCodeSVG 
          value={product.code} 
          size={qrPixelSize} 
          level="M"
        />
      </div>

      {/* LADO DERECHO: DATOS */}
      <div className="flex-1 p-[4%] flex flex-col justify-between overflow-hidden">
        
        {/* Encabezado: Ref Prov */}
        <div>
           <p className="text-[0.6rem] uppercase text-gray-500 font-bold leading-none mb-[2%]">
             Ref. Prov:
           </p>
           {/* Ajustamos tamaño de fuente relativo a cm */}
           <p className="font-bold font-mono leading-tight break-all line-clamp-2" style={{ fontSize: `${Math.min(height * 2.5, 12)}px` }}>
             {product.shortCode || "S/R"}
           </p>
        </div>

        {/* Descripción */}
        <div className="flex-1 flex items-center my-1">
            <p className="leading-tight line-clamp-3 font-medium" style={{ fontSize: `${Math.min(height * 2, 10)}px` }}>
                {product.description}
            </p>
        </div>

        {/* Pie */}
        <div className="border-t border-black/10 pt-1 flex justify-between items-end">
            <span className="text-[0.5rem] uppercase font-bold bg-black text-white px-1 rounded-sm">
                {product.category.substring(0, 4)}
            </span>
            <span className="text-[0.5rem] font-mono text-gray-400">
                {product.code}
            </span>
        </div>
      </div>
    </div>
  )
}