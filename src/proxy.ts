import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { AUTH_COOKIE, authToken, safeEqual } from '@/lib/auth'

// Tudo exige login, exceto a própria tela de login e os arquivos estáticos.
export async function proxy(request: NextRequest) {
  const password = process.env.APP_PASSWORD
  const cookie = request.cookies.get(AUTH_COOKIE)?.value

  if (password && cookie && safeEqual(cookie, await authToken(password))) {
    return NextResponse.next()
  }

  const url = new URL('/login', request.url)
  const next = request.nextUrl.pathname + request.nextUrl.search
  if (next !== '/') url.searchParams.set('next', next)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!login|_next/static|_next/image|favicon.ico).*)'],
}
