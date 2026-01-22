"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react" // <--- Importante: useEffect agregado aquí
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowRightLeft, 
  History, 
  AlertTriangle,
  LogOut 
} from "lucide-react"
import { logout } from "@/app/actions/auth"

const menuItems = [
  // Ahora el Dashboard es la raíz "/"
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // El inventario tiene su ruta propia
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Préstamos", href: "/loans", icon: ArrowRightLeft },
  { name: "Historial", href: "/history", icon: History },
  { name: "Reportes", href: "/damages", icon: AlertTriangle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // --- CORRECCIÓN VITAL ---
  // Si la ruta cambia (ej. entramos al Dashboard), quitamos la pantalla blanca.
  useEffect(() => {
    setIsLoggingOut(false)
  }, [pathname])

  // Ocultar Sidebar en Login o Impresión
  if (pathname === "/login" || pathname.startsWith("/print")) {
    return null
  }

  // --- FUNCIÓN DE LIMPIEZA VISUAL ---
  const handleLogout = async () => {
    setIsLoggingOut(true) // Activa el estado de salida
    
    // Pequeño delay para asegurar que se renderice la pantalla blanca antes de procesar el logout
    setTimeout(async () => {
        await logout()
    }, 100)
  }

  // Si se está saliendo, mostramos la pantalla blanca de transición
  if (isLoggingOut) {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
            <div className="text-zinc-400 text-sm animate-pulse">Cerrando sesión...</div>
        </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white text-zinc-900 flex flex-col">
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 shrink-0">
        <div className="flex items-center gap-2 font-bold text-xl">
          <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-white">
            QR
          </div>
          <span>Control</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <p className="px-2 text-xs font-medium text-zinc-500 mb-2">MENU PRINCIPAL</p>
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer del Sidebar con Botón de Cerrar Sesión */}
      <div className="p-4 border-t border-zinc-200 bg-zinc-50/50">
        <div className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 border border-zinc-100 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center font-bold text-xs">
                    AD
                </div>
                <div className="text-sm">
                    <p className="font-medium leading-none">Admin</p>
                    <p className="text-xs text-zinc-500 mt-1">Conectado</p>
                </div>
            </div>
            
            <button 
                onClick={handleLogout}
                className="text-zinc-400 hover:text-red-600 transition-colors p-1"
                title="Cerrar Sesión"
                disabled={isLoggingOut}
            >
                <LogOut size={18} />
            </button>
        </div>
      </div>
    </aside>
  )
}