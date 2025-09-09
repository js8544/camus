'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAgents } from '@/hooks/use-task-agents';
import { Task, TaskFormSchema, TaskFormValues } from '@/types/task';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AIAssistPanel } from './AIAssistPanel';
import { HighlightBlock } from './HighlightBlock';
import { HighlightTextarea } from './HighlightTextarea';

const TaskForm = ({ taskId }: { taskId: string }) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [taskTitle, setTaskTitle] = useState<string>('Loading...');
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAIMode, setIsAIMode] = useState(false);
  const [aiFieldIndex, setAIFieldIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const { setSidebarTasks, setCurrentTaskId } = useAgents();

  const router = useRouter();
  // 自动聚焦
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      topic: '',
      persona: '',
      questions: '',
      basicKnowledge: '',
      reportDimensions: '',
    },
    mode: 'onBlur',
  });

  const getTask = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/task/${taskId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch task');
      }
      const data = await response.json();
      return data.task;
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setCurrentTaskId(taskId);
    getTask().then((taskData) => {
      if (taskData) {
        setTask(taskData);
        const title = taskData.title || 'Untitled';

        // 设置标题
        setTaskTitle(title);

        // 在获取到数据后重置表单
        form.reset({
          topic: taskData.params?.topic || '',
          persona: taskData.params?.persona || '',
          questions: taskData.params?.questions || '',
          basicKnowledge: taskData.params?.basicKnowledge || '',
          reportDimensions: taskData.params?.reportDimensions || '',
        });

        // 如果标题是Untitled且有topic，生成标题
        if (title === 'Untitled' && taskData.params?.topic) {
          setTimeout(() => {
            generateTaskTitle();
          }, 100);
        }
      }
    });
  }, [taskId, form]);

  // taskTitle更新后，更新sidebarTasks中id相同的title
  useEffect(() => {
    if (!taskId || !taskTitle) return;
    if (taskTitle === 'Untitled' || taskTitle === 'Loading...') return;
    setSidebarTasks((prevTasks: any[]) => {
      if (!Array.isArray(prevTasks)) return prevTasks;
      return prevTasks.map((t) => (t.id === taskId ? { ...t, title: taskTitle } : t));
    });
  }, [taskId, taskTitle]);

  // const [copyDialogOpen, setCopyDialogOpen] = useState(false);
  // const [existingSyntheticSurvey, setExistingSyntheticSurvey] = useState<any[]>(
  //   [],
  // );
  // const [isLoadingSurveys, setIsLoadingSurveys] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 用于AI采纳和历史导入
  const setFormField = (key: keyof TaskFormValues, value: any) => {
    form.setValue(key, value, { shouldValidate: true, shouldDirty: true });
  };

  // 切换到AI模式
  const handleAIMode = () => {
    setIsAIMode(true);
    setAIFieldIndex(0);
  };

  // 为特定字段启用AI辅助
  const handleFieldAI = (fieldIndex: number) => {
    setIsAIMode(true);
    setAIFieldIndex(fieldIndex);
  };

  // 生成问卷名称
  const generateTaskTitle = async () => {
    const formData = form.getValues();
    if (!formData.topic) return;

    try {
      setIsGeneratingTitle(true);
      const response = await fetch('/api/task/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: formData.topic,
          persona: formData.persona,
          questions: formData.questions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedTitle = data.title || `${formData.topic}调研`;
        setTaskTitle(generatedTitle);
      } else {
        // 如果接口失败，使用默认生成逻辑
        const fallbackTitle = `${formData.topic}调研`;
        setTaskTitle(fallbackTitle);
      }
    } catch (error) {
      console.error('Error generating title:', error);
      // 如果接口失败，使用默认生成逻辑
      const fallbackTitle = `${formData.topic}调研`;
      setTaskTitle(fallbackTitle);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  // 开始编辑标题
  const startEditingTitle = () => {
    setIsEditingTitle(true);
  };

  // 保存标题到数据库
  const saveTitleToDatabase = async (title: string) => {
    try {
      await fetch(`/api/task/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title,
        }),
      });
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  // 自动保存表单数据到数据库（防抖）
  const autoSaveTask = useCallback(
    async (formData: TaskFormValues) => {
      if (!taskId || isLoading) return;

      try {
        setIsSaving(true);
        const params = {
          topic: formData.topic,
          persona: formData.persona,
          questions: formData.questions || undefined,
          basicKnowledge: formData.basicKnowledge || undefined,
          reportDimensions: formData.reportDimensions || undefined,
        };

        await fetch(`/api/task/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            params: params,
          }),
        });
      } catch (error) {
        console.error('Error auto-saving task:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [taskId, isLoading]
  );

  // 防抖的自动保存函数
  const debouncedAutoSave = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (formData: TaskFormValues) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          autoSaveTask(formData);
        }, 1000); // 1秒防抖
      };
    })(),
    [autoSaveTask]
  );

  // 监听表单变化，触发自动保存
  useEffect(() => {
    if (!task) return; // 等待task加载完成

    const subscription = form.watch((formData) => {
      // 只有当表单数据与初始数据不同时才触发自动保存
      const currentParams = {
        topic: formData.topic || '',
        persona: formData.persona || '',
        questions: formData.questions || '',
        basicKnowledge: formData.basicKnowledge || '',
        reportDimensions: formData.reportDimensions || '',
      };

      const originalParams = {
        topic: task.params?.topic || '',
        persona: task.params?.persona || '',
        questions: task.params?.questions || '',
        basicKnowledge: task.params?.basicKnowledge || '',
        reportDimensions: task.params?.reportDimensions || '',
      };

      // 检查是否有变化
      const hasChanges = Object.keys(currentParams).some(
        (key) =>
          currentParams[key as keyof typeof currentParams] !==
          originalParams[key as keyof typeof originalParams]
      );

      if (hasChanges && formData.topic && formData.persona) {
        debouncedAutoSave(formData as TaskFormValues);
      }
    });

    return () => subscription.unsubscribe();
  }, [task, form, debouncedAutoSave]);

  // 完成编辑标题
  const finishEditingTitle = async () => {
    if (taskTitle.trim()) {
      await saveTitleToDatabase(taskTitle.trim());
    }
    setIsEditingTitle(false);
  };

  // 在title变化后，自动保存到数据库
  useEffect(() => {
    if (taskTitle === 'Untitled' || taskTitle === 'Loading...') return;
    if (taskTitle === task?.title) return;
    if (taskTitle) {
      saveTitleToDatabase(taskTitle);
    }
  }, [taskTitle, task?.title]);

  // 取消编辑标题
  const cancelEditingTitle = () => {
    // 恢复到原始标题
    setTaskTitle(task?.title || taskTitle);
    setIsEditingTitle(false);
  };

  const handleAIAccept = (field: string, value: string | string[]) => {
    if (field === 'questions') {
      setFormField('questions', Array.isArray(value) ? value.join('\n\n') : value);
    } else {
      setFormField(
        field as keyof TaskFormValues,
        typeof value === 'string' ? value : ''
      );
    }
  };

  // // 表单提交
  // const handleClose = () => {
  //   setShowSuccessPopup(false);
  //   router.push("/");
  // };

  const onSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    try {
      setIsSubmitting(true);
      const values = form.getValues();

      // 保存表单数据到数据库
      const params = {
        topic: values.topic,
        persona: values.persona,
        questions: values.questions || undefined,
        basicKnowledge: values.basicKnowledge || undefined,
        reportDimensions: values.reportDimensions || undefined,
      };

      await fetch(`/api/task/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          params: params,
        }),
      });

      // 跳转到stage页面
      router.push(`/agents/${taskId}/stage`);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 加载历史问卷
  // const loadExistingSurveys = async () => {
  // setIsLoadingSurveys(true);
  // try {
  //   const surveyList = await getSyntheticSurveyListClient(
  //     token,
  //     env.DICA_API_BASE,
  //   );
  //   if (!surveyList.success) throw new Error(surveyList.error);
  //   if (!surveyList.data) throw new Error("Empty survey list");
  //   setExistingSyntheticSurvey(surveyList.data);
  // } catch (error) {
  //   console.error("Error loading surveys:", error);
  // } finally {
  //   setIsLoadingSurveys(false);
  // }
  // };

  // 导入历史问卷
  // const handleCopyFromExisting = (testId: string) => {
  //   const selectedSurvey = existingSyntheticSurvey?.find(
  //     (survey) => survey.id === Number(testId),
  //   );
  //   if (selectedSurvey) {
  //     form.reset({
  //       name: `Copy of ${selectedSurvey.name}`,
  //       category: "synthetic_survey",
  //       topic: selectedSurvey.topic,
  //       persona: selectedSurvey.persona,
  //       questions: selectedSurvey.question || "",
  //       // answer: selectedSurvey.answer || "",
  //     });
  //     setCopyDialogOpen(false);
  //   }
  // };

  // 主表单UI
  const renderForm = (isAIMode: boolean) => (
    <div
      className={`relative flex flex-col flex-1 h-full ${isAIMode ? 'w-full' : 'w-full max-w-[800px]'} mx-auto border-gray-100 rounded-2xl ${isAIMode ? 'shadow-[0px_0px_24px_0px_rgba(0,0,0,0.10)] px-6 pt-6' : 'border shadow p-8 mb-4'}`}
    >
      {/* 导入历史问卷按钮，仅在非AI模式下显示 */}
      {/* {!isAIMode && (
        <div className="fixed top-[80px] w-full">
          <div className="absolute left-[-120px] p-4 z-10 flex flex-col space-y-[12px]">
            <ExpandableButton
              icon={
                <Image
                  src={"/ReuseFormIcon.svg"}
                  alt="ReuseFormIcon"
                  width={24}
                  height={24}
                />
              }
              text="导入历史问卷"
              onClick={() => {
                setCopyDialogOpen(true);
                loadExistingSurveys();
              }}
            />
          </div>
        </div>
      )} */}
      <div className="flex flex-col flex-1 h-full">
        <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
          <div className="flex items-center gap-2 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="text-2xl font-poppins h-auto py-1 border-none shadow-none px-0 focus-visible:ring-0"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      finishEditingTitle();
                    } else if (e.key === 'Escape') {
                      cancelEditingTitle();
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button
                    type="button"
                    size="sm"
                    onClick={finishEditingTitle}
                    className="h-8 px-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={cancelEditingTitle}
                    className="h-8 px-2"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M18 6L6 18"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M6 6l12 12"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl tracking-tight font-poppins">
                  {isGeneratingTitle ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      Loading...
                    </span>
                  ) : (
                    taskTitle
                  )}
                </h1>
                {!isGeneratingTitle && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={startEditingTitle}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>
                )}
                {isSaving && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                    保存中...
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <form className="flex flex-col flex-1 gap-y-6" onSubmit={onSubmit}>
          <HighlightBlock active={isAIMode && aiFieldIndex === 0}>
            <div className="flex justify-between items-center mb-1">
              <label className="block font-poppins">
                调研主题<span className="text-red-500">*</span>
              </label>
              {!isAIMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldAI(0)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                >
                  AI辅助
                </Button>
              )}
            </div>
            {form.formState.errors.topic && (
              <div className="text-red-500 text-xs mb-1">
                {form.formState.errors.topic.message as string}
              </div>
            )}
            <Input
              value={form.watch('topic')}
              onChange={(e) => setFormField('topic', e.target.value)}
              placeholder="如：洗发水使用体验"
            />
          </HighlightBlock>
          <HighlightBlock
            active={isAIMode && aiFieldIndex === 1}
            className="flex-1 flex flex-col overflow-auto"
          >
            <div className="flex justify-between items-center mb-1">
              <label className="block font-poppins">
                目标用户画像<span className="text-red-500">*</span>
              </label>
              {!isAIMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldAI(1)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                >
                  AI辅助
                </Button>
              )}
            </div>
            {form.formState.errors.persona && (
              <div className="text-red-500 text-xs mb-1">
                {form.formState.errors.persona.message as string}
              </div>
            )}
            {(() => {
              const personaActive = isAIMode && aiFieldIndex === 1;
              return (
                <HighlightTextarea
                  value={form.watch('persona')}
                  onChange={(e) => setFormField('persona', e.target.value)}
                  placeholder="如：25-35岁女性"
                  active={personaActive}
                />
              );
            })()}
          </HighlightBlock>
          <HighlightBlock
            active={isAIMode && aiFieldIndex === 2}
            className="flex-1 flex flex-col overflow-auto"
          >
            <div className="flex justify-between items-center mb-1">
              <label className="block font-poppins">
                问卷问题<span className="text-red-500">*</span>
              </label>
              {!isAIMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldAI(2)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                >
                  AI辅助
                </Button>
              )}
            </div>
            {form.formState.errors.questions && (
              <div className="text-red-500 text-xs mb-1">
                {form.formState.errors.questions.message as string}
              </div>
            )}
            {(() => {
              const questionsActive = isAIMode && aiFieldIndex === 2;
              return (
                <HighlightTextarea
                  value={form.watch('questions') || ''}
                  onChange={(e) => setFormField('questions', e.target.value)}
                  placeholder="请直接输入所有问卷问题，每行一个问题，或自由格式"
                  active={questionsActive}
                />
              );
            })()}
          </HighlightBlock>
          <HighlightBlock
            active={isAIMode && aiFieldIndex === 3}
            className="flex-1 flex flex-col overflow-auto"
          >
            <div className="flex justify-between items-center mb-1">
              <label className="block font-poppins">相关基础知识</label>
              {!isAIMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldAI(3)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                >
                  AI辅助
                </Button>
              )}
            </div>
            {(() => {
              const knowledgeActive = isAIMode && aiFieldIndex === 3;
              return (
                <HighlightTextarea
                  value={form.watch('basicKnowledge') ?? ''}
                  onChange={(e) => setFormField('basicKnowledge', e.target.value)}
                  placeholder="如：用户对洗发水的常见认知"
                  active={knowledgeActive}
                />
              );
            })()}
          </HighlightBlock>
          <HighlightBlock
            active={isAIMode && aiFieldIndex === 4}
            className="flex-1 flex flex-col overflow-auto"
          >
            <div className="flex justify-between items-center mb-1">
              <label className="block font-poppins">报告维度</label>
              {!isAIMode && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFieldAI(4)}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 h-auto text-xs"
                >
                  AI辅助
                </Button>
              )}
            </div>
            {(() => {
              const reportDimensionsActive = isAIMode && aiFieldIndex === 4;
              return (
                <HighlightTextarea
                  value={form.watch('reportDimensions') ?? ''}
                  onChange={(e) => setFormField('reportDimensions', e.target.value)}
                  placeholder="如：用户满意度、价格敏感性、购买意愿"
                  active={reportDimensionsActive}
                />
              );
            })()}
          </HighlightBlock>
          <div className="flex justify-end gap-4 border-t pt-4 font-poppins">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push(`/agents/${taskId}`)}
              className="font-poppins"
            >
              取消
            </Button>

            <div className="flex gap-4">
              {!isAIMode ? (
                <>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !form.formState.isValid}
                    className="bg-[#007AFF] hover:bg-[#0057B7] text-white font-poppins"
                  >
                    下一步
                  </Button>
                </>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting || !form.formState.isValid}
                  className="bg-[#007AFF] hover:bg-[#0057B7] text-white font-poppins"
                >
                  {isSubmitting ? '生成中...' : '下一步'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
      {/* <SuccessPopup open={showSuccessPopup} onClose={handleClose} /> */}
      {/* <ImportHistoryPopup
        open={copyDialogOpen}
        onOpenChange={setCopyDialogOpen}
        isLoading={isLoadingSurveys}
        existingTests={existingSyntheticSurvey}
        handleCopyFromExisting={handleCopyFromExisting}
      /> */}
    </div>
  );

  // 双栏模式
  return (
    <div className="flex w-full h-full">
      <div
        className={`${isAIMode ? 'w-1/2' : 'w-full'} h-full flex flex-col items-center overflow-auto pt-6 pb-3 px-4`}
      >
        {renderForm(isAIMode)}
      </div>
      {isAIMode && (
        <div className="w-1/2 px-2 pt-6 pb-3 flex flex-col">
          <AIAssistPanel
            formData={form.getValues() as any}
            onAccept={handleAIAccept}
            aiFieldIndex={aiFieldIndex}
            setAIFieldIndex={setAIFieldIndex}
          />
        </div>
      )}
    </div>
  );
};
export default TaskForm;
