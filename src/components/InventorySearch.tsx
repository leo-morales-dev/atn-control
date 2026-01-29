"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useDebouncedCallback } from "use-debounce" // Si no tienes esta librería, usaremos un timer manual abajo

export function InventorySearch() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  // Función para manejar la búsqueda con espera (Debounce)
  // Usamos un timer manual para no depender de librerías externas si no quieres
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams)
    
    // 1. CORRECCIÓN DEL ESCÁNER AQUÍ
    const cleanTerm = term.toUpperCase().replace(/'/g, '-')

    if (cleanTerm) {
      params.set('q', cleanTerm)
    } else {
      params.delete('q')
    }
    
    // Resetear a página 1 al buscar
    params.set('page', '1')
    
    replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative w-full md:max-w-sm mb-6">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      <Input
        className="pl-9 bg-white border-zinc-200 focus-visible:ring-zinc-900"
        placeholder="Buscar por código, nombre o descripción..."
        defaultValue={searchParams.get('q')?.toString()}
        onChange={(e) => {
            // Aplicamos la corrección visualmente también para el usuario
            const val = e.target.value.toUpperCase().replace(/'/g, '-')
            e.target.value = val 
            
            // Ejecutamos la búsqueda (puedes envolver esto en un debounce si prefieres)
            handleSearch(val)
        }}
      />
    </div>
  )
}