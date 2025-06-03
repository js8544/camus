import { PrismaAdapter } from "@auth/prisma-adapter"
import bcrypt from "bcryptjs"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { createSession } from "./db"
import { prisma } from "./prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user || !user.password) {
          return null
        }

        // Note: Email verification is now checked in the frontend before authentication
        // to provide better user experience and proper redirects

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email!,
          name: user.name || undefined,
          image: user.image || undefined,
        }
      }
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For credentials provider, email verification is checked in frontend
      // For Google OAuth, we trust the email is verified
      return true
    },
    async session({ session, user, token }) {
      if (session.user) {
        session.user.id = user?.id || token.sub!

        // Create or get a Camus session for this user
        try {
          const existingSession = await prisma.session.findFirst({
            where: { userId: session.user.id },
            orderBy: { updatedAt: 'desc' }
          })

          if (!existingSession) {
            await createSession(session.user.id)
          }
        } catch (error) {
          console.error("Error creating Camus session:", error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id

        // Add provider information for middleware checks
        if (account) {
          token.provider = account.provider
        }

        // Get email verification status from database
        if (user.email) {
          try {
            const dbUser = await prisma.user.findUnique({
              where: { email: user.email },
              select: { emailVerified: true }
            })
            token.emailVerified = !!dbUser?.emailVerified
          } catch (error) {
            console.error("Error fetching email verification status:", error)
            token.emailVerified = false
          }
        }
      }
      return token
    },
  },
  events: {
    async signIn({ user, isNewUser, account }) {
      if (isNewUser) {
        // Log analytics for new user
        try {
          await prisma.analytics.create({
            data: {
              event: "user_registered",
              userId: user.id,
              metadata: {
                email: user.email,
                registrationMethod: account?.provider || "unknown"
              }
            }
          })
        } catch (error) {
          console.error("Error logging user registration:", error)
        }
      }
    },
  },
  session: {
    strategy: "jwt", // Changed to JWT for credentials support
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
} 
