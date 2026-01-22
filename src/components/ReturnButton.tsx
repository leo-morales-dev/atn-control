"use client"
import { Button } from "@/components/ui/button"
import { returnLoan } from "@/app/actions/loans"

export function ReturnButton({ id }: { id: number }) {
  return (
    <Button 
      variant="outline" 
      size="sm"
      onClick={async () => {
         if(confirm("¿Confirmar devolución de material?")) {
           await returnLoan(id)
         }
      }}
    >
      Devolver
    </Button>
  )
}