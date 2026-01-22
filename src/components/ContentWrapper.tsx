"use client"

import { usePathname } from "next/navigation"

export function ContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Si es login o print, NO dejamos margen. Si es normal, dejamos 16rem (ml-64)
  const isFullScreen = pathname === "/login" || pathname.startsWith("/print")
  
  return (
    <div className={`flex-1 transition-all duration-300 ease-in-out ${isFullScreen ? 'ml-0' : 'ml-64'}`}>
      {children}
    </div>
  )
}