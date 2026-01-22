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
    // Si damos clic al mismo que ya está, o a "Total", quitamos el filtro
    if (filter === "all") {
      params.delete("filter")
    } else {
      params.set("filter", filter)
    }
    router.replace(`?${params.toString()}`)
  }

  const cards = [
    {
      label: "Total Activos",
      value: stats.total,
      icon: Package,
      filter: "all",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-200"
    },
    {
      label: "Herramientas",
      value: stats.tools,
      icon: Hammer,
      filter: "Herramienta",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200"
    },
    {
      label: "Consumibles",
      value: stats.consumables,
      icon: PaintBucket,
      filter: "Consumible",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200"
    },
    {
      label: "Stock Bajo",
      value: stats.lowStock,
      icon: AlertTriangle,
      filter: "low_stock",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200"
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
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? `ring-2 ring-zinc-900 ring-offset-2 ${card.border}` : "border-zinc-200"
            }`}
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500">{card.label}</p>
                <p className="text-2xl font-bold text-zinc-900">{card.value}</p>
              </div>
              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}