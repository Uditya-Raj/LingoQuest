export {
  createOptionId,
  ensureUniqueOptionId,
  resetOptionIdCounter,
} from './option-id'
export {
  EXERCISE_TYPE_LABELS,
  EXERCISE_TYPES,
  buildCreatePayload,
  buildPatchPayload,
  createInitialFormState,
  formStateFromExercise,
  isFormDirty,
  parseMetadataJson,
} from './exercise-form-state'
export type {
  AdminSelection,
  ExerciseFormState,
  SharedExerciseFields,
} from './exercise-form-state'
export { validateExerciseForm } from './exercise-validation'
export type { FieldError, ValidationResult } from './exercise-validation'
