import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SyntheticSurveyFormDialogPayload, TaskDialogPayload } from '@/types/task';
import { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import MarkdownComponents from './MarkdownComponents';

const FIELD_LIST = [
  { key: 'topic', label: '调研主题' },
  { key: 'persona', label: '目标用户画像' },
  { key: 'questions', label: '问卷问题' },
  { key: 'basicKnowledge', label: '相关基础知识' },
  { key: 'reportDimensions', label: '报告维度' },
] as const;
type FieldKey = (typeof FIELD_LIST)[number]['key'];

type FormData = {
  topic: string;
  persona: string;
  questions: string;
  basicKnowledge: string;
  reportDimensions: string;
};

type Message = { role: 'user' | 'assistant'; content: string };

interface AIAssistPanelProps {
  formData: FormData;
  onAccept: (field: FieldKey, value: string | string[]) => void;
  aiFieldIndex: number;
  setAIFieldIndex: (idx: number) => void;
}

export function AIAssistPanel(
  { formData, onAccept, aiFieldIndex, setAIFieldIndex }: AIAssistPanelProps
) {
  // 每个字段独立的对话历史
  const [messagesMap, setMessagesMap] = useState<Record<FieldKey, Message[]>>({
    topic: [],
    persona: [],
    questions: [],
    basicKnowledge: [],
    reportDimensions: [],
  });
  const [userInput, setUserInput] = useState('');
  // 每个字段独立的AI loading
  const [loadingMap, setLoadingMap] = useState<Record<FieldKey,boolean>>({
    topic: false,
    persona: false,
    questions: false,
    basicKnowledge: false,
    reportDimensions: false,
  });
  // 用户主动提问时的全局loading
  const [userMessageLoading, setUserMessageLoading] = useState(false);
  // 每个字段独立的AI建议
  const [aiSuggestionMap, setAISuggestionMap] = useState<Record<FieldKey, string | string[] | null>>({
    topic: null,
    persona: null,
    questions: null,
    basicKnowledge: null,
    reportDimensions: null,
  });
  
  // 从AI回复中提取建议
  const extractSuggestions = (content: string): string[] => {
    const suggestions: string[] = [];
    const suggestionRegex = /<suggestion>([\s\S]*?)<\/suggestion>/g;
    let match;
    while ((match = suggestionRegex.exec(content)) !== null) {
      suggestions.push(match[1].trim());
    }
    return suggestions;
  };

  // 移除建议标签的内容，只保留其他文本
  const removesuggestionsFromContent = (content: string): string => {
    return content.replace(/<suggestion>[\s\S]*?<\/suggestion>/g, '').trim();
  };
  const requestedFieldsRef = useRef<Set<FieldKey>>(new Set());
  const field = FIELD_LIST[aiFieldIndex];
  const messages = useMemo(
    () => messagesMap[field.key] || [],
    [messagesMap, field.key]
  );
  const aiSuggestion = useMemo(
    () => aiSuggestionMap[field.key] || null,
    [aiSuggestionMap, field.key]
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // 记录上一次的field.key，用于判断是否切换tab
  const lastFieldKeyRef = useRef<FieldKey>(field.key);
  // 记录每个字段采纳前的旧值，实现采纳/撤销
  const [prevAcceptedValue, setPrevAcceptedValue] = useState<Partial<Record<FieldKey, string | string[]>>>({});

  // 只在aiFieldIndex变化时且未请求过才发送AI初始请求（用ref同步判断和写入）
  useEffect(() => {
    setUserInput('');
    setMessagesMap((prev) => {
      // 只在首次进入该字段时初始化为空，否则保留原有历史
      if (!requestedFieldsRef.current.has(field.key)) {
        return { ...prev, [field.key]: [] };
      }
      return prev;
    });
    if (!requestedFieldsRef.current.has(field.key)) {
      requestedFieldsRef.current.add(field.key);
      sendAIInitialMessage(field.key);
    }
    // eslint-disable-next-line
  }, [aiFieldIndex, field.key]);

  // 消息变化时自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      if (lastFieldKeyRef.current !== field.key) {
        // 切换tab，瞬间滚动
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
        lastFieldKeyRef.current = field.key;
      } else {
        // 新消息，平滑滚动
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messagesMap, field.key]);

  // 发送AI第一轮建议（messages为空）
  const sendAIInitialMessage = async (targetField: FieldKey) => {
    setLoadingMap((prev) => ({ ...prev, [targetField]: true }));
    try {
      const payload:TaskDialogPayload = {
        params: formData,
        targetField: targetField,
        messages: [],
      };
      const res = await fetch('/api/task/dialog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.content || 'AI接口出错，请稍后重试。';
        const suggestions = extractSuggestions(content);
        const cleanContent = removesuggestionsFromContent(content);
        
        setMessagesMap((prev) => ({
          ...prev,
          [targetField]: [
            {
              role: 'assistant',
              content: cleanContent || content,
            },
          ],
        }));
        setAISuggestionMap((prev) => ({
          ...prev,
          [targetField]: suggestions.length > 0 ? suggestions : null
        }));
      } else {
        setMessagesMap((prev) => ({
          ...prev,
          [targetField]: [{ role: 'assistant', content: 'AI接口出错，请稍后重试。' }],
        }));
      }
    } catch (e) {
      setMessagesMap((prev) => ({
        ...prev,
        [targetField]: [{ role: 'assistant', content: 'AI接口出错，请稍后重试。' }],
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetField]: false }));
    }
  };

  // 发送消息给AI
  const sendMessage = async () => {
    if (!userInput.trim()) return;
    const newMessages: Message[] = [
      ...(messagesMap[field.key] || []),
      { role: 'user', content: userInput },
    ];
    setMessagesMap((prev) => ({ ...prev, [field.key]: newMessages }));
    setLoadingMap((prev) => ({ ...prev, [field.key]: true }));
    setUserMessageLoading(true);
    setUserInput('');
    try {
      const payload: TaskDialogPayload = {
        params: formData,
        targetField: field.key as any,
        messages: newMessages, // 传递完整历史
      };
      const res = await fetch('/api/task/dialog', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.content || 'AI接口出错，请稍后重试。';
        const suggestions = extractSuggestions(content);
        const cleanContent = removesuggestionsFromContent(content);
        
        setMessagesMap((prev) => ({
          ...prev,
          [field.key]: [
            ...newMessages,
            {
              role: data.role,
              content: cleanContent || content,
            },
          ],
        }));
        setAISuggestionMap((prev) => ({
          ...prev,
          [field.key]: data.role === 'assistant' && suggestions.length > 0 ? suggestions : null
        }));
      } else {
        setMessagesMap((prev) => ({
          ...prev,
          [field.key]: [
            ...newMessages,
            { role: 'assistant', content: 'AI接口出错，请稍后重试。' },
          ],
        }));
      }
    } catch (e) {
      setMessagesMap((prev) => ({
        ...prev,
        [field.key]: [
          ...(messagesMap[field.key] || []),
          { role: 'assistant', content: 'AI接口出错，请稍后重试。' },
        ],
      }));
    } finally {
      setLoadingMap((prev) => ({ ...prev, [field.key]: false }));
      setUserMessageLoading(false);
    }
  };

  // 采纳AI建议
  const handleAccept = (suggestion?: string) => {
    const valueToAccept = suggestion || aiSuggestion;
    if (valueToAccept == null) return;
    // 保存采纳前的旧值
    setPrevAcceptedValue((prev) => ({
      ...prev,
      [field.key]: formData[field.key],
    }));
    onAccept(field.key, valueToAccept);
    // 采纳后不清除建议，保留选项供用户继续选择
    // setAISuggestionMap((prev) => ({
    //   ...prev,
    //   [field.key]: null
    // }));
  };

  // 撤销采纳
  const handleUndo = () => {
    if (prevAcceptedValue[field.key] === undefined) return;
    onAccept(field.key, prevAcceptedValue[field.key]!);
    setPrevAcceptedValue((prev) => {
      const copy = { ...prev };
      delete copy[field.key];
      return copy;
    });
  };

  // 当前字段的初始值
  const currentValue = formData[field.key];

  return (
    <div className="flex flex-col h-full">
      {/* 标题和说明 */}
      <div className="mb-2">
        <div className="text-lg font-bold">完善您的虚拟访谈</div>
        <p className="text-sm text-gray-500 mt-1">
          可与 AI 对话来优化表单内容。如果信息已完善，可随时开始测试。
        </p>
      </div>
      {/* 顶部Tab栏 */}
      <div className="flex border-b">
        {FIELD_LIST.map((f, idx) => (
          <button
            key={f.key}
            className={`px-4 py-2 font-medium border-b-2 transition-colors duration-150 ${
              aiFieldIndex === idx
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-blue-500'
            }`}
            onClick={() => setAIFieldIndex(idx)}
            type="button"
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto bg-white rounded p-2 mb-4">
        <div className="mb-2 text-xs text-gray-400">当前值：</div>
        <div className="mb-4 bg-gray-50 p-2 rounded text-sm min-h-[32px]">
          {currentValue && typeof currentValue === 'string' && currentValue.trim() ? (
            <ReactMarkdown
              components={MarkdownComponents}
              remarkPlugins={[remarkBreaks]}
            >
              {currentValue}
            </ReactMarkdown>
          ) : (
            <span className="text-gray-400">暂无</span>
          )}
        </div>
        <div className="space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx}>
              <div
                className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`relative max-w-[80%] rounded-lg p-2 text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-100 text-blue-900'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {/* 尖角 */}
                  {msg.role === 'assistant' && (
                    <div className="absolute -left-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-gray-100"></div>
                  )}
                  {msg.role === 'user' && (
                    <div className="absolute -right-2 top-2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-blue-100"></div>
                  )}
                  {msg.role === 'assistant' ? (
                    <div className="w-full break-words overflow-wrap-anywhere">
                      <ReactMarkdown components={MarkdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
              {/* 采纳建议区：仅在最新一条为AI回复且有aiSuggestion时显示 */}
              {aiSuggestion &&
                idx === messages.length - 1 &&
                msg.role === 'assistant' && (
                  <div className="flex justify-start mt-1">
                    <div className="relative max-w-[80%] rounded-lg p-3 text-sm bg-green-50 border border-green-200 flex flex-col items-stretch">
                      <div className="font-semibold mb-2 text-green-700">AI建议：</div>
                      {Array.isArray(aiSuggestion) ? (
                        <div className="space-y-2 mb-3">
                          {aiSuggestion.map((suggestion, suggestionIdx) => (
                            <div key={suggestionIdx} className="bg-white p-2 rounded border border-green-300 flex justify-between items-start">
                              <div className="flex-1 text-green-900 break-words mr-2">
                                <ReactMarkdown components={MarkdownComponents}>
                                  {suggestion}
                                </ReactMarkdown>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAccept(suggestion)}
                                variant="default"
                                className="self-end"
                              >
                                采纳
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="flex-1 text-green-900 mb-2 break-words">
                            <ReactMarkdown components={MarkdownComponents}>
                              {typeof aiSuggestion === 'string' ? aiSuggestion : ''}
                            </ReactMarkdown>
                          </div>
                          {prevAcceptedValue[field.key] === undefined ? (
                            <Button
                              size="sm"
                              onClick={() => handleAccept()}
                              variant="default"
                              className="self-end"
                            >
                              采纳
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={handleUndo}
                              variant="outline"
                              className="self-end"
                            >
                              撤销
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {loadingMap[field.key] && (
            <div className="text-gray-400 text-sm">AI思考中...</div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !userMessageLoading) sendMessage();
          }}
          placeholder="输入你的问题或补充..."
          disabled={userMessageLoading}
          className="flex-1"
        />
        <Button
          onClick={sendMessage}
          disabled={userMessageLoading || !userInput.trim()}
          className="bg-[#007AFF] hover:bg-[#0057B7] text-white font-poppins px-4 py-2"
          size="sm"
          type="button"
        >
          发送
        </Button>
      </div>
    </div>
  );
}
