"use client"

import { useEffect } from "react"
import { checkSession } from "@/app/actions/check-session"
import { useRouter, usePathname } from "next/navigation"

export function SessionGuard() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Función que verifica si la sesión sigue viva
    const validate = async () => {
      // No verificamos si ya estamos en el login
      if (pathname === "/login") return 
      
      const isLoggedIn = await checkSession()
      if (!isLoggedIn) {
        // Si no hay sesión, forzamos la salida inmediata
        router.replace("/login")
      }
    }

    // 1. Ejecutar al cargar el componente
    validate()

    // 2. Ejecutar específicamente cuando el usuario usa el botón "Atrás"
    // (El evento 'pageshow' detecta si la página viene de la memoria caché del navegador)
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        validate()
      }
    }

    window.addEventListener('pageshow', onPageShow)
    
    // Limpieza
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [pathname, router])

  return null // Este componente no renderiza nada visualmente
}