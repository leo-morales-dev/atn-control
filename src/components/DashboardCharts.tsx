"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

// Componente "puro": Solo la gráfica, sin tarjetas ni títulos
export function DashboardCharts({ data }: { data: any[] }) {
  return (
    <div className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis 
                dataKey="name" 
                stroke="#888888" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                tickMargin={10} 
            />
            <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
            />
            
            <Tooltip 
                cursor={{fill: '#f4f4f5', opacity: 0.5}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            
            <Bar 
                dataKey="loans" 
                fill="#444444" 
                radius={[4, 4, 0, 0]} 
                barSize={32}
            />
        </BarChart>
        </ResponsiveContainer>
    </div>
  )
}