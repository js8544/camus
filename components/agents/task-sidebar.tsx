'use client';
import { Input } from '@/components/ui/input';
import { useAgents } from '@/hooks/use-task-agents';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  MessageSquare,
  Play,
  Search,
  XCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function TaskSidebarSearch() {
  const { sidebarSearchQuery, setSidebarSearchQuery } = useAgents();

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      <Input
        value={sidebarSearchQuery}
        onChange={(e) => setSidebarSearchQuery(e.target.value)}
        placeholder="Search conversations..."
        className="pl-10 border-gray-300 bg-white text-black focus:border-taupe focus-visible:ring-0"
      />
    </div>
  );
}

// 根据任务状态返回对应的图标
const getTaskStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'stage':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'in_progress':
      return <Play className="h-4 w-4 text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    default:
      return <MessageSquare className="h-4 w-4 text-gray-400" />;
  }
};

export function TaskSidebarList() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    sidebarSearchQuery,
    sidebarTasks,
    setSidebarTasks,
    currentTaskId,
    setCurrentTaskId,
    sessionId,
  } = useAgents();

  useEffect(() => {
    console.log('sessionId changed', sessionId);
    fetchTasks();
  }, [sessionId]);

  const fetchTasks = async () => {
    console.log('fetchTasks', sessionId);
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sessionId) {
        params.append('sessionId', sessionId);
      }
      const response = await fetch(`/api/task?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      setSidebarTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setError('Failed to load tasks');
      setSidebarTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('sidebarTasks updated:', sidebarTasks);
  }, [sidebarTasks]);

  const filteredTasks = sidebarTasks.filter(
    (task) =>
      sidebarSearchQuery === '' ||
      task.title.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
  );

  const handleTaskCardClick = (taskId: string) => {
    // 根据任务状态跳转到不同的页面
    setCurrentTaskId(taskId);
    // const statusLower = status?.toLowerCase();
    // switch (statusLower) {
    //   case 'pending':
    //     router.push(`/agents/${taskId}`);
    //     break;
    //   case 'stage':
    //     router.push(`/agents/${taskId}/stage`);
    //     break;
    //   case 'in_progress':
    //     router.push(`/agents/${taskId}/progress`);
    //     break;
    //   case 'completed':
    //     router.push(`/agents/${taskId}/report`);
    //     break;
    //   case 'failed':
    //     // 失败状态也跳转到主页面
    //     router.push(`/agents/${taskId}`);
    //     break;
    //   default:
    //     // 默认跳转到主页面
    //     router.push(`/agents/${taskId}`);
    //     break;
    // }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
          Recent Tasks
        </h3>
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-3 p-2 bg-red-50 rounded">
          {error}
          <button onClick={fetchTasks} className="ml-2 underline hover:no-underline">
            Retry
          </button>
        </div>
      )}

      <div className="space-y-2">
        {filteredTasks.map((task) => {
          const isSelected = currentTaskId === task.id;
          return (
            <div
              key={task.id}
              className={`group w-full flex items-start p-3 text-left rounded-lg border transition-colors relative overflow-hidden ${
                isSelected
                  ? 'bg-taupe/10 border-taupe shadow-sm'
                  : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <button
                onClick={() => setCurrentTaskId(task.id)}
                className="flex-1 flex items-start text-left min-w-0"
              >
                <div className="mt-0.5 mr-3 flex-shrink-0">
                  {getTaskStatusIcon(task.status)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p
                    className={`text-sm font-medium truncate ${
                      isSelected
                        ? 'text-gray-900'
                        : 'text-gray-700 group-hover:text-gray-900'
                    }`}
                    title={task.title || 'Untitled'}
                  >
                    {task.title || 'Untitled'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {(() => {
                      const taskDate = new Date(task.createdAt);
                      const today = new Date();
                      const isToday = taskDate.toDateString() === today.toDateString();

                      if (isToday) {
                        return taskDate.toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      } else {
                        return taskDate.toLocaleString('zh-CN', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                      }
                    })()}
                  </p>
                </div>
              </button>
            </div>
          );
        })}
      </div>

      {filteredTasks.length === 0 &&
        sidebarSearchQuery === '' &&
        !isLoading &&
        !error && (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No conversations yet</p>
            <p className="text-xs text-gray-400 mt-1">Start a new task to begin!</p>
          </div>
        )}
    </div>
  );
}
