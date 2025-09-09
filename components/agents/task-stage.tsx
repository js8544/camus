'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Task, Plan, ModuleSelection } from '@/types/task';
import { TaskStatus } from '@prisma/client';

export function TaskStage({taskId}: {taskId: string}) {
    const [task, setTask] = useState<Task | null>(null);
    const [plan, setPlan] = useState<Plan | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        loadTaskAndPlan();
    }, [taskId]);

    const loadTaskAndPlan = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // 获取任务
            const response = await fetch(`/api/task/${taskId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch task');
            }
            const data = await response.json();
            const taskData = data.task;
            setTask(taskData);

            // 如果状态为PENDING，更新为STAGE
            if (taskData.status === TaskStatus.PENDING) {
                console.log('update task status to STAGE', taskData.status);
                await updateTaskStatus(taskId, TaskStatus.STAGE);
                taskData.status = TaskStatus.STAGE;
                setTask(taskData);
            }

            // 检查stages是否存在
            if (taskData.stages) {
                setPlan(taskData.stages);
            } else {
                // 获取计划
                await fetchPlan(taskData.params);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
        await fetch(`/api/task/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status }),
        });
    };

    const fetchPlan = async (params: any) => {
        const response = await fetch('/api/task/plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ params }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch plan');
        }

        const data = await response.json();
        setPlan(data);
    };

    const handleConfirm = async () => {
        if (!plan) return;

        try {
            setIsUpdating(true);
            
            // 保存stages到数据库
            await fetch(`/api/task/${taskId}?startProgress=true`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ stages: plan }),
            });


            // 可以跳转到下一个阶段或者显示成功消息
            // 这里暂时跳转回任务页面
            router.push(`/agents/${taskId}/progress`);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save stages');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleGoBack = () => {
        router.push(`/agents/${taskId}`);
    };

    const getModuleDisplayName = (module: string) => {
        switch (module) {
            case 'DR': return 'Deep Research';
            case 'SL': return 'Social Listening';
            case 'SS': return 'Synthetic Survey';
            default: return module;
        }
    };

    const getModuleBadgeColor = (module: string) => {
        switch (module) {
            case 'DR': return 'bg-blue-100 text-blue-800';
            case 'SL': return 'bg-green-100 text-green-800';
            case 'SS': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2">Give me a moment—I’m analyzing your data to get things just right.</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-red-500 text-lg mb-4">Error: {error}</div>
                <Button onClick={() => loadTaskAndPlan()} variant="outline">
                    Retry
                </Button>
            </div>
        );
    }

    if (!task || !plan) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">No task or plan data available</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{task.title || 'Task Plan'}</h1>
                    <p className="text-gray-600 mt-1">Review and confirm the execution plan</p>
                </div>
                {/* <Badge variant="outline" className="text-sm">
                    Status: {task.status}
                </Badge> */}
            </div>

            {/* Modules Selected */}
            <Card>
                <CardHeader>
                    <CardTitle>Selected Modules</CardTitle>
                    <CardDescription>
                        The following modules will be executed for this task
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {plan.modules_selected.map((module: ModuleSelection, index: number) => (
                            
                            <div 
                                key={index}
                                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <Badge className={getModuleBadgeColor(module.module)}>
                                        {module.module}
                                    </Badge>
                                </div>
                                <h3 className="font-medium text-gray-900 mb-1">
                                    {getModuleDisplayName(module.module)}
                                </h3>
                                {module.reason && (
                                    <p className="text-sm text-gray-600">
                                        {module.reason}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Plan Details */}
            {/* <Card className="disable">
                <CardHeader>
                    <CardTitle>Execution Plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-sm font-medium text-gray-700">Routing Mode</label>
                            <p className="text-sm text-gray-900">{plan.routing_mode}</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">Bootstrap Timeout</label>
                            <p className="text-sm text-gray-900">
                                {plan.stage_policy.bootstrap_timeout_min} minutes
                            </p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-sm font-medium text-gray-700">Allow Bootstrap SS</label>
                        <p className="text-sm text-gray-900">
                            {plan.stage_policy.allow_bootstrap_ss ? 'Yes' : 'No'}
                        </p>
                    </div>

                    {plan.notes && (
                        <div>
                            <label className="text-sm font-medium text-gray-700">Notes</label>
                            <p className="text-sm text-gray-900">{plan.notes}</p>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium text-gray-700">Number of Stages</label>
                        <p className="text-sm text-gray-900">{plan.stages.length}</p>
                    </div>
                </CardContent>
            </Card> */}

            {/* Action Buttons */}
            <div className="flex justify-between pt-6 border-t">
                <Button 
                    variant="outline" 
                    onClick={handleGoBack}
                    disabled={isUpdating}
                >
                    返回上一步
                </Button>
                <Button 
                    onClick={handleConfirm}
                    disabled={isUpdating}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isUpdating ? '保存中...' : '确认'}
                </Button>
            </div>
        </div>
    );
}