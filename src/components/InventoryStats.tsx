"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Package, Hammer, PaintBucket, AlertTriangle } from "lucide-react"

interface Stats {
  total: number
  tools: number
  consumables: number
  lowStock: number
}

export function InventoryStats({ stats }: { stats: Stats }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentFilter = searchParams.get("filter") || "all"

  const handleFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams)
    if (filter === "all") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    router.replace(`?${params.toString()}`)
  }

  // Definimos solo los datos, los colores ahora son lógicos
  const cards = [
    {
      label: "Total Activos",
      value: stats.total,
      icon: Package,
      filter: "all"
    },
    {
      label: "Herramientas",
      value: stats.tools,
      icon: Hammer,
      filter: "Herramienta"
    },
    {
      label: "Consumibles",
      value: stats.consumables,
      icon: PaintBucket,
      filter: "Consumible"
    },
    {
      label: "Stock Bajo",
      value: stats.lowStock,
      icon: AlertTriangle,
      filter: "low_stock"
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => {
        const isActive = currentFilter === card.filter

        return (
          <Card 
            key={card.label}
            onClick={() => handleFilter(card.filter)}
            // LÓGICA DE COLOR: 
            // - Si está activo: Rojo (#de2d2d) + Texto Blanco
            // - Si NO está activo: Blanco + Texto Gris (Hover gris suave)
            className={`cursor-pointer transition-all duration-200 border-none shadow-sm ${
                isActive 
                    ? "bg-[#de2d2d] text-white shadow-md scale-[1.02]" 
                    : "bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${isActive ? "text-white/80" : "text-zinc-500"}`}>
                    {card.label}
                </p>
                <p className={`text-2xl font-bold ${isActive ? "text-white" : "text-[#232323]"}`}>
                    {card.value}
                </p>
              </div>
              
              {/* ÍCONO: Cambia el fondo según el estado */}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                  isActive 
                    ? "bg-white/20 text-white" 
                    : "bg-zinc-100 text-zinc-500 group-hover:bg-zinc-200"
              }`}>
                <card.icon size={20} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}