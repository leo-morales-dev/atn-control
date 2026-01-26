"use client"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Tag } from "lucide-react"

interface Props {
  shortCode: string | null
}

export function ProviderKeyDisplay({ shortCode }: Props) {
  if (!shortCode) return <span className="text-zinc-300 italic">S/R</span>

  const codes = shortCode.split(" / ")

  // CASO A: Pocos códigos (1 o 2) -> Mostrar texto plano
  if (codes.length <= 2) {
    return <span className="font-mono text-xs font-medium text-zinc-600">{shortCode}</span>
  }

  // CASO B: Muchos códigos -> Dropdown Interactivo
  const firstCode = codes[0]
  const remainingCount = codes.length - 1

  return (
    <div className="flex items-center gap-2">
      {/* El primero siempre visible */}
      <span className="font-mono text-xs font-medium text-zinc-600 truncate max-w-[90px]">
        {firstCode}
      </span>
      
      {/* Botón desplegable */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Badge 
            variant="outline" 
            className="h-5 px-1.5 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-400 cursor-pointer border-zinc-200 text-zinc-600 gap-1 transition-all"
            title="Clic para ver todas las claves"
          >
            +{remainingCount}
            <ChevronDown size={10} className="opacity-50" />
          </Badge>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-sm shadow-lg border-zinc-200">
          <DropdownMenuLabel className="text-[10px] uppercase text-zinc-400 font-bold flex items-center gap-2">
            <Tag size={10} />
            Referencias Asociadas
          </DropdownMenuLabel>
          
          <div className="max-h-[200px] overflow-y-auto">
            {codes.map((code, index) => (
                <DropdownMenuItem 
                    key={index} 
                    className="text-xs font-mono text-zinc-700 cursor-copy focus:bg-zinc-50"
                    onClick={() => navigator.clipboard.writeText(code)} // Truco extra: Copiar al clic
                    title="Clic para copiar"
                >
                    {code}
                </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}