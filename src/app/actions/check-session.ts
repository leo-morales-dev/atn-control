'use server'

import { cookies } from "next/headers"

export async function checkSession() {
  const cookieStore = await cookies()
  // Simplemente revisa si existe la cookie
  return cookieStore.has("session")
}