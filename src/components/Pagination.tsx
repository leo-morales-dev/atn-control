"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface Props {
  totalPages: number
  currentPage: number
}

export function Pagination({ totalPages, currentPage }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname() // Detecta la ruta actual automáticamente

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", page.toString())
    
    // Navega a la misma ruta donde estás, pero con nueva página
    router.push(`${pathname}?${params.toString()}`)
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 p-4 mt-4 border-t border-zinc-200">
        
        {/* BOTÓN ANTERIOR */}
        <Button 
            variant="outline" 
            size="icon"
            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 bg-white border-red-100 text-[#de2d2d] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
            <ChevronLeft size={16} />
        </Button>

        {/* NÚMEROS DE PÁGINA */}
        <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Mostrar siempre 1, última, y cercanas a la actual
                if (totalPages > 10 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                    if (Math.abs(page - currentPage) === 3) return <span key={page} className="text-zinc-400 text-xs">...</span>
                    return null
                }

                return (
                    <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className={`h-8 w-8 p-0 text-xs font-bold transition-all ${
                            currentPage === page 
                                ? "bg-[#de2d2d] text-white hover:bg-[#de2d2d]/90 shadow-md transform scale-105" 
                                : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                        }`}
                    >
                        {page}
                    </Button>
                )
            })}
        </div>

        {/* BOTÓN SIGUIENTE */}
        <Button 
            variant="outline" 
            size="icon"
            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 bg-white border-red-100 text-[#de2d2d] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
            <ChevronRight size={16} />
        </Button>
    </div>
  )
}