import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = new Set(['/auth', '/login', '/signup', '/favicon.ico'])

const PUBLIC_PREFIXES = [
  '/auth/',           // /auth/callback, /auth/error
  '/api/auth/',       // futuras rutas de auth
  '/api/webhooks/',   // wompi y otros providers
  '/_next/',
]

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.has(pathname)) return true
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
}

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

  // Sin sesión + ruta privada → /auth con ?next=
  if (!user && !isPublicPath(pathname)) {
    const loginUrl = new URL('/auth', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Con sesión + en página de auth → /
  if (user && (pathname === '/auth' || pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}
