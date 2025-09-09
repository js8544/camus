import { NextRequest, NextResponse } from 'next/server'
import { TaskAiService } from '@/lib/task-ai/task-ai-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = await TaskAiService.generateDialog(body)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in task/dialog route:', error)
    return NextResponse.json(
      { error: 'Failed to generate dialog' },
      { status: 500 }
    )
  }
}