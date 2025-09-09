import { z } from 'zod';
import { TaskStatus } from '@prisma/client';


export interface TaskParams {
  topic: string;
  persona?: string;
  questions?: string;
  basicKnowledge?: string;
  reportDimensions?: string;
  [key: string]: any; // 添加索引签名以兼容 Prisma Json 类型
}


export interface TaskCreate {
  title: string;
  userId?: string;
  sessionId?: string;
  params: TaskParams;
}

export interface TaskUpdate {
  title?: string;
  userId?: string;
  sessionId?: string;
  status?: TaskStatus;
  params?: TaskParams;
  stages?: any;
  metadata?: any;
  results?: any;
}


export interface Task extends TaskCreate {
  id: string;
  title: string;
  status: TaskStatus;
  params: TaskParams;
  stages?: any;
  metadata?: any;
  results?: any;
  createdAt: string;
  updatedAt: string;
};

export const TaskFormSchema = z.object({
  topic: z
    .string()
    .min(2, 'Topic must be at least 2 characters')
    .max(100, 'Topic must be less than 100 characters'),
  persona: z.string().min(2, 'Persona must be at least 2 characters'),
  questions: z.string().nullable(),
  basicKnowledge: z.string().nullable(),
  reportDimensions: z.string().nullable(),
});

export type AIMessage = {
  role: 'user' | 'assistant' | "system";
  content: string;
};


export type TaskDialogPayload = {
  params: TaskParams;
  messages?: AIMessage[];
  targetField: 'topic' | 'persona' | 'questions' | 'basicKnowledge' | 'reportDimensions';
};

export type TaskFormValues = z.infer<typeof TaskFormSchema>;

export type SyntheticSurveyFormDialogPayload = TaskFormValues & {
  targetField: 'topic' | 'persona' | 'questions' | 'basicKnowledge' | 'reportDimensions';
  messages: Array<AIMessage>;
};

export type SyntheticSurveyFormDialogResponse = {
  role: 'assistant';
  content: string;
  new_value: string;
};

export interface SyntheticSurveyCreateResponse {
  id: number;
  userId: number;
  star: boolean;
  createdAt: string;
  updatedAt: string;
  latestTaskId: string;
  name: string;
  category: 'synthetic_survey';
  topic: string;
  persona: string;
  generateCount: number;
  questions: string | null;
}

export type SyntheticSurveyListResponse = SyntheticSurveyCreateResponse[];

export type InterViewMeta = {
  process_status: TaskStatus;
  view_status: boolean;
  session_id: string | null;
  summary: string;
};

export type Consumer = {
  name: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  region: string;
  description: string;
};

export type QAPair = {
  q: string;
  a: string;
};

export type Interviews = Array<QAPair>;

export type InterviewData = {
  profile: string;
  consumer: Consumer;
  interview: Interviews;
};

export type SyntheticSurveyInterview = {
  id: number;
  taskId: string;
  cnData: InterviewData | null;
  rowData: InterviewData | null;
  meta: InterViewMeta;
  createdAt: string;
};

export type SyntheticSurveyInterviewItems = Array<SyntheticSurveyInterview>;

export type SyntheticSurveyInterviewResponse = {
  total: number;
  items: SyntheticSurveyInterviewItems;
};

// Type for each survey answer (key-value pairs where value is count)
type SurveyAnswer = {
  [key: string]: number;
};

// Summary item for a single question
export type SummaryItem = {
  question: string;
  answer: SurveyAnswer;
  summary: string;
};

// Results section inside user data
type ResultsData = {
  total_summary: string;
  suggestion: string;
  stats: SummaryItem[];
};

// Knowledge Eject Section
type KnowledgeEject = {
  basic: string;
  overview: string;
  comments: string;
};

// Interviewer records — empty array in sample data
type InterviewerRecord = any; // Can be refined later if structure becomes available

// Flow data — describes the survey itself
type FlowData = {
  name: string;
  category: string;
  id: number;
  userId: number;
  star: boolean;
  createdAt: string;
  updatedAt: string;
  latestTaskId: null | string;
  topic: string;
  persona: string;
  generateCount: number;
  questions: string;
  basicKnowledge: null | string;
};

// Full user data object (top-level in this JSON)
export type SyntheticSurveyDetail = {
  id: number;
  name: string;
  taskId: string;
  status: string;
  category: string;
  creator: string;
  flowId: number;
  userId: number;
  createdAt: string;
  updatedAt: string;
  results: {
    results: ResultsData;
  };
  knowledge_eject: KnowledgeEject;
  interviewer_records: InterviewerRecord[];
  flow: FlowData;
};

// Stage related types
export type ModuleType = "DR" | "SL" | "SS";

export interface ModuleSelection {
  module: ModuleType;
  reason?: string;
  [key: string]: any;
}

export interface StagePolicy {
  allow_bootstrap_ss: boolean;
  bootstrap_timeout_min: number;
}

export interface Stage {
  module: ModuleType;
  input?: string | Record<string, any> | null;
  task_id?: number | null;
  status?: TaskStatus | null;
}

export interface Plan {
  modules_selected: ModuleSelection[];
  routing_mode: "dependency-aware";
  stage_policy: StagePolicy;
  notes?: string | null;
  stages: Stage[];
}
