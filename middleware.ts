import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "secreto-super-seguro-cambialo")

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // 1. Verificar sesión
  let verifiedPayload = null
  if (session) {
    try {
      const { payload } = await jwtVerify(session, SECRET_KEY)
      verifiedPayload = payload
    } catch (error) {
      // Token inválido
    }
  }

  const isLoginPage = pathname === '/login'

  // 2. Lógica de Redirección (Seguridad)
  
  // A. Sin sesión -> Login
  if (!verifiedPayload && !isLoginPage) {
    if (pathname.startsWith('/_next') || pathname.startsWith('/api') || pathname.includes('.')) {
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // B. Con sesión -> Home
  if (verifiedPayload && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. NUEVO: Gestión de Caché (Evita el botón "Atrás" después de salir)
  const response = NextResponse.next()

  // Si el usuario está dentro de la app (no en login, ni api, ni archivos estáticos)
  if (!isLoginPage && !pathname.startsWith('/_next') && !pathname.startsWith('/api')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}