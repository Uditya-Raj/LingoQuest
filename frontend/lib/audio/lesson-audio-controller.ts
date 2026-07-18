/**
 * Lesson-scoped audio cancellation registry.
 *
 * Browser limitation: speechSynthesis.cancel() is a shared global API.
 * Cancelling lesson speech also stops any other page utterance using the
 * same browser speechSynthesis instance. HTMLAudioElement pause is limited
 * to the registered lesson element.
 */

type CancelFn = () => void

let activeCancel: CancelFn | null = null

export function registerLessonAudioCancel(cancel: CancelFn): () => void {
  activeCancel = cancel
  return () => {
    if (activeCancel === cancel) {
      activeCancel = null
    }
  }
}

/** Cancel the active lesson utterance/audio element, if any. */
export function cancelActiveLessonAudio(): void {
  activeCancel?.()
}
