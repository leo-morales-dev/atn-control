"use client"

import Link from "next/link"
import Image from "next/image" 
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
  { name: "Préstamos", href: "/loans", icon: ArrowRightLeft },
  { name: "Inventario", href: "/inventory", icon: Package },
  { name: "Reportes", href: "/damages", icon: AlertTriangle },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Historial", href: "/history", icon: History },
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
    // CAMBIO: Fondo #ebebeb y borde eliminado o sutil
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#ebebeb] text-[#232323] flex flex-col shadow-inner">
      
      {/* SECCIÓN DEL LOGO */}
      <div className="flex h-20 items-center px-6 shrink-0">
        <div className="relative h-10 w-full flex items-center justify-start">
             <Image 
                src="/logo1.png" 
                alt="ATN Control"
                width={150} 
                height={40} 
                className="object-contain object-left mix-blend-multiply" 
                priority 
             />
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2 p-4 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-[#232323]/50 mb-2 tracking-wider">MENU</p>
        
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.href}
              href={item.href}
              // CAMBIO: Botón activo blanco, texto siempre oscuro (#232323)
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isActive 
                  ? "bg-white text-[#232323] shadow-sm translate-x-1" 
                  : "text-[#232323]/70 hover:bg-white/50 hover:text-[#232323]"
              }`}
            >
              <item.icon size={20} className={isActive ? "text-[#444444]" : "text-[#444444]/70"} />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-6">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 p-3 border border-white/20">
            <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-[#444444] text-white flex items-center justify-center font-bold text-xs">
                    AD
                </div>
                <div className="text-sm">
                    <p className="font-bold text-[#232323]">Admin</p>
                    <p className="text-xs text-[#232323]/60">Conectado</p>
                </div>
            </div>
            
            <button 
                onClick={handleLogout}
                className="text-[#232323]/40 hover:text-[#de2d2d] transition-colors p-1"
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