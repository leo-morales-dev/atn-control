"use client"

import { useState } from "react"
import { Trash2, AlertTriangle, Loader2, Skull } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { wipeSystemData } from "@/app/actions/system"
import { useRouter } from "next/navigation"

export function SystemResetDialog() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleWipe = async () => {
    if (!password) {
        toast.error("Ingresa la contraseña para confirmar")
        return
    }

    setLoading(true)
    const result = await wipeSystemData(password)

    if (result.success) {
        toast.success("SISTEMA REINICIADO", { 
            description: "Todos los datos han sido eliminados correctamente." 
        })
        setOpen(false)
        router.push("/login")
    } else {
        toast.error("Error de Seguridad", { description: result.error })
        setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
            variant="ghost" 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 text-xs h-8 px-2"
        >
            <Trash2 size={14} /> Reiniciar Sistema
        </Button>
      </DialogTrigger>
      
      <DialogContent className="border-red-200 bg-red-50/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Skull size={20} /> ZONA DE PELIGRO: REINICIO TOTAL
          </DialogTitle>
          <DialogDescription className="text-red-800 font-medium mt-2">
            ¿Estás absolutamente seguro?
          </DialogDescription>
        </DialogHeader>

        <div className="bg-white p-4 rounded-lg border border-red-100 space-y-4 shadow-sm">
            <div className="flex gap-3 text-sm text-zinc-600">
                <AlertTriangle className="shrink-0 text-red-500" size={20} />
                {/* CORRECCIÓN: Usamos <div> en lugar de <p> para contener la lista */}
                <div>
                    Esta acción <b>ELIMINARÁ PERMANENTEMENTE</b>:
                    <ul className="list-disc pl-5 mt-1 space-y-1 font-bold text-zinc-700">
                        <li>Todo el Inventario (Herramientas y Consumibles)</li>
                        <li>Todos los Empleados Registrados</li>
                        <li>Todo el Historial de Movimientos y Logs</li>
                        <li>Todos los Préstamos Activos</li>
                    </ul>
                </div>
            </div>

            <div className="space-y-2 pt-2">
                <Label className="text-xs font-bold uppercase text-zinc-500">
                    Contraseña de Administrador
                </Label>
                <Input 
                    type="password" 
                    placeholder="Ingresa tu contraseña para confirmar..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-red-200 focus:border-red-500 focus:ring-red-200"
                />
            </div>
        </div>

        <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
                Cancelar
            </Button>
            <Button 
                onClick={handleWipe} 
                disabled={loading || !password}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
                {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Trash2 className="mr-2 h-4 w-4"/>}
                ELIMINAR TODO
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}