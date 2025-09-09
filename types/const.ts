export enum TaskStatusEnum {
  PENDING = 'pending',
  STAGE = 'stage',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type TaskStatus = `${TaskStatusEnum}`;
