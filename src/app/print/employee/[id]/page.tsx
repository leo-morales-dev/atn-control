import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { QRCodeDisplay } from "@/components/QRCodeDisplay"

// 1. Cambiamos el tipo de params a Promise
export default async function EmployeePrintPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  
  // 2. Esperamos (await) a que los parámetros estén listos
  const resolvedParams = await params
  const employeeId = parseInt(resolvedParams.id)

  if (isNaN(employeeId)) return notFound()

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  })

  if (!employee) return notFound()

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-8 print:bg-white print:p-0">
      
      {/* Tarjeta Gafete */}
      <div className="w-[300px] h-[450px] bg-white border border-black rounded-lg overflow-hidden flex flex-col print:border-2">
        
        <div className="h-20 bg-black flex items-center justify-center">
            <h1 className="text-white font-bold text-xl tracking-widest">INVENTARIO</h1>
        </div>

        <div className="flex-1 flex flex-col items-center p-6 gap-2">
            <div className="w-28 h-28 rounded-full bg-zinc-200 border-2 border-zinc-400 flex items-center justify-center text-4xl text-zinc-500 font-bold mb-2">
                {employee.name.charAt(0)}
            </div>

            <h2 className="text-xl font-bold text-center uppercase leading-tight text-black">
                {employee.name}
            </h2>
            <p className="text-xs font-bold text-zinc-500 uppercase mb-4">EMPLEADO</p>

            <div className="mt-auto border-2 border-dashed border-zinc-300 p-2 rounded-lg">
                <QRCodeDisplay text={employee.employeeNumber || "N/A"} />
            </div>
            
            <p className="font-mono text-lg font-bold mt-2 text-black">
                {employee.employeeNumber}
            </p>
        </div>
      </div>
    </div>
  )
}