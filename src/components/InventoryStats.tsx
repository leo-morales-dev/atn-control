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

  // DEFINICIÓN DE COLORES EXACTOS SEGÚN TU DISEÑO
  const cards = [
    {
      label: "Total Activos",
      value: stats.total,
      icon: Package,
      filter: "all",
      // Color: #212130
      bgColor: "bg-[#212130]",
      hoverColor: "hover:bg-[#212130]/90",
      textColor: "text-white"
    },
    {
      label: "Herramientas",
      value: stats.tools,
      icon: Hammer,
      filter: "Herramienta",
      // Color: #2a2a3d
      bgColor: "bg-[#2a2a3d]",
      hoverColor: "hover:bg-[#2a2a3d]/90",
      textColor: "text-white"
    },
    {
      label: "Consumibles",
      value: stats.consumables,
      icon: PaintBucket,
      filter: "Consumible",
      // Color: #56567d
      bgColor: "bg-[#56567d]",
      hoverColor: "hover:bg-[#56567d]/90",
      textColor: "text-white"
    },
    {
      label: "Stock Bajo",
      value: stats.lowStock,
      icon: AlertTriangle,
      filter: "low_stock",
      // Color: #8282bd
      bgColor: "bg-[#8282bd]",
      hoverColor: "hover:bg-[#8282bd]/90",
      textColor: "text-white"
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
            className={`cursor-pointer transition-all border-none shadow-md ${card.bgColor} ${card.hoverColor} ${
                isActive ? "ring-2 ring-offset-2 ring-zinc-400" : ""
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium opacity-80 ${card.textColor}`}>{card.label}</p>
                <p className={`text-2xl font-bold ${card.textColor}`}>{card.value}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
                <card.icon size={20} className={card.textColor} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}