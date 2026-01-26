"use client"

import { useEffect, useState, useRef } from "react" // <--- IMPORTANTE: useRef
import { AlertTriangle, Clock, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface Product {
  id: number
  stock: number
  minStock: number
}

interface Props {
  products: Product[]
  onReview: () => void
  onSnoozeChange?: () => void
}

export function LowStockAlert({ products, onReview, onSnoozeChange }: Props) {
  const [open, setOpen] = useState(false)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [snoozeHours, setSnoozeHours] = useState(24)

  // NUEVO: Usamos useRef para recordar si ya molestamos al usuario en esta sesión
  const hasAutoOpened = useRef(false)

  useEffect(() => {
    // 1. Calcular stock bajo
    const count = products.filter(p => p.stock <= p.minStock).length
    setLowStockCount(count)

    // 2. Verificar visibilidad
    checkVisibility(count)
    
    // Escuchar cambios en otras pestañas
    window.addEventListener('storage', () => checkVisibility(count))
    return () => window.removeEventListener('storage', () => checkVisibility(count))
  }, [products])

  const checkVisibility = (count: number) => {
      // SI YA SE MOSTRÓ EN ESTA VISITA, NO HACER NADA
      if (hasAutoOpened.current) return

      const snoozeUntil = localStorage.getItem("inventory_alert_snooze")
      const now = new Date().getTime()

      // Mostrar solo si hay problemas y no está pospuesto
      if (count > 0 && (!snoozeUntil || now > parseInt(snoozeUntil))) {
           const timer = setTimeout(() => {
               setOpen(true)
               hasAutoOpened.current = true // <--- MARCADO COMO MOSTRADO
           }, 500)
           return () => clearTimeout(timer)
      }
  }

  const handleSnooze = () => {
    const hours = snoozeHours || 1
    const snoozeTime = new Date().getTime() + (hours * 60 * 60 * 1000)
    
    localStorage.setItem("inventory_alert_snooze", snoozeTime.toString())
    setOpen(false)
    if (onSnoozeChange) onSnoozeChange()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={20} />
            </div>
            <DialogTitle className="text-xl">Atención: Stock Bajo</DialogTitle>
          </div>
          <DialogDescription className="text-base text-zinc-600">
            Se han detectado <span className="font-bold text-red-600">{lowStockCount} productos</span> por debajo del nivel mínimo.
          </DialogDescription>

          <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-100 mt-4 space-y-2">
             <Label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Clock size={12}/> Configurar Recordatorio
             </Label>
             <div className="flex items-center gap-2">
                <Input 
                    type="number" 
                    min="1" 
                    value={snoozeHours} 
                    onChange={(e) => setSnoozeHours(parseInt(e.target.value) || 1)}
                    className="w-20 h-8 text-center bg-white font-bold"
                />
                <span className="text-sm text-zinc-600">Horas</span>
             </div>
             <p className="text-[10px] text-zinc-400 leading-tight">
                La alerta se ocultará por este tiempo. Si cierras dando clic fuera, volverá a aparecer si recargas la página.
             </p>
          </div>
        </DialogHeader>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <div className="flex-1 flex justify-start">
                 <Button 
                    variant="ghost" 
                    className="text-zinc-500 hover:text-zinc-900"
                    onClick={handleSnooze}
                 >
                    Posponer
                 </Button>
            </div>
            
            <Button 
                onClick={(e) => {
                    e.preventDefault()
                    onReview()
                    setOpen(false)
                }}
                className="bg-red-600 hover:bg-red-700 gap-2"
            >
                Revisar Ahora <ArrowRight size={16}/>
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}