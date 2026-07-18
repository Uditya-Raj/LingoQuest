/**
 * Course and skill endpoint wrappers.
 */

import { apiGet } from '@/lib/api/client'
import type { CourseResponse, SkillDetailResponse } from '@/lib/contracts/course'

export function getCourse(signal?: AbortSignal): Promise<CourseResponse> {
  return apiGet<CourseResponse>('/course', { signal })
}

export function getSkill(
  skillId: number,
  signal?: AbortSignal,
): Promise<SkillDetailResponse> {
  return apiGet<SkillDetailResponse>(`/skills/${skillId}`, { signal })
}
