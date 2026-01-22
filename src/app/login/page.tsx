"use client"

import { useState } from "react"
import { login } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Lock } from "lucide-react"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")
        
        const result = await login(formData)
        
        if (result.success) {
        // ANTES: router.push("/dashboard")
        // AHORA (Cambia a '/'):
        router.replace("/") 
        router.refresh()
        } else {
        setError(result.error || "Error desconocido")
        setLoading(false)
        }
    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <Card className="w-full max-w-sm border-zinc-200 shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 bg-zinc-900 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Bienvenido</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Usuario</label>
              <Input name="username" placeholder="admin" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña</label>
              <Input name="password" type="password" placeholder="••••••" required />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 font-medium bg-red-50 p-2 rounded text-center">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-zinc-900 hover:bg-zinc-800" disabled={loading}>
              {loading ? "Entrando..." : "Iniciar Sesión"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}