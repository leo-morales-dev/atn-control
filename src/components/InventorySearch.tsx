"use client"

import { Search, Loader2 } from "lucide-react" // Agregué un icono de carga opcional
import { Input } from "@/components/ui/input"
import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { useState, useEffect, useRef } from "react"

export function InventorySearch() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  
  // Estado local para lo que el usuario ve mientras escribe
  const [inputValue, setInputValue] = useState(searchParams.get('q')?.toString() || "")
  const [isSearching, setIsSearching] = useState(false)
  
  // Referencia para guardar el temporizador
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Sincronizar el input si la URL cambia externamente
  useEffect(() => {
    setInputValue(searchParams.get('q')?.toString() || "")
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Actualización inmediata visual (para que el usuario vea lo que escribe)
    const rawValue = e.target.value
    // Corrección al vuelo del scanner (opcional, pero recomendada según tu lógica anterior)
    const cleanValue = rawValue.toUpperCase().replace(/'/g, '-')
    
    setInputValue(cleanValue)
    setIsSearching(true)

    // 2. Limpiar el temporizador anterior si existe (el usuario sigue escribiendo)
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 3. Crear nuevo temporizador (DEBOUNCE de 500ms)
    timeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams)
      
      if (cleanValue) {
        params.set('q', cleanValue)
      } else {
        params.delete('q')
      }
      
      // Resetear paginación si aplica, pero MANTENIENDO el scroll
      // Nota: scroll: false es clave para evitar saltos
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
      setIsSearching(false)
      
    }, 500) // Espera 500ms después de la última tecla
  }

  return (
    <div className="relative w-full md:max-w-sm mb-6">
      {isSearching ? (
        <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 animate-spin" />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
      )}
      
      <Input
        className="pl-9 bg-white border-zinc-200 focus-visible:ring-zinc-900"
        placeholder="Buscar por código, nombre o descripción..."
        value={inputValue} // Controlado por estado local
        onChange={handleInputChange}
      />
    </div>
  )
}