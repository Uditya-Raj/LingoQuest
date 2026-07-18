/**
 * Content-administration endpoint wrappers.
 */

import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import type {
  AdminContentTreeResponse,
  AdminExerciseCreateRequest,
  AdminExercisePatchRequest,
  AdminExerciseRepresentation,
} from '@/lib/contracts/admin'

export function getContentTree(
  signal?: AbortSignal,
): Promise<AdminContentTreeResponse> {
  return apiGet<AdminContentTreeResponse>('/admin/content/tree', { signal })
}

export function createExercise(
  payload: AdminExerciseCreateRequest,
  signal?: AbortSignal,
): Promise<AdminExerciseRepresentation> {
  return apiPost<AdminExerciseRepresentation>('/admin/exercises', payload, {
    signal,
  })
}

export function updateExercise(
  exerciseId: number,
  payload: AdminExercisePatchRequest,
  signal?: AbortSignal,
): Promise<AdminExerciseRepresentation> {
  return apiPatch<AdminExerciseRepresentation>(
    `/admin/exercises/${exerciseId}`,
    payload,
    { signal },
  )
}
