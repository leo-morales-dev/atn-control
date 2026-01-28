"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { AlertTriangle } from "lucide-react"

interface Props {
    data: { provider: string, count: number }[]
}

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-zinc-200 p-3 rounded-lg shadow-sm">
                <p className="text-sm font-bold text-[#232323]">{payload[0].payload.provider}</p>
                <p className="text-xs text-zinc-600 flex items-center gap-1 mt-1">
                    <AlertTriangle size={12} className="text-red-600" />
                    {payload[0].value} reportes
                </p>
            </div>
        )
    }
    return null
}

export function DamagesChart({ data }: Props) {
    // Invertimos el orden para que el proveedor con más daños aparezca arriba
    const sortedData = [...data].sort((a, b) => a.count - b.count)

    if (data.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-xl p-6">
                <AlertTriangle size={24} className="mb-2 text-zinc-300" />
                <p className="text-sm font-medium">Sin datos de reportes</p>
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#71717A" }} reversed /> {/* <-- reversed invierte el eje X */}
                <YAxis 
                    dataKey="provider" 
                    type="category" 
                    tick={{ fontSize: 11, fill: "#232323", fontWeight: 500 }} 
                    width={100} 
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F3F4F6' }} />
                <Bar dataKey="count" fill="#232323" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    )
}