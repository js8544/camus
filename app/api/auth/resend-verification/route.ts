import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists and is not verified
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      )
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { error: "Email is already verified" },
        { status: 400 }
      )
    }

    // Delete any existing verification tokens for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })

    // Generate new verification token
    const token = crypto.randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      }
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

    await resend.emails.send({
      from: process.env.EMAIL_FROM || "noreply@camus.app",
      to: email,
      subject: "Verify your email - Camus",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Verify your email - Camus</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #374151;
                background-color: #F8F4EA;
                margin: 0;
                padding: 20px;
              }
              
              .container {
                max-width: 500px;
                margin: 0 auto;
                background: #ffffff;
                border: 1px solid #D1D5DB;
                border-radius: 4px;
                padding: 40px;
              }
              
              .logo {
                text-align: center;
                margin-bottom: 32px;
              }
              
              .logo img {
                width: 48px;
                height: 48px;
              }
              
              .brand-name {
                font-family: Georgia, serif;
                font-size: 24px;
                font-weight: 500;
                color: #1F2937;
                margin: 12px 0 0 0;
              }
              
              h1 {
                font-size: 20px;
                font-weight: 600;
                color: #1F2937;
                margin: 0 0 24px 0;
              }
              
              p {
                margin: 0 0 16px 0;
                color: #374151;
              }
              
              .button {
                display: inline-block;
                background-color: #8B7E74;
                color: #ffffff !important;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 4px;
                font-weight: 500;
                margin: 24px 0;
              }
              
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 1px solid #E5E7EB;
                font-size: 14px;
                color: #6B7280;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="logo">
                <img src="${process.env.NEXTAUTH_URL}/camus_logo.png" alt="Camus">
                <div class="brand-name">CAMUS</div>
              </div>
              
              <h1>Verify your email</h1>
              <p>Click the button below to verify your email:</p>
              
              <a href="${verificationUrl}" class="button">Verify Email</a>
              
              <p>This link expires in 24 hours.</p>
              
              <div class="footer">
                <p>If you didn't request this, you can ignore this email.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json(
      { message: "Verification email sent successfully!" },
      { status: 200 }
    )

  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
} 
