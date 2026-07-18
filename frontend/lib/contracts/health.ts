/**
 * Shared API type definitions
 */

export interface HealthResponse {
  status: string
}

export interface ReadinessResponse {
  status: string
  database: string
}
