import BackendTask from '@/lib/backend-task';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const data = await request.json();
  const response = await BackendTask.handlerCallback(id, data);
  return NextResponse.json({ success: response });
}
