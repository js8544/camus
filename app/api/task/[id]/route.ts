import { authOptions } from '@/lib/auth';
import BackendTask from '@/lib/backend-task';
import TaskService from '@/lib/db/task-service';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const task = await TaskService.getTaskById(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 转换数据格式以匹配前端期望的类型
    const formattedTask = {
      id: task.id,
      title: task.title || '',
      userId: task.userId,
      sessionId: task.sessionId,
      status: task.status,
      params: task.params || {},
      stages: task.stages,
      metadata: task.metadata,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };

    return NextResponse.json({ task: formattedTask });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { id } = await params;
    const { title, params: taskParams, status: taskStatus, stages } = body;
    const startProgress = request.nextUrl.searchParams.get('startProgress');

    // Build update object with only provided fields
    const updateData: any = {};
    if (title !== undefined) {
      updateData.title = title;
    }
    if (taskParams !== undefined) {
      updateData.params = taskParams;
    }
    if (taskStatus !== undefined) {
      updateData.status = taskStatus;
    }

    if (stages !== undefined) {
      updateData.stages = stages;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    let updatedTask = await TaskService.updateTask(id, updateData);

    if (startProgress) {
      const resultTask = await BackendTask.startProgress(
        id,
        session?.user?.id as string
      );
      updatedTask = resultTask;
    }

    return NextResponse.json({
      task: {
        id: updatedTask.id,
        title: updatedTask.title,
        status: updatedTask.status,
        params: updatedTask.params,
        updatedAt: updatedTask.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}
