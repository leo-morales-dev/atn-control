"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Calendar, Filter, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function HistoryFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Estados iniciales basados en URL
  const [search, setSearch] = useState(searchParams.get("q") || "")
  const [category, setCategory] = useState(searchParams.get("cat") || "ALL")
  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "")
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "")

  // Efecto tipo "Debounce" para la búsqueda (espera a que termines de escribir)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters()
    }, 500)
    return () => clearTimeout(timer)
  }, [search, category, dateFrom, dateTo])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (search) params.set("q", search)
    if (category && category !== "ALL") params.set("cat", category)
    if (dateFrom) params.set("from", dateFrom)
    if (dateTo) params.set("to", dateTo)
    
    router.replace(`/history?${params.toString()}`)
  }

  return (
    <div className="space-y-4 mb-6">
        
        {/* FILA 1: BOTONES DE CATEGORÍA */}
        <div className="flex flex-wrap gap-2">
            {[
                { id: "ALL", label: "Todo el Historial" },
                { id: "PRESTAMOS", label: "Préstamos y Devoluciones" },
                { id: "INVENTARIO", label: "Entradas (XML/Excel)" },
                { id: "BAJAS", label: "Bajas y Daños" },
                { id: "EMPLEADOS", label: "Empleados" },
            ].map((btn) => (
                <Button 
                    key={btn.id}
                    variant={category === btn.id ? "default" : "outline"}
                    onClick={() => setCategory(btn.id)}
                    className={`h-8 text-xs rounded-full ${
                        category === btn.id ? "bg-[#232323] text-white" : "text-zinc-500 border-zinc-200"
                    }`}
                >
                    {btn.label}
                </Button>
            ))}
        </div>

        {/* FILA 2: BÚSQUEDA Y FECHAS */}
        <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-xl border border-zinc-200 shadow-sm">
            
            {/* BUSCADOR */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <Input 
                    placeholder="Buscar por código, nombre, descripción..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 border-zinc-200 bg-zinc-50/50 focus:bg-white transition-all"
                />
            </div>

            {/* SELECTOR DE FECHAS */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase">De:</span>
                    <Input 
                        type="date" 
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="pl-9 h-10 w-[140px] text-xs border-zinc-200" 
                    />
                </div>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[10px] font-bold uppercase">A:</span>
                    <Input 
                        type="date" 
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="pl-9 h-10 w-[140px] text-xs border-zinc-200" 
                    />
                </div>
            </div>
        </div>
    </div>
  )
}