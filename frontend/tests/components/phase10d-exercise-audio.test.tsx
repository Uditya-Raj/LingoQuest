import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { ExerciseAudioControl } from '@/components/lesson/exercise-audio-control'
import { exerciseRenderer } from '@/components/lesson/exercise-renderer'
import { LessonPlayer } from '@/components/lesson/lesson-player'
import {
  SPEECH_PITCH,
  SPEECH_RATE,
  SPEECH_VOLUME,
} from '@/lib/audio/speech-config'
import { cancelActiveLessonAudio } from '@/lib/audio/lesson-audio-controller'
import type { PublicExercise, SubmittedAnswer } from '@/lib/contracts/exercises'
import {
  allFiveExercises,
  exerciseFillBlank,
  exerciseMatchPairs,
  exerciseMultipleChoice,
  exerciseTypeAnswer,
  exerciseWordBank,
  mockAnswerForExercise,
  mockFiveTypeAttempt,
} from '@/tests/fixtures/phase10b'
import {
  createMockVoice,
  installMockSpeechSynthesis,
  installUnsupportedSpeechSynthesis,
  removeSpeechSynthesisMock,
  type MockSpeechSynthesis,
} from '@/tests/helpers/mock-speech-synthesis'
import { renderWithToast } from '@/tests/helpers/render-with-toast'

const getAttemptMock = vi.fn()
const submitAnswerMock = vi.fn()
const pushMock = vi.fn()
const replaceMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
    submitAnswer: (...args: unknown[]) => submitAnswerMock(...args),
  }
})

const ttsExercises: PublicExercise[] = [
  { ...exerciseMultipleChoice, tts_text: 'hola', tts_lang: 'es-ES' },
  {
    ...exerciseWordBank,
    id: 702,
    tts_text: 'Yo como pan',
    tts_lang: 'es-ES',
  },
  {
    ...exerciseMatchPairs,
    id: 703,
    tts_text: 'pan',
    tts_lang: 'es-ES',
  },
  {
    ...exerciseFillBlank,
    id: 704,
    tts_text: 'Buenos días',
    tts_lang: 'es-ES',
  },
  {
    ...exerciseTypeAnswer,
    id: 705,
    tts_text: 'gracias',
    tts_lang: 'es-ES',
  },
]

function renderExercise(exercise: PublicExercise, draft: SubmittedAnswer | null = null) {
  const onDraftChange = vi.fn()
  const Renderer = exerciseRenderer.Component
  return {
    onDraftChange,
    ...render(
      <Renderer
        exercise={exercise}
        draftAnswer={draft}
        onDraftChange={onDraftChange}
        disabled={false}
        isSubmitting={false}
        feedback={null}
      />,
    ),
  }
}

describe('Phase 10D exercise audio', () => {
  let speech: MockSpeechSynthesis

  beforeEach(() => {
    speech = installMockSpeechSynthesis([
      createMockVoice('es-ES', 'Spanish Spain'),
      createMockVoice('en-US', 'English US'),
    ])
  })

  afterEach(() => {
    cancelActiveLessonAudio()
    removeSpeechSynthesisMock()
    vi.restoreAllMocks()
  })

  describe('support detection', () => {
    it('shows Play for a supported browser with a complete TTS pair', async () => {
      render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      expect(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      ).toBeInTheDocument()
      expect(speech.speak).not.toHaveBeenCalled()
    })

    it('shows unsupported fallback when speechSynthesis is missing', async () => {
      installUnsupportedSpeechSynthesis()
      render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      expect(
        await screen.findByText(/Audio unavailable in this browser/i),
      ).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Play/i })).toBeNull()
    })

    it('shows unsupported fallback when SpeechSynthesisUtterance is missing', async () => {
      Reflect.deleteProperty(window, 'SpeechSynthesisUtterance')
      render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      expect(
        await screen.findByText(/Audio unavailable in this browser/i),
      ).toBeInTheDocument()
    })

    it('renders no control when TTS fields are absent', () => {
      const { container } = render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText={null}
          ttsLang={null}
        />,
      )
      expect(container).toBeEmptyDOMElement()
    })
  })

  describe('playback', () => {
    it('constructs one utterance with exact text/lang and conservative settings', async () => {
      const user = userEvent.setup()
      render(
        <ExerciseAudioControl
          exerciseId={9}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )

      expect(speech.cancel).toHaveBeenCalled()
      expect(speech.speak).toHaveBeenCalledTimes(1)
      const utterance = speech.utterances[0]
      expect(utterance.text).toBe('hola')
      expect(utterance.lang).toBe('es-ES')
      expect(utterance.rate).toBe(SPEECH_RATE)
      expect(utterance.pitch).toBe(SPEECH_PITCH)
      expect(utterance.volume).toBe(SPEECH_VOLUME)
      expect(utterance.voice?.name).toBe('Spanish Spain')
      expect(screen.getByText('Speaking')).toBeInTheDocument()
    })

    it('transitions to Replay after utterance end', async () => {
      const user = userEvent.setup()
      render(
        <ExerciseAudioControl
          exerciseId={9}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      speech.finishCurrent()
      expect(
        await screen.findByRole('button', {
          name: /Replay Spanish pronunciation/i,
        }),
      ).toBeInTheDocument()
    })

    it('shows a restrained error and keeps answering available', async () => {
      const user = userEvent.setup()
      const { onDraftChange } = renderExercise(exerciseMultipleChoice)

      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      speech.errorCurrent()

      expect(
        await screen.findByText(/Audio could not be played/i),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('radio', { name: /Hola/i }))
      expect(onDraftChange).toHaveBeenCalledWith({ option_id: 'opt_a' })
    })
  })

  describe('replay and cleanup', () => {
    it('cancels the prior utterance on replay', async () => {
      const user = userEvent.setup()
      render(
        <ExerciseAudioControl
          exerciseId={9}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      const button = await screen.findByRole('button', {
        name: /Play Spanish pronunciation/i,
      })
      await user.click(button)
      await user.click(button)
      expect(speech.cancel.mock.calls.length).toBeGreaterThanOrEqual(2)
      expect(speech.speak).toHaveBeenCalledTimes(2)
    })

    it('cancels speech when the exercise identity changes', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      const cancelCount = speech.cancel.mock.calls.length

      rerender(
        <ExerciseAudioControl
          exerciseId={2}
          audioUrl={null}
          ttsText="adiós"
          ttsLang="es-ES"
        />,
      )

      await waitFor(() => {
        expect(speech.cancel.mock.calls.length).toBeGreaterThan(cancelCount)
      })
    })

    it('ignores stale onend callbacks after exercise change', async () => {
      const user = userEvent.setup()
      const { rerender } = render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      const stale = speech.utterances[0]

      rerender(
        <ExerciseAudioControl
          exerciseId={2}
          audioUrl={null}
          ttsText="adiós"
          ttsLang="es-ES"
        />,
      )

      stale.onend?.(new Event('end'))
      expect(
        screen.getByRole('button', { name: /Play Spanish pronunciation/i }),
      ).toBeInTheDocument()
      expect(screen.queryByText('Replay')).toBeNull()
    })

    it('cancels on unmount', async () => {
      const user = userEvent.setup()
      const { unmount } = render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      const before = speech.cancel.mock.calls.length
      unmount()
      expect(speech.cancel.mock.calls.length).toBeGreaterThan(before)
    })
  })

  describe('voice handling', () => {
    it('falls back to base-language voice when exact match is missing', async () => {
      speech.setVoices([createMockVoice('es-MX', 'Mexican Spanish')])
      const user = userEvent.setup()
      render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      expect(speech.utterances[0].voice?.name).toBe('Mexican Spanish')
      expect(speech.utterances[0].lang).toBe('es-ES')
    })

    it('retains utterance.lang when only unrelated voices exist', async () => {
      speech.setVoices([createMockVoice('en-US', 'English')])
      const user = userEvent.setup()
      render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      expect(speech.utterances[0].voice).toBeNull()
      expect(speech.utterances[0].lang).toBe('es-ES')
    })

    it('removes voiceschanged listeners on unmount', () => {
      const { unmount } = render(
        <ExerciseAudioControl
          exerciseId={1}
          audioUrl={null}
          ttsText="hola"
          ttsLang="es-ES"
        />,
      )
      expect(speech.addEventListener).toHaveBeenCalledWith(
        'voiceschanged',
        expect.any(Function),
      )
      unmount()
      expect(speech.removeEventListener).toHaveBeenCalledWith(
        'voiceschanged',
        expect.any(Function),
      )
    })
  })

  describe('renderer integration', () => {
    it('shows the shared audio control for all five exercise types', async () => {
      for (const exercise of ttsExercises) {
        const { unmount } = renderExercise(exercise)
        expect(
          await screen.findByRole('button', {
            name: /Play Spanish pronunciation/i,
          }),
        ).toBeInTheDocument()
        expect(document.querySelector('[data-tts-slot]')).not.toBeNull()
        unmount()
      }
    })

    it('does not invent TTS from the prompt when fields are missing', () => {
      renderExercise({ ...exerciseWordBank, tts_text: null, tts_lang: null })
      expect(screen.queryByRole('button', { name: /Play/i })).toBeNull()
      expect(screen.queryByText(/Audio unavailable/i)).toBeNull()
    })

    it('does not change the draft payload after playback', async () => {
      const user = userEvent.setup()
      const draft = { option_id: 'opt_b' }
      const { onDraftChange } = renderExercise(exerciseMultipleChoice, draft)

      await user.click(
        await screen.findByRole('button', {
          name: /Play Spanish pronunciation/i,
        }),
      )
      expect(onDraftChange).not.toHaveBeenCalled()
    })

    it('never depends on correct_answer for audio', () => {
      for (const exercise of allFiveExercises) {
        expect(exercise).not.toHaveProperty('correct_answer')
      }
    })
  })

  describe('lesson lifecycle', () => {
    it('cancels speech when Check is pressed', async () => {
      const user = userEvent.setup()
      const attempt = mockFiveTypeAttempt({
        exercises: ttsExercises,
        total_exercises: 5,
      })
      getAttemptMock.mockResolvedValue(attempt)
      submitAnswerMock.mockResolvedValue(
        mockAnswerForExercise(ttsExercises[0]!),
      )

      renderWithToast(<LessonPlayer attemptId={attempt.attempt_id} />)

      await screen.findByRole('button', {
        name: /Play Spanish pronunciation/i,
      })
      await user.click(
        screen.getByRole('button', { name: /Play Spanish pronunciation/i }),
      )
      await user.click(screen.getByRole('radio', { name: 'Hola' }))

      const cancelBeforeCheck = speech.cancel.mock.calls.length
      await user.click(screen.getByRole('button', { name: 'Check' }))

      await waitFor(() => {
        expect(speech.cancel.mock.calls.length).toBeGreaterThan(
          cancelBeforeCheck,
        )
      })
      await screen.findByRole('button', { name: 'Continue' })
    })
  })
})
