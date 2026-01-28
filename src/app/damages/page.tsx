import prisma from "@/lib/prisma"
import { CreateDamageForm } from "@/components/CreateDamageForm"
import { DamageHistoryTable } from "@/components/DamageHistoryTable"
import { TrendingUp, Building2, AlertTriangle, LayoutList } from "lucide-react"

export const dynamic = 'force-dynamic'

export default async function DamagesPage() {
  // 1. Carga de datos optimizada
  // Traemos los productos para el formulario
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    select: {
      id: true,
      description: true,
      code: true,
      shortCode: true,
      supplierCodes: true
    }
  })

  // Traemos los reportes CON la info del producto y sus proveedores
  const reports = await prisma.damageReport.findMany({
    orderBy: { date: 'desc' },
    include: { 
      product: {
        include: {
          supplierCodes: true // <--- CLAVE: Traemos los proveedores del producto
        }
      }
    }
  })

  // 2. Algoritmo de Agrupación para el TOP
  const providerStats = new Map<string, number>();

  reports.forEach(report => {
    let providerName = "Proveedor No Identificado";
    const reportCode = report.affectedSupplierCode; // Ej: "FER-TAL-001"

    if (reportCode) {
      // Buscamos si esta clave pertenece a alguno de los proveedores registrados DEL PRODUCTO
      const match = report.product.supplierCodes.find(sc => 
        sc.code.trim().toUpperCase() === reportCode.trim().toUpperCase()
      );

      if (match && match.provider) {
        // ¡Encontramos el nombre real! (Ej: "FERRETERIA CENTRAL")
        providerName = match.provider;
      } 
      else {
        // Si no encontramos el nombre (quizás es una clave antigua o manual sin proveedor guardado)
        // Usamos la clave misma para que al menos se distinga en el Top
        providerName = `Clave: ${reportCode}`;
      }
    } else {
        // Si el reporte no tiene clave guardada
        providerName = "Sin Clave Asignada";
    }

    // Sumamos al contador
    providerStats.set(providerName, (providerStats.get(providerName) || 0) + 1);
  });

  // 3. Ordenar Top 5
  const topProviders = Array.from(providerStats, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#232323]">Reportes y Daños</h1>
            <p className="text-zinc-500 mt-1 text-sm">Registro y análisis de bajas de inventario.</p>
          </div>
        </div>

        {/* LAYOUT PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* COLUMNA IZQUIERDA: FORMULARIO (30%) */}
          <div className="lg:col-span-4 sticky top-6 space-y-6">
            <CreateDamageForm products={products} />
            
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3 shadow-sm">
                <div className="bg-blue-100 p-2 rounded-lg h-fit">
                    <LayoutList className="text-blue-700" size={18} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900">¿Múltiples Proveedores?</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                        Si un producto tiene varias claves registradas, el sistema te preguntará automáticamente a cuál asignar el daño al escanearlo.
                    </p>
                </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: DATOS (70%) */}
          <div className="lg:col-span-8 space-y-6">

            {/* TOP PROVEEDORES */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white shadow-md">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#232323]">Incidencia por Proveedor</h2>
                        <p className="text-xs text-zinc-500">Proveedores con mayor número de reportes registrados.</p>
                    </div>
                </div>
                <Building2 className="text-zinc-200" size={48} />
              </div>

              <div className="space-y-3">
                {topProviders.length === 0 ? (
                    <div className="py-10 text-center border-2 border-dashed border-zinc-100 rounded-xl">
                        <p className="text-zinc-400 text-sm">No hay suficientes datos para generar el top.</p>
                    </div>
                ) : (
                    topProviders.map((item, index) => (
                        <div key={item.name} className="relative group">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-50 border border-zinc-100 group-hover:border-zinc-300 transition-all relative z-10">
                                <div className="flex items-center gap-4">
                                    <span className={`
                                        flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shadow-sm
                                        ${index === 0 ? 'bg-red-600 text-white' : 
                                          index === 1 ? 'bg-orange-500 text-white' :
                                          index === 2 ? 'bg-amber-400 text-amber-900' : 'bg-white text-zinc-500 border border-zinc-200'}
                                    `}>
                                        #{index + 1}
                                    </span>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-zinc-800 text-sm">{item.name}</span>
                                        {index === 0 && <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Mayor incidencia</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Reportes</span>
                                    <span className="bg-white px-3 py-1 rounded-md border border-zinc-200 font-bold text-zinc-900 text-sm shadow-sm min-w-[40px] text-center">
                                        {item.count}
                                    </span>
                                </div>
                            </div>
                            {/* Barra de progreso sutil detrás */}
                            <div 
                                className="absolute top-0 bottom-0 left-0 bg-zinc-900/5 rounded-lg transition-all duration-500"
                                style={{ width: `${(item.count / topProviders[0].count) * 100}%` }}
                            />
                        </div>
                    ))
                )}
              </div>
            </div>

            {/* TABLA HISTÓRICA */}
            <DamageHistoryTable reports={reports} />
          </div>
        </div>

      </div>
    </main>
  )
}