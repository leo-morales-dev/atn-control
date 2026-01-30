"use client"

import { useState } from "react"
import { Printer, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import Link from "next/link"

// API pública para generar QR sin librerías pesadas
const QR_API_BASE = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data="

interface EmployeeData {
    id: number
    name: string
    employeeNumber: string
    role: string 
}

export function EmployeePrintPreview({ employee }: { employee: EmployeeData }) {
    const [format, setFormat] = useState<"card" | "label">("card")

    const handlePrint = () => {
        window.print()
    }
    
    // Obtenemos la inicial para el avatar
    const initial = employee.name.charAt(0).toUpperCase()

    return (
        <div className="min-h-screen bg-zinc-100 flex flex-col items-center py-8 print:bg-white print:p-0">
            
            {/* BARRA SUPERIOR (NO IMPRIMIBLE) */}
            <div className="w-full max-w-4xl px-4 mb-6 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <Link href="/employees">
                        <Button variant="outline" size="icon" className="h-9 w-9 bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm">
                            <ArrowLeft size={16} />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-zinc-900">Vista Previa de Impresión</h1>
                        <p className="text-sm text-zinc-500">Credencial para: <span className="font-semibold text-zinc-800">{employee.name}</span></p>
                    </div>
                </div>
                
                <Button onClick={handlePrint} className="bg-[#232323] hover:bg-[#232323]/90 text-white font-bold gap-2 shadow-md">
                    <Printer size={16} /> Imprimir Ahora
                </Button>
            </div>

            {/* CONTENIDO PRINCIPAL */}
            <div className="w-full max-w-4xl px-4 grid grid-cols-1 md:grid-cols-12 gap-8 print:block print:w-full print:max-w-none print:px-0">
                
                {/* 1. CONFIGURACIÓN (NO IMPRIMIBLE) */}
                <div className="md:col-span-4 space-y-4 print:hidden">
                    <Card className="border-zinc-200 shadow-sm">
                        <CardContent className="p-5 space-y-4">
                            <div className="space-y-3">
                                <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Formato de Salida</Label>
                                <RadioGroup defaultValue="card" onValueChange={(v) => setFormat(v as any)} className="grid gap-3">
                                    
                                    <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-3 transition-all cursor-pointer hover:bg-zinc-50 ${format === 'card' ? 'border-[#de2d2d] ring-1 ring-[#de2d2d] bg-red-50/10' : 'border-zinc-200'}`}>
                                        <RadioGroupItem value="card" id="r-card" className="mt-1 text-[#de2d2d]" />
                                        <div className="space-y-1">
                                            <Label htmlFor="r-card" className="font-bold text-zinc-900 cursor-pointer">Credencial ID (PVC)</Label>
                                            <p className="text-xs text-zinc-500">Formato estándar CR80. Incluye foto y datos.</p>
                                        </div>
                                    </div>

                                    <div className={`flex items-start space-x-3 space-y-0 rounded-md border p-3 transition-all cursor-pointer hover:bg-zinc-50 ${format === 'label' ? 'border-[#de2d2d] ring-1 ring-[#de2d2d] bg-red-50/10' : 'border-zinc-200'}`}>
                                        <RadioGroupItem value="label" id="r-label" className="mt-1 text-[#de2d2d]" />
                                        <div className="space-y-1">
                                            <Label htmlFor="r-label" className="font-bold text-zinc-900 cursor-pointer">Etiqueta Térmica</Label>
                                            <p className="text-xs text-zinc-500">Compacto. Solo QR y nombre.</p>
                                        </div>
                                    </div>
                                </RadioGroup>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. VISTA PREVIA (IMPRIMIBLE) */}
                <div className="md:col-span-8 flex items-start justify-center min-h-[400px] bg-zinc-200/50 rounded-xl border-2 border-dashed border-zinc-300 p-8 print:border-none print:bg-white print:p-0 print:block">
                    
                    {/* FORMATO A: TARJETA ID */}
                    {format === 'card' && (
                        <div className="w-[320px] h-[200px] bg-white rounded-xl shadow-xl overflow-hidden relative print:shadow-none print:border print:border-zinc-200 flex flex-col print:break-inside-avoid">
                            <div className="h-3 w-full bg-[#de2d2d]" />
                            
                            <div className="flex-1 p-5 flex gap-4 items-center">
                                <div className="h-20 w-20 bg-zinc-100 rounded-full border border-zinc-200 flex items-center justify-center shrink-0">
                                    <span className="text-2xl font-bold text-zinc-400">{initial}</span>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-bold text-zinc-900 leading-tight truncate">{employee.name}</h2>
                                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wide mt-1">{employee.role}</p>
                                    
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="bg-zinc-100 px-2 py-1 rounded border border-zinc-200">
                                            <p className="text-[10px] font-mono font-bold text-zinc-600">{employee.employeeNumber}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-50 px-5 py-3 border-t border-zinc-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                     <img src="/logo1.png" alt="Logo" className="h-4 object-contain opacity-50 mix-blend-multiply" />
                                </div>
                                <img 
                                    src={`${QR_API_BASE}${employee.employeeNumber}`} 
                                    alt="QR"
                                    className="h-12 w-12 mix-blend-multiply"
                                />
                            </div>
                        </div>
                    )}

                    {/* FORMATO B: ETIQUETA */}
                    {format === 'label' && (
                        <div className="w-[200px] h-[120px] bg-white rounded-lg shadow-lg p-2 border border-zinc-200 flex flex-col items-center justify-center text-center print:shadow-none print:border-none print:break-inside-avoid">
                            <img 
                                src={`${QR_API_BASE}${employee.employeeNumber}`} 
                                alt="QR"
                                className="h-16 w-16 mix-blend-multiply mb-1"
                            />
                            <h3 className="text-xs font-bold text-zinc-900 truncate w-full px-1">{employee.name}</h3>
                            <p className="text-[8px] font-mono text-zinc-500">{employee.employeeNumber}</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}