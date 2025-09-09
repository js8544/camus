'use client';

import { useAgents } from '@/hooks/use-task-agents';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';

const processingMessages: string[] = [
  '🔍 资料小分队正在四处打探情报…',
  '📚 深度研究机启动！疯狂吞书中…',
  '✍️ 报告写作机器人挥舞键盘，噼里啪啦出成果…',
  '🎤 访谈招募处开张啦！快来加入话痨大军…',
  '👥 一场场对话正在发生，故事逐渐拼接完整…',
  '📊 数据正在排队统计，数字也要站好队形！',
  '🧩 总结拼图中，每块信息都找到归属…',
  '🚀 研究成果即将亮相，敬请期待舞台灯光开启！',
];

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const router = useRouter();
  const { setSidebarTasks } = useAgents();
  const { id: taskId } = use(params);

  // 轮询任务状态
  useEffect(() => {
    const checkTaskStatus = async () => {
      try {
        const response = await fetch(`/api/task/${taskId}`);
        if (response.ok) {
          const { task } = await response.json();
          setSidebarTasks((prevTasks: any[]) => {
            if (!Array.isArray(prevTasks)) return prevTasks;
            return prevTasks.map((t) => (t.id === taskId ? { ...task } : t));
          });
          if (task.status === 'COMPLETED') {
            clearInterval(statusInterval);
            router.push(`/agents/${taskId}/report`);
          }
        }
      } catch (error) {
        console.error('Error checking task status:', error);
      }
    };

    // 每5秒检查一次任务状态
    const statusInterval = setInterval(checkTaskStatus, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex(
        (prevIndex) => (prevIndex + 1) % processingMessages.length
      );
    }, 2000); // 每2秒切换一次

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-beige flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin">
          <Sparkles className="h-8 w-8 text-taupe mx-auto mb-4" />
        </div>
        <div className="h-8 flex items-center justify-center">
          <p className="text-gray-600 font-serif animate-fade-in">
            {processingMessages[currentMessageIndex]}
          </p>
        </div>
      </div>
    </div>
  );
}
