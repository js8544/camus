import { authOptions } from '@/lib/auth';
import { TaskStatus } from '@/types/const';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import TaskService from '@/lib/db/task-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const tasks = await TaskService.getTasks(session?.user?.id, sessionId || undefined);

    return NextResponse.json({
      tasks: tasks,
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { sessionId, topic } = body;
    const task = await TaskService.createTask({
      params: {
        topic,
      },
      title: "",
      userId: session?.user?.id,
      sessionId: sessionId,
    });

    return NextResponse.json({
      task: {
        id: task.id,
        title: task.title,
        topic,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
