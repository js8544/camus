import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isProtectedPage = req.nextUrl.pathname.startsWith('/agent')

    // If user is on auth page and already authenticated, redirect to agent
    if (isAuthPage && isAuth) {
      return NextResponse.redirect(new URL('/agent', req.url))
    }

    // If user is trying to access protected page without auth, redirect to signin
    if (isProtectedPage && !isAuth) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    // For protected pages, also check if email is verified (for credential users)
    if (isProtectedPage && isAuth && token) {
      // For OAuth providers, we trust email verification
      // For credentials, we need to check emailVerified
      if (token.email && !token.emailVerified && !token.provider?.includes('google')) {
        const verifyUrl = new URL('/auth/verify-request', req.url)
        verifyUrl.searchParams.set('email', token.email as string)
        return NextResponse.redirect(verifyUrl)
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware function handle the logic
    },
  }
)

export const config = {
  matcher: [
    // Match all paths except API routes, static files, and specific public paths
    '/((?!api|_next/static|_next/image|favicon.ico|public|camus_logo.png).*)',
  ]
} 
