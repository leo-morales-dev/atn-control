'use server'

import prisma from "@/lib/prisma"
import { compare } from "bcryptjs"
import { SignJWT } from "jose"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "secreto-super-seguro-cambialo")

export async function login(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // 1. Buscar usuario
  const user = await prisma.user.findUnique({
    where: { username }
  })

  // 2. Si no existe o contraseña incorrecta
  if (!user || !(await compare(password, user.password))) {
    return { success: false, error: "Usuario o contraseña incorrectos" }
  }

  // 3. Crear el Token
  const token = await new SignJWT({ 
    id: user.id, 
    username: user.username, 
    name: user.name 
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET_KEY)

  // 4. Guardar en Cookie (SOLUCIÓN: await cookies())
  const cookieStore = await cookies() // <--- Esperamos la promesa aquí
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  })

  return { success: true }
}

export async function logout() {
  // SOLUCIÓN: await cookies() aquí también
  const cookieStore = await cookies()
  
  cookieStore.delete("session")
  redirect("/login")
}