"use client"

import Link from "next/link"
import Image from "next/image" // <--- IMPORTANTE: Importar Image
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
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
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Préstamos", href: "/loans", icon: ArrowRightLeft },
  { name: "Historial", href: "/history", icon: History },
  { name: "Reportes", href: "/damages", icon: AlertTriangle },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    setIsLoggingOut(false)
  }, [pathname])

  if (pathname === "/login" || pathname.startsWith("/print")) {
    return null
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    setTimeout(async () => {
        await logout()
    }, 100)
  }

  if (isLoggingOut) {
    return (
        <div className="fixed inset-0 z-[9999] bg-white flex items-center justify-center">
            <div className="text-zinc-400 text-sm animate-pulse">Cerrando sesión...</div>
        </div>
    )
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-zinc-200 bg-white text-zinc-900 flex flex-col">
      {/* SECCIÓN DEL LOGO */}
      <div className="flex h-16 items-center border-b border-zinc-200 px-6 shrink-0">
        
        {/* REEMPLAZAMOS EL TEXTO POR LA IMAGEN */}
        <div className="relative h-10 w-full flex items-center justify-start">
             <Image 
                src="/logo1.png" // Asegúrate que tu archivo esté en 'public/logo.png'
                alt="ATN Control"
                width={150} // Ajusta este ancho según tu logo
                height={40} // Ajusta esta altura según tu logo
                className="object-contain object-left" // Esto asegura que no se deforme
                priority // Para que cargue rápido
             />
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
                  ? "bg-[#de2d2d] text-white shadow-sm" 
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          )
        })}
      </nav>

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
                className="text-zinc-400 hover:text-[#de2d2d] transition-colors p-1"
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