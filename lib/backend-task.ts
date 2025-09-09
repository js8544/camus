import { Plan } from '@/types/task';
import { TaskStatus } from '@prisma/client';
import TaskService from './db/task-service';

const BACKEND_ENDPOINT = process.env.BACKEND_ENDPOINT;
const CALLBACK_ENDPOINT = process.env.CALLBACK_ENDPOINT;

export default class BackendTask {
  private static async createTask(
    userId: string,
    taskId: string,
    params: any,
    category: string,
    taskName: string
  ) {
    const body = {
      flow: {
        ...params,
        category,
        name: taskName,
      },
      meta: {
        agent_user_id: userId,
        agent_task_id: taskId,
        callback_url: `${CALLBACK_ENDPOINT}/${taskId}/callback`,
        third: true,
      },
      user_id: 0,
    };

    console.log('body', body);

    const response = await fetch(`${BACKEND_ENDPOINT}/task/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return { taskId: data.task_id };
      } else {
        console.error('Failed to create task', JSON.stringify(data));
        throw new Error('Failed to create task');
      }
    } else {
      const errordata = await response.json();
      console.error('Failed to create task', JSON.stringify(errordata));
      throw new Error('Failed to create task');
    }
  }

  static async getTask(taskId: string) {
    const response = await fetch(`${BACKEND_ENDPOINT}/task/${taskId}/detail`);
    if (response.ok) {
      return await response.json();
    } else {
      const errordata = await response.json();
      console.error('Failed to get task', JSON.stringify(errordata));
      throw new Error('Failed to get task');
    }
  }

  static async handlerCallback(taskId: string, body: any) {
    console.info('handlerCallback', taskId, body);
    const { task_id: subTaskId, status, category } = body;

    const task = await TaskService.getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }
    if (task.status !== TaskStatus.IN_PROGRESS) {
      throw new Error('Task is not in progress');
    }
    if (!task.stages) {
      throw new Error('Task has no stages');
    }
    if (status == 'failed') {
      const meta = task.metadata || ({} as any);
      meta.error = `[${category}] task[${taskId}] failed`;
      await TaskService.updateTask(taskId, {
        status: TaskStatus.FAILED,
        metadata: meta,
      });
      return false;
    }
    const updateParams: any = {};
    try {
      if (category == 'report_pdf') {
        const resultTask = await this.getTask(subTaskId);
        const taskResults = {
          ...(task.results as any),
          ...resultTask.results.results,
          status: status,
        };
        await TaskService.updateTask(taskId, {
          results: taskResults,
          status: TaskStatus.COMPLETED,
        });
        return true;
      }

      const plan = task.stages as unknown as Plan;

      const stage = plan.stages.find((stage: any) => stage.task_id === subTaskId);
      if (!stage) {
        throw new Error('Stage not found');
      }
      // update stage status
      stage.status = status;

      updateParams.stages = plan;
      const allStagesCompleted = plan.stages.every(
        (stage: any) => stage.status === 'completed'
      );
      if (allStagesCompleted) {
        const reportTask = await this.createTask(
          task.userId as string,
          taskId,
          { plan },
          'report_pdf',
          task.title || ''
        );
        updateParams.results = {
          taskId: reportTask.taskId,
        };
      }

      return true;
    } catch (error) {
      const meta = task.metadata || ({} as any);
      meta.error = error instanceof Error ? error.message : String(error);
      updateParams.status = TaskStatus.FAILED;
      updateParams.metadata = meta;
      return false;
    } finally {
      if (Object.keys(updateParams).length > 0) {
        await TaskService.updateTask(taskId, updateParams);
      }
    }
  }

  static async startProgress(taskId: string, userId: string) {
    const task = await TaskService.getTaskById(taskId);
    const getModuleCategory = (module: string) => {
      switch (module) {
        case 'DR':
          return 'deepresearch';
        case 'SL':
          return 'social_listening';
        case 'SS':
          return 'synthetic_survey';
        default:
          return module;
      }
    };
    const plan = task?.stages as unknown as Plan;

    if (!task) {
      throw new Error('Task not found');
    }
    if (task.status !== TaskStatus.STAGE && task.status !== TaskStatus.FAILED) {
      throw new Error('Task status is not correct');
    }
    if (!plan) {
      throw new Error('Task has no stages');
    }

    try {
      // 根据plan.stages中的module类型，创建任务
      // 并更新plan.stages中的task_id,和task_status
      for (const stage of plan.stages) {
        const stageData = stage.input;
        const stageName = stage.module;
        const stageTask = await this.createTask(
          userId,
          taskId,
          stageData,
          getModuleCategory(stageName),
          task.title || ''
        );
        stage.task_id = stageTask.taskId;
      }
      const updatedTask = await TaskService.updateTask(taskId, {
        stages: plan,
        status: TaskStatus.IN_PROGRESS,
      });
      return updatedTask;
    } catch (error) {
      const meta = task?.metadata || ({} as any);
      meta.error = error instanceof Error ? error.message : String(error);
      console.error('Error starting progress:', error);
      const updatedTask = await TaskService.updateTask(taskId, {
        status: TaskStatus.FAILED,
        metadata: meta,
      });
      return updatedTask;
    }
  }
}
