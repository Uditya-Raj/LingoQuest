/**
 * Typed LingoQuest API surface.
 */

export { ApiError, apiGet, apiPatch, apiPost, apiRequest } from './client'
export type { ApiRequestOptions, HttpMethod } from './client'

export { getCourse, getSkill } from './course'
export {
  startLesson,
  startTimedPractice,
  getAttempt,
  submitAnswer,
  completeLesson,
} from './lessons'
export {
  getHeartsStatus,
  refillHearts,
  getCurrentUser,
  updateCurrentUser,
  getLeaderboard,
  getAchievements,
} from './user'
export { getContentTree, createExercise, updateExercise } from './content'
export { getDebugClock, advanceDebugClock, resetDebugClock } from './debug'
export { getHealth, getReady } from './health'
