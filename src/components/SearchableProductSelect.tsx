"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Product {
  id: number
  description: string
  code: string
}

interface Props {
  products: Product[]
  value: string // ID del producto seleccionado
  onChange: (value: string) => void
  disabled?: boolean
}

export function SearchableProductSelect({ products, value, onChange, disabled }: Props) {
  const [open, setOpen] = React.useState(false)

  // Encontramos el producto seleccionado para mostrar su nombre en el botón cerrado
  const selectedProduct = products.find((product) => product.id.toString() === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white font-normal h-9 text-xs px-3 border-zinc-200"
          disabled={disabled}
        >
          {selectedProduct ? (
             <span className="truncate text-zinc-900 font-medium">{selectedProduct.description}</span>
          ) : (
             <span className="text-zinc-400">Buscar producto...</span>
          )}
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50 text-zinc-500" />
        </Button>
      </PopoverTrigger>
      
      {/* EL CONTENIDO DEL BUSCADOR */}
      <PopoverContent className="w-[300px] p-0 z-[99999]" align="start">
        <Command>
          <CommandInput placeholder="Escribe nombre o código..." className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="py-2 text-center text-xs text-zinc-500">
                No encontrado.
            </CommandEmpty>
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  // Este 'value' es lo que usa el buscador interno para filtrar.
                  // Concatenamos nombre y código para que encuentres por cualquiera de los dos.
                  value={`${product.description} ${product.code}`} 
                  onSelect={() => {
                    onChange(product.id.toString())
                    setOpen(false)
                  }}
                  className="text-xs cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === product.id.toString() ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                      <span className="font-medium text-zinc-700">{product.description}</span>
                      <span className="text-[10px] text-zinc-400 font-mono">{product.code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}