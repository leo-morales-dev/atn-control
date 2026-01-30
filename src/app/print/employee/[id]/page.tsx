import prisma from "@/lib/prisma"
import { notFound } from "next/navigation"
import { EmployeePrintPreview } from "@/components/EmployeePrintPreview"

interface Props {
    params: Promise<{ id: string }>
}

export default async function PrintEmployeePage({ params }: Props) {
    const { id } = await params
    
    // BUSCAR EMPLEADO REAL EN BASE DE DATOS
    const employee = await prisma.employee.findUnique({
        where: { id: parseInt(id) }
    })

    if (!employee) {
        return notFound()
    }

    // Preparamos los datos para el componente visual
    const employeeData = {
        id: employee.id,
        name: employee.name,
        employeeNumber: employee.employeeNumber || "PENDIENTE",
        role: "Colaborador" // Puedes cambiar esto si agregas roles a la BD
    }

    // Renderizamos el componente cliente con los datos reales
    return <EmployeePrintPreview employee={employeeData} />
}