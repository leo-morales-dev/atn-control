"use client"

import { useState, useRef } from "react"
import { UserPlus, Loader2, Save, User, AlertCircle, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createEmployee } from "@/app/actions/employees"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function EmployeeInlineForm() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.delete("employeeNumber") 
    
    const result = await createEmployee(formData)
    setLoading(false)

    if (result.success) {
      toast.success("Empleado registrado correctamente", {
          description: "Se ha generado un ID único automáticamente."
      })
      formRef.current?.reset()
      router.refresh()
    } else {
      toast.error("No se pudo registrar", { 
          description: result.error,
          icon: <AlertCircle className="text-red-500" />
      })
    }
  }

  return (
    <Card className="border-zinc-200 shadow-sm bg-white overflow-hidden sticky top-6">
      {/* CAMBIOS DE ESPACIADO EN HEADER: py-2 en lugar de py-3 */}
      <CardHeader className="py-2 px-3 border-b border-zinc-100 bg-zinc-50/50">
          <div className="flex items-center gap-2">
             <div className="h-7 w-7 rounded-lg bg-[#232323] flex items-center justify-center text-white shadow-sm">
                <UserPlus size={14} />
             </div>
             <div>
                <CardTitle className="text-xs font-bold text-[#232323]">Nuevo Colaborador</CardTitle>
                <p className="text-[10px] text-zinc-500 leading-none">Alta rápida</p>
             </div>
          </div>
      </CardHeader>
      
      {/* CAMBIOS DE ESPACIADO EN CONTENT: p-3 en lugar de p-4 */}
      <CardContent className="p-3">
        {/* REDUCCIÓN DE GAP: gap-3 en lugar de gap-4 */}
        <form ref={formRef} action={handleSubmit} className="flex flex-col gap-3">
          
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                <User size={12} /> Nombre Completo
            </Label>
            <Input 
                id="name" 
                name="name" 
                placeholder="Ej: Juan Pérez" 
                required 
                className="bg-zinc-50 border-zinc-200 focus:bg-white transition-all h-8 text-xs" 
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-md p-2 flex gap-2 items-start">
            <Wand2 className="text-blue-500 shrink-0 mt-0.5" size={12} />
            <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-blue-700 uppercase">Auto-Generación de ID</p>
                <p className="text-[9px] text-blue-600 leading-tight">
                    El sistema asignará el QR automáticamente.
                </p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-[#232323] hover:bg-[#232323]/90 text-white font-bold h-8 text-xs uppercase">
                {loading ? <Loader2 className="animate-spin mr-2 h-3 w-3"/> : <Save className="mr-2 h-3 w-3" />}
                {loading ? "Registrando..." : "Guardar Empleado"}
          </Button>

        </form>
      </CardContent>
    </Card>
  )
}