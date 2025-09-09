import { prisma } from '@/lib/prisma';
import { TaskCreate, TaskUpdate } from '@/types/task';

export default class TaskService {
  private static async getSessionId(sessionId: string) {
    const session = await prisma.session.findUnique({
      where: { sessionId },
    });
    return session;
  }

  static async createTask(task: TaskCreate) {
    let finalSessionId = null;
    if (task.sessionId) {
      let session = await this.getSessionId(task.sessionId);
      if (!session) {
        session = await prisma.session.create({
          data: {
            sessionId: task.sessionId,
            userId: task.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        });
      }
      finalSessionId = session.id;
    }
    return await prisma.task.create({
      data: {
        ...task,
        sessionId: finalSessionId,
        params: task.params,
      },
    });
  }

  static async updateTask(id: string, task: TaskUpdate) {
    return await prisma.task.update({
      where: { id },
      data: task,
    });
  }

  static async getTasks(userId?: string, sessionId?: string) {
    try {
      let whereClause: any = {};

      if (userId) {
        whereClause.userId = userId;
      } else if (sessionId) {
        const session = await this.getSessionId(sessionId);
        if (session) {
          whereClause.sessionId = session.id;
        } else {
          throw new Error('Session not found');
        }
      }

      return await prisma.task.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error getting tasks:', error);
      return [];
    }
  }

  static async getTaskById(id: string) {
    try {
      return await prisma.task.findUnique({
        where: { id },
      });
    } catch (error) {
      console.error('Error getting task by id:', error);
      return null;
    }
  }
}
