/**
 * Lesson attempt endpoint wrappers.
 */

import { apiGet, apiPost } from '@/lib/api/client'
import type {
  AnswerResponse,
  AnswerSubmitPayload,
  CompletionResponse,
  LessonAttemptResponse,
} from '@/lib/contracts/lesson'

export function startLesson(
  skillId: number,
  signal?: AbortSignal,
): Promise<LessonAttemptResponse> {
  return apiPost<LessonAttemptResponse>(
    `/skills/${skillId}/start`,
    undefined,
    { signal },
  )
}

export function startTimedPractice(
  skillId: number,
  signal?: AbortSignal,
): Promise<LessonAttemptResponse> {
  return apiPost<LessonAttemptResponse>(
    `/skills/${skillId}/start-timed`,
    undefined,
    { signal },
  )
}

export function getAttempt(
  attemptId: number,
  signal?: AbortSignal,
): Promise<LessonAttemptResponse> {
  return apiGet<LessonAttemptResponse>(`/lessons/${attemptId}`, { signal })
}

export function submitAnswer(
  attemptId: number,
  payload: AnswerSubmitPayload,
  signal?: AbortSignal,
): Promise<AnswerResponse> {
  return apiPost<AnswerResponse>(`/lessons/${attemptId}/answer`, payload, {
    signal,
  })
}

export function completeLesson(
  attemptId: number,
  signal?: AbortSignal,
): Promise<CompletionResponse> {
  return apiPost<CompletionResponse>(
    `/lessons/${attemptId}/complete`,
    undefined,
    { signal },
  )
}
