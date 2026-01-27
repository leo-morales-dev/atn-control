"use client"

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'
import { Input } from "@/components/ui/input"
import { Search as SearchIcon } from "lucide-react"

export function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    
    // CORRECCIÓN AQUÍ: Agregamos { scroll: false }
    // Esto evita que la página salte hacia arriba al buscar
    replace(`${pathname}?${params.toString()}`, { scroll: false })
    
  }, 300)

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Buscar
      </label>
      <Input
        className="pl-10 bg-white"
        placeholder={placeholder}
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
      />
      <SearchIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  )
}