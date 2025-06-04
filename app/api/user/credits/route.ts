import { authOptions } from "@/lib/auth"
import { CreditService } from "@/lib/db/credit-service"
import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const credits = await CreditService.getUserCredits(userId)

    return NextResponse.json({ credits })
  } catch (error) {
    console.error("Error fetching user credits:", error)
    return NextResponse.json(
      { error: "Failed to fetch user credits" },
      { status: 500 }
    )
  }
} 
