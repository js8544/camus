import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, invitationCode } = await request.json()

    // Add debugging
    console.log("Registration attempt:", { email, name, invitationCode: invitationCode ? "***provided***" : "MISSING" })

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Improved invitation code validation
    if (!invitationCode || invitationCode.trim() === '') {
      return NextResponse.json(
        { error: "Invitation code is required" },
        { status: 400 }
      )
    }

    // For now, accept any invitation code - you can add proper validation later
    // if (invitationCode !== "CAMUS_BETA") {
    //   return NextResponse.json(
    //     { error: "Invalid invitation code" },
    //     { status: 400 }
    //   )
    // }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: null, // Will be set when email is verified
      }
    })

    // Generate verification token
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

    console.log("Attempting to send verification email to:", email)
    console.log("Verification URL:", verificationUrl)
    console.log("Email FROM:", process.env.EMAIL_FROM || "noreply@camus.app")

    try {
      const emailResult = await resend.emails.send({
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
                <p>Click the button below to verify your email and complete your registration:</p>
                
                <a href="${verificationUrl}" class="button">Verify Email</a>
                
                <p>This link expires in 24 hours.</p>
                
                <div class="footer">
                  <p>If you didn't create an account, you can ignore this email.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      })

      console.log("Email sent successfully!")
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError)
      // Still return success, but user will need to request new verification
    }

    return NextResponse.json(
      {
        message: "Registration successful! Please check your email to verify your account.",
        email: user.email
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
} 
