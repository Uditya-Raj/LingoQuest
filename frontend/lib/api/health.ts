/**
 * Health endpoint wrappers.
 */

import { apiGet } from '@/lib/api/client'
import type { HealthResponse, ReadinessResponse } from '@/lib/contracts/health'

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return apiGet<HealthResponse>('/health', { signal })
}

export function getReady(signal?: AbortSignal): Promise<ReadinessResponse> {
  return apiGet<ReadinessResponse>('/ready', { signal })
}
