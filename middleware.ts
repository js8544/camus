import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAuth = !!token
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth')
    const isProtectedPage = req.nextUrl.pathname.startsWith('/agent')
    const isAdminPage = req.nextUrl.pathname.startsWith('/admin')

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

    // Admin access control - restrict to specific admin users
    if (isAdminPage && !isAuth) {
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', req.nextUrl.pathname)
      return NextResponse.redirect(signInUrl)
    }

    if (isAdminPage && isAuth && token) {
      // Define admin emails - replace with your email(s)
      const adminEmails = [
        process.env.ADMIN_EMAIL,
        // Add additional admin emails here if needed
      ].filter(Boolean)

      const userEmail = token.email

      // Debug logging (remove in production)
      console.log("🔍 Admin access check:")
      console.log("  User email:", userEmail)
      console.log("  Admin emails:", adminEmails)
      console.log("  ADMIN_EMAIL env:", process.env.ADMIN_EMAIL)
      console.log("  Is admin:", userEmail && adminEmails.includes(userEmail))

      // Check if user is an admin
      if (!userEmail || !adminEmails.includes(userEmail)) {
        console.log("❌ Admin access denied for:", userEmail)
        // Redirect non-admin users to the main page
        return NextResponse.redirect(new URL('/', req.url))
      }

      console.log("✅ Admin access granted for:", userEmail)
    }

    // For protected pages, also check if email is verified (for credential users)
    if ((isProtectedPage || isAdminPage) && isAuth && token) {
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
