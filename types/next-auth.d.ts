import { DefaultSession } from "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    emailVerified?: Date | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    provider?: string
    emailVerified?: boolean
  }
} 
