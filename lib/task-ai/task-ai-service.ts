import {
  BASIC_KNOWLEDGE_SYSTEM_PROMPT,
  PERSONA_SYSTEM_PROMPT,
  QUESTION_SYSTEM_PROMPT,
  REPORT_DIMENSIONS_SYSTEM_PROMPT,
  TITLE_SYSTEM_PROMPT,
  TOPIC_SYSTEM_PROMPT,
} from '@/lib/task-ai/prompt';
import { AIMessage, TaskDialogPayload } from '@/types/task';
import { OpenAI } from 'openai';

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

const DialogModel = process.env.DIALOG_MODEL || 'gemini-2.5-flash';

// 类型定义
export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string;
  new_value?: string;
};

const DialogUserPromptTemplate = `
当前调研信息：
- 调研主题：{topic}
- 目标用户画像：{persona}
- 问卷问题：{questions}
- 相关基础知识：{basic_knowledge}
- 报告维度：{report_dimensions}
`;

export class TaskAiService {
  /**
   * 用于处理各 target_field 的对话，包括：
   * 1. 生成受访者画像
   * 2. 生成主题
   * 3. 生成问卷
   * 4. 生成背景知识
   */
  private static async handleDialog(
    body: TaskDialogPayload,
    systemPrompt: string,
    llmOptions: any = {}
  ): Promise<AIMessage> {
    const userPrompt = this.formatTemplate(DialogUserPromptTemplate, {
      topic: body.params.topic,
      persona: body.params.persona || '',
      questions: body.params.questions || '(尚未生成)',
      basic_knowledge: body.params.basicKnowledge || '(尚未生成)',
      report_dimensions: body.params.reportDimensions || '(尚未生成)',
    });

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
      ...(body.messages || []),
    ];

    try {
      const response = await openAIClient.chat.completions.create({
        model: DialogModel,
        messages: messages,
        ...llmOptions,
      });

      const choice = response.choices[0];
      let content = choice.message.content || '';

      return {
        role: 'assistant',
        content,
      };
    } catch (error) {
      console.error('Error in handleDialog:', error);
      throw error;
    }
  }

  private static async handleTopicDialog(body: TaskDialogPayload): Promise<AIMessage> {
    return await this.handleDialog(body, TOPIC_SYSTEM_PROMPT);
  }

  private static async handlePersonaDialog(
    body: TaskDialogPayload
  ): Promise<AIMessage> {
    return await this.handleDialog(body, PERSONA_SYSTEM_PROMPT);
  }

  private static async handleQuestionsDialog(
    body: TaskDialogPayload
  ): Promise<AIMessage> {
    return await this.handleDialog(body, QUESTION_SYSTEM_PROMPT);
  }

  private static async handleBasicKnowledgeDialog(
    body: TaskDialogPayload
  ): Promise<AIMessage> {
    const llmOptions: any = {};
    if (!body.messages || body.messages.length === 0) {
      llmOptions.web_search_options = {
        search_context_size: 'medium',
      };
    }
    return await this.handleDialog(body, BASIC_KNOWLEDGE_SYSTEM_PROMPT, llmOptions);
  }

  private static async handleReportDimensionsDialog(
    body: TaskDialogPayload
  ): Promise<AIMessage> {
    return await this.handleDialog(body, REPORT_DIMENSIONS_SYSTEM_PROMPT);
  }

  // --- generate_dialog 主流程 ---
  static async generateDialog(body: TaskDialogPayload): Promise<AIMessage> {
    switch (body.targetField) {
      case 'topic':
        return await this.handleTopicDialog(body);
      case 'persona':
        return await this.handlePersonaDialog(body);
      case 'questions':
        return await this.handleQuestionsDialog(body);
      case 'basicKnowledge':
        return await this.handleBasicKnowledgeDialog(body);
      case 'reportDimensions':
        return await this.handleReportDimensionsDialog(body);
      default:
        throw new Error('Invalid targetField');
    }
  }

  // 辅助方法：模板格式化
  private static formatTemplate(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return result;
  }

  // 流式处理方法（如果需要的话）
  static async *handleDialogStream(
    body: TaskDialogPayload,
    systemPrompt: string,
    llmOptions: any = {}
  ): AsyncGenerator<string, void, unknown> {
    const userPrompt = this.formatTemplate(DialogUserPromptTemplate, {
      topic: body.params.topic,
      persona: body.params.persona || '',
      questions: body.params.questions || '(尚未生成)',
      basic_knowledge: body.params.basicKnowledge || '(尚未生成)',
      report_dimensions: body.params.reportDimensions || '(尚未生成)',
    });

    const messages: any[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
      ...(body.messages || []),
    ];

    try {
      const stream = (await openAIClient.chat.completions.create({
        model: DialogModel,
        messages: messages,
        stream: true,
        ...llmOptions,
      })) as unknown as AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>;

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Error in handleDialogStream:', error);
      throw error;
    }
  }

  static async generateTitle({ topic }: { topic: string }): Promise<string> {
    const messages: any[] = [
      { role: 'system', content: TITLE_SYSTEM_PROMPT },
      { role: 'user', content: `topic: ${topic}` },
    ];
    const response = await openAIClient.chat.completions.create({
      model: DialogModel,
      messages: messages,
    });
    return response.choices[0]?.message?.content || '';
  }
}
