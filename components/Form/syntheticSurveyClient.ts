'use client';
import {
  SyntheticSurveyCreateResponse,
  SyntheticSurveyDetail,
  SyntheticSurveyFormDialogPayload,
  SyntheticSurveyFormDialogResponse,
  SyntheticSurveyInterviewResponse,
  SyntheticSurveyListResponse,
  TaskFormValues,
} from '@/types/task';
import { fetchClient } from './fetch-client';

export interface SyntheticSurveyPayload {
  skip: number;
  limit: number;
  sort_by: string | null;
}

export async function createSyntheticSurveyClient(
  values: TaskFormValues,
  token: string | null,
  api_base: string | undefined
): Promise {
  try {
    const data = await fetchClient<SyntheticSurveyCreateResponse, TaskFormValues>(
      `${api_base}/synthetic_survey/`,
      {
        method: 'POST',
        payload: values,
      },
      token
    );

    return { success: true, data };
  } catch (error) {
    console.error('Error creating synthetic survey:', error);
    return { success: false, error: 'Failed to create synthetic survey' };
  }
}

export async function getSyntheticSurveyListClient(
  token: string | null,
  api_base: string | undefined
): Promise {
  try {
    const data = await fetchClient<SyntheticSurveyListResponse>(
      `${api_base}/synthetic_survey/`,
      undefined,
      token
    );
    return { success: true, data };
  } catch (error) {
    console.error('[getSyntheticSurveyListClient] Error fetching surveys:', error);
    return { success: false, error: 'Failed to fetch surveys' };
  }
}

export async function chatSyntheticSurveyFormClient(
  payload: SyntheticSurveyFormDialogPayload,
  token: string | null,
  api_base: string | undefined
): Promise {
  try {
    const data = await fetchClient<
      SyntheticSurveyFormDialogResponse,
      SyntheticSurveyFormDialogPayload
    >(
      `${api_base}/synthetic_survey/parameter/dialog`,
      {
        method: 'POST',
        payload: payload,
      },
      token
    );
    return { success: true, data };
  } catch (error) {
    console.error(
      '[chatSyntheticSurveyFormClient] Error chatting with synthetic survey form:',
      error
    );
    return {
      success: false,
      error: 'Failed to chat with synthetic survey form',
    };
  }
}

/**
 * Fetches the main details of a synthetic survey task,
 * including topic, total summary, and stats.
 */
export async function getSurveyTaskDetail(
  id: string,
  token: string | null | undefined,
  api_base: string | undefined
): Promise {
  try {
    const response = await fetchClient<SyntheticSurveyDetail>(
      `${api_base}/task/${id}/detail`,
      undefined,
      token
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('[getSurveyTaskDetail] Error fetching survey detail:', error);
    return { success: false, error: 'Failed to fetch survey detail' };
  }
}

/**
 * Fetches a paginated list of interviews for a synthetic survey task.
 */
export async function getSurveyInterviews(
  id: string,
  token: string | null | undefined,
  payload: SyntheticSurveyPayload,
  api_base: string | undefined
): Promise {
  try {
    const response = await fetchClient<SyntheticSurveyInterviewResponse>(
      `${api_base}/task/${id}/dashboard`,
      { method: 'POST', payload },
      token
    );
    return { success: true, data: response };
  } catch (error) {
    console.error('[getSurveyInterviews] Error fetching survey interviews:', error);
    return { success: false, error: 'Failed to fetch survey interviews' };
  }
}
