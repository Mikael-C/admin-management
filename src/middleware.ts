import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// DEMO MODE: No real auth check. Login page shows first.
// Accessing /dashboard and other pages is freely allowed after visiting /login.
// To re-enable real auth, restore the original NextAuth-based middleware.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Redirect root to login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
