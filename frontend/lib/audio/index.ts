export {
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
  asCompleteTtsPair,
  isCompleteTtsPair,
  isPlayableAudioUrl,
  isValidTtsLang,
  isValidTtsText,
  languageDisplayName,
} from '@/lib/audio/speech-config'
export { selectVoice, normalizeVoiceLang } from '@/lib/audio/voice-selection'
export {
  getSpeechSynthesis,
  isSpeechSynthesisSupported,
} from '@/lib/audio/support'
export {
  hasExerciseAudioSource,
  resolveExerciseAudioSource,
  type ExerciseAudioSource,
} from '@/lib/audio/resolve-audio-source'
export {
  cancelActiveLessonAudio,
  registerLessonAudioCancel,
} from '@/lib/audio/lesson-audio-controller'
