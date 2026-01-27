"use client"

import { useState, useRef } from "react"
import { UserPlus, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createEmployee } from "@/app/actions/employees"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function EmployeeRegistrationForm() {
  const [loading, setLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await createEmployee(formData)
    setLoading(false)
    
    if (result.success) {
      toast.success("Empleado registrado correctamente")
      formRef.current?.reset() 
    } else {
      toast.error("Error: " + result.error)
    }
  }

  return (
    <Card className="border-zinc-200 shadow-sm h-fit sticky top-6">
      <CardHeader className="bg-zinc-50/50 border-b border-zinc-100 pb-3">
        <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-800">
            <UserPlus size={16} className="text-blue-600"/> Nuevo Ingreso
        </CardTitle>
        <CardDescription className="text-xs">
            Registra un nuevo colaborador. El ID se generará automáticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <form ref={formRef} action={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-zinc-500 uppercase">Nombre Completo</Label>
            <Input 
                name="name" 
                required 
                placeholder="Ej. Juan Pérez" 
                className="bg-zinc-50/50 focus:bg-white transition-colors"
            />
          </div>
          
          {/* CAMPO DE NÓMINA ELIMINADO */}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-zinc-900 text-white hover:bg-zinc-800 mt-2"
          >
            {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <><Save size={16} className="mr-2"/> Guardar Registro</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}