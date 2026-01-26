"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Clock, ArrowRight } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
  const [snoozeHours, setSnoozeHours] = useState(24) // Por defecto 24 horas

  useEffect(() => {
    // 1. Calcular stock bajo
    const count = products.filter(p => p.stock <= p.minStock).length
    setLowStockCount(count)

    // 2. Verificar estado de la alerta
    checkAlertStatus(count)
    
    // Escuchar cambios en el almacenamiento (para sincronizar pestañas)
    window.addEventListener('storage', () => checkAlertStatus(count))
    return () => window.removeEventListener('storage', () => checkAlertStatus(count))
  }, [products])

  const checkAlertStatus = (count: number) => {
      const snoozeUntil = localStorage.getItem("inventory_alert_snooze")
      const now = new Date().getTime()

      // MOSTRAR SI: Hay stock bajo Y (no hay snooze O el snooze ya venció)
      if (count > 0 && (!snoozeUntil || now > parseInt(snoozeUntil))) {
           const timer = setTimeout(() => setOpen(true), 1000)
           return () => clearTimeout(timer)
      } else {
          setOpen(false)
      }
  }

  const handleSnooze = () => {
    // Usamos el valor del input (snoozeHours)
    const hours = snoozeHours || 1
    const snoozeTime = new Date().getTime() + (hours * 60 * 60 * 1000)
    
    localStorage.setItem("inventory_alert_snooze", snoozeTime.toString())
    setOpen(false)
    
    // Avisamos al padre (InventoryManager) para que actualice la campanita
    if (onSnoozeChange) onSnoozeChange()
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <AlertTriangle size={20} />
            </div>
            <AlertDialogTitle className="text-xl">Atención: Stock Bajo</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base text-zinc-600">
            Se han detectado <span className="font-bold text-red-600">{lowStockCount} productos</span> por debajo del nivel mínimo.
          </AlertDialogDescription>

          {/* --- AQUÍ ESTÁ LA NUEVA SECCIÓN DE CONFIGURACIÓN --- */}
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
                La alerta se ocultará por este tiempo. Si te equivocas, usa la campana 🔔 para reactivarla.
             </p>
          </div>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-2">
            <div className="flex-1 flex justify-start">
                 {/* El botón ahora dice "Posponer" y usa el valor del input de arriba */}
                 <Button 
                    variant="ghost" 
                    className="text-zinc-500 hover:text-zinc-900"
                    onClick={handleSnooze}
                 >
                    Posponer
                 </Button>
            </div>
            
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault()
                    onReview()
                    setOpen(false)
                }}
                className="bg-red-600 hover:bg-red-700 gap-2"
            >
                Revisar Ahora <ArrowRight size={16}/>
            </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}