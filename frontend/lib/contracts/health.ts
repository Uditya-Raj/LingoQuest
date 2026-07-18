/**
 * Health and readiness contracts.
 *
 * Note: written API spec examples differ slightly from the frozen backend
 * implementation (status/service wording). Types match the live backend
 * responses verified after Phase 7C.
 */

export interface HealthResponse {
  status: string
}

export interface ReadinessResponse {
  status: string
  database: string
}
