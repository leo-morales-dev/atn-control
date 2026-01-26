"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintButton() {
  return (
    <Button 
      onClick={() => window.print()} 
      className="bg-blue-600 hover:bg-blue-700 gap-2 text-white shadow-md"
    >
        <Printer size={16}/> Imprimir Ahora
    </Button>
  )
}