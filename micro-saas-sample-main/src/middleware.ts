import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const sessionToken = request.cookies.get('authjs.session-token')
  const secureSessionToken = request.cookies.get('__Secure-authjs.session-token')
  
  const token = sessionToken || secureSessionToken
  const isAuthenticated = !!token

  // API auth - sempre permite
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Página de auth - se autenticado, redireciona para /app
  if (pathname === '/auth') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    return NextResponse.next()
  }

  // Página inicial - se autenticado, redireciona para /app
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/app', request.url))
    }
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // Rotas protegidas - requer autenticação
  if (!isAuthenticated) {
    const authUrl = new URL('/auth', request.url)
    authUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(authUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
