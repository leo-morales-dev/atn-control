import prisma from "@/lib/prisma"
import { CreateDamageDialog } from "@/components/CreateDamageDialog"
import { DamageHistoryTable } from "@/components/DamageHistoryTable"
import { AlertTriangle } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DamagesPage() {
  // CONSULTA ACTUALIZADA: Incluimos supplierCodes
  const [products, reports] = await Promise.all([
    prisma.product.findMany({ 
        where: { isArchived: false },
        select: { 
            id: true, 
            description: true, 
            code: true, 
            shortCode: true,
            supplierCodes: true // <--- Esto es vital para el modal
        } 
    }),
    prisma.damageReport.findMany({
      orderBy: { date: 'desc' },
      include: { product: true }
    })
  ])

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#232323]">Reportes y Daños</h1>
                <p className="text-zinc-500 mt-1 text-sm">Registro de bajas por merma, robo o desperfectos.</p>
            </div>
            <CreateDamageDialog products={products} />
        </div>

        <div className="grid gap-6">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 flex gap-3 items-start">
                <AlertTriangle className="text-orange-600 mt-0.5" size={18} />
                <div>
                    <h3 className="text-sm font-bold text-orange-900">Control de Inventario</h3>
                    <p className="text-xs text-orange-700 mt-1">
                        Los reportes generados descontarán stock inmediatamente. Asegúrate de seleccionar la clave de proveedor correcta si aplica.
                    </p>
                </div>
            </div>

            <DamageHistoryTable reports={reports} />
        </div>

      </div>
    </main>
  )
}