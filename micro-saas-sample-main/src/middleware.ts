import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API - sempre permite (autenticação é tratada dentro de cada rota)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Arquivos estáticos e _next
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/_static') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Verifica se está autenticado (cookies do NextAuth v5)
  // NextAuth v5 usa vários nomes de cookies possíveis
  const cookies = [
    'authjs.session-token',
    '__Secure-authjs.session-token',
    'next-auth.session-token',
    '__Secure-next-auth.session-token',
  ]

  let sessionToken: string | undefined

  for (const cookieName of cookies) {
    const cookie = request.cookies.get(cookieName)
    if (cookie && cookie.value && cookie.value.length > 10) {
      sessionToken = cookie.value
      break
    }
  }

  const isAuthenticated = !!sessionToken

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

  // Rotas protegidas (/app/*) - requer autenticação
  if (pathname.startsWith('/app')) {
    if (!isAuthenticated) {
      const authUrl = new URL('/auth', request.url)
      authUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(authUrl)
    }
    return NextResponse.next()
  }

  // Outras rotas públicas
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
