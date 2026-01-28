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
  LogOut,
  MoreVertical 
} from "lucide-react"
import { logout } from "@/app/actions/auth"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { SystemResetDialog } from "@/components/SystemResetDialog" // Importamos el diálogo de reinicio

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  // { name: "Préstamos", href: "/loans", icon: ArrowRightLeft }, // Descomenta si usas esta página
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
    // DISEÑO ORIGINAL: Fondo #ebebeb
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-[#ebebeb] text-[#232323] flex flex-col shadow-inner border-r border-white/50">
      
      {/* SECCIÓN DEL LOGO */}
      <div className="flex h-20 items-center px-6 shrink-0 mt-2">
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

      {/* SECCIÓN DE USUARIO CON POPOVER (MODIFICADA) */}
      <div className="p-6">
        <Popover>
            <PopoverTrigger asChild>
                <div className="flex items-center justify-between gap-3 rounded-xl bg-white/50 p-3 border border-white/20 cursor-pointer hover:bg-white/80 transition-all group">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#444444] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            AD
                        </div>
                        <div className="text-sm">
                            <p className="font-bold text-[#232323]">Admin</p>
                            <p className="text-xs text-[#232323]/60">Conectado</p>
                        </div>
                    </div>
                    
                    <MoreVertical size={16} className="text-[#232323]/40 group-hover:text-[#232323] transition-colors"/>
                </div>
            </PopoverTrigger>

            <PopoverContent className="w-60 p-2 mb-2 ml-4 bg-white border-zinc-200 shadow-xl rounded-xl" side="right" align="end">
                <div className="space-y-1">
                    <div className="px-2 py-1.5 border-b border-zinc-100 mb-1">
                        <p className="text-xs font-bold text-[#232323]">Opciones de Cuenta</p>
                    </div>
                    
                    {/* Botón Cerrar Sesión */}
                    <button 
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <LogOut size={16} /> Cerrar Sesión
                    </button>

                    <div className="h-px bg-zinc-100 my-1"></div>

                    {/* Botón Peligroso: Reiniciar Sistema */}
                    <div className="pt-1">
                        <SystemResetDialog />
                    </div>
                </div>
            </PopoverContent>
        </Popover>
      </div>
    </aside>
  )
}