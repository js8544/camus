import { TaskSidebarList, TaskSidebarSearch } from '@/components/agents/task-sidebar';
import { AuthGuard } from '@/components/auth-guard';
import { Button } from '@/components/ui/button';
import { CreditMilestoneNotification } from '@/components/user/CreditMilestoneNotification';
import { AgentsProvider } from '@/hooks/use-task-agents';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-beige text-gray-700 font-sans">
        <CreditMilestoneNotification />
        <div className="flex h-screen">
          <AgentsProvider>
            <div className={`flex w-full h-full min-w-0`}>
              <div className="w-64 bg-white border-r border-gray-300 flex flex-col">
                <div className="p-4 border-b border-gray-300">
                  <div className="flex items-center justify-between mb-4">
                    <h1 className="text-lg font-serif font-medium text-gray-800">
                      Camus AI
                    </h1>
                    <Link href="/agents">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-300 bg-white text-gray-600 hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        New Task
                      </Button>
                    </Link>
                  </div>
                  <TaskSidebarSearch />
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  <Suspense fallback={<div>Loading...</div>}>
                    <TaskSidebarList />
                  </Suspense>
                </div>
                {/* <UserProfile /> */}
              </div>
              <div className="flex h-full flex-1 flex-col border-r border-gray-300 min-w-0">
                {children}
              </div>
            </div>
          </AgentsProvider>
        </div>
      </div>
    </AuthGuard>
  );
}
