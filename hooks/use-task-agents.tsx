'use client';

import { Task } from '@/types/task';
import { useRouter } from 'next/navigation';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AgentsContextType = {
  sidebarTasks: Task[];
  setSidebarTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  sidebarSearchQuery: string;
  setSidebarSearchQuery: (query: string) => void;
  currentTaskId: string;
  setCurrentTaskId: (id: string) => void;
  sessionId: string | null;
};

export const AgentsContext = createContext<AgentsContextType | undefined>(undefined);

export const useAgents = () => {
  const context = useContext(AgentsContext);
  if (!context) {
    throw new Error('useAgents must be used within a AgentsProvider');
  }
  return context;
};

export function AgentsProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // task sidecar list
  const [sidebarTasks, setSidebarTasks] = useState<Task[]>([]);
  // search query
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState<string>('');
  const [currentTaskId, setCurrentTaskId] = useState<string>('');

  // 从 URL 中提取任务ID
  useEffect(() => {
    const currentTask = sidebarTasks.find((task) => task.id === currentTaskId);

    const statusLower = currentTask?.status?.toLowerCase();
    switch (statusLower) {
      case 'pending':
        router.push(`/agents/${currentTaskId}`);
        break;
      case 'stage':
        router.push(`/agents/${currentTaskId}/stage`);
        break;
      case 'in_progress':
        router.push(`/agents/${currentTaskId}/progress`);
        break;
      case 'completed':
        router.push(`/agents/${currentTaskId}/report`);
        break;
      case 'failed':
        // 失败状态也跳转到主页面
        router.push(`/agents/${currentTaskId}`);
        break;
      default:
        // 默认跳转到主页面
        router.push(`/agents/${currentTaskId}`);
        break;
    }
  }, [currentTaskId]);

  const [sessionId] = useState(() =>
    typeof window !== 'undefined'
      ? sessionStorage.getItem('camus-session-id') ||
        (() => {
          const id = crypto.randomUUID();
          sessionStorage.setItem('camus-session-id', id);
          return id;
        })()
      : null
  );

  const value = {
    sidebarTasks,
    setSidebarTasks,
    sidebarSearchQuery,
    setSidebarSearchQuery,
    currentTaskId,
    setCurrentTaskId,
    sessionId,
  };

  return <AgentsContext.Provider value={value}>{children}</AgentsContext.Provider>;
}
