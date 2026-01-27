import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { EmployeeProfile } from "@/components/EmployeeProfile"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EmployeePage({ params }: PageProps) {
  // En Next.js 15+ params es una promesa, usamos await
  const { id } = await params
  const employeeId = parseInt(id)

  if (isNaN(employeeId)) return notFound()

  // 1. Buscamos al empleado
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId }
  })

  if (!employee) return notFound()

  // 2. Buscamos su historial completo (Server-side fetching)
  // Esto es mucho más rápido que hacerlo con useEffect en el cliente
  const history = await prisma.loan.findMany({
    where: { employeeId: employeeId },
    include: {
      product: true
    },
    orderBy: {
      dateOut: 'desc'
    }
  })

  return (
    <main className="min-h-screen bg-gray-50/50 p-6 md:p-10">
       <EmployeeProfile employee={employee} history={history} />
    </main>
  )
}