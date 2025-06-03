import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.redirect(new URL("/auth/error?error=Verification", request.url))
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: {
        token,
      }
    })

    if (!verificationToken) {
      return NextResponse.redirect(new URL("/auth/error?error=Verification", request.url))
    }

    // Check if token has expired
    if (verificationToken.expires < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { token }
      })

      return NextResponse.redirect(new URL("/auth/error?error=Verification", request.url))
    }

    // Check if email matches
    if (verificationToken.identifier !== email) {
      return NextResponse.redirect(new URL("/auth/error?error=Verification", request.url))
    }

    // Update user email verification status
    await prisma.user.update({
      where: { email },
      data: {
        emailVerified: new Date()
      }
    })

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: { token }
    })

    // Log analytics
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      await prisma.analytics.create({
        data: {
          event: "email_verified",
          userId: user.id,
          metadata: {
            email: user.email,
          }
        }
      })
    }

    // Redirect to success page or sign in
    return NextResponse.redirect(new URL("/auth/signin?verified=true", request.url))

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.redirect(new URL("/auth/error?error=Verification", request.url))
  }
} 
