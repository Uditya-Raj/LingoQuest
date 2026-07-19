'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import { AdminErrorSummary } from '@/components/admin/admin-error-summary'
import { FillBlankEditor } from '@/components/admin/editors/fill-blank-editor'
import { MatchPairsEditor } from '@/components/admin/editors/match-pairs-editor'
import { MultipleChoiceEditor } from '@/components/admin/editors/multiple-choice-editor'
import { TypeAnswerEditor } from '@/components/admin/editors/type-answer-editor'
import { WordBankEditor } from '@/components/admin/editors/word-bank-editor'
import { TtsFields } from '@/components/admin/tts-fields'
import { Button3D } from '@/components/ui/button-3d'
import { SurfaceCard } from '@/components/ui/surface-card'
import { useToast } from '@/components/ui/toast'
import {
  EXERCISE_TYPE_LABELS,
  EXERCISE_TYPES,
  buildCreatePayload,
  buildPatchPayload,
  createInitialFormState,
  formStateFromExercise,
  isFormDirty,
  type ExerciseFormState,
} from '@/lib/admin/exercise-form-state'
import { validateExerciseForm } from '@/lib/admin/exercise-validation'
import { ApiError, createExercise, updateExercise } from '@/lib/api'
import type { AdminExerciseRepresentation } from '@/lib/contracts/admin'
import type { ExerciseType } from '@/lib/contracts/exercises'
import { cn } from '@/lib/utils'

export interface ExerciseEditorProps {
  mode: 'create' | 'edit'
  lessonId: number
  orderIndex: number
  baseline: AdminExerciseRepresentation | null
  contextLabel: string
  onSaved: (exercise: AdminExerciseRepresentation) => void
  onDirtyChange: (dirty: boolean) => void
  onCancelCreate?: () => void
  className?: string
}

export function ExerciseEditor({
  mode,
  lessonId,
  orderIndex,
  baseline,
  contextLabel,
  onSaved,
  onDirtyChange,
  onCancelCreate,
  className,
}: ExerciseEditorProps) {
  const formId = useId()
  const { addToast } = useToast()
  const [form, setForm] = useState<ExerciseFormState>(() =>
    mode === 'edit' && baseline
      ? formStateFromExercise(baseline)
      : createInitialFormState('multiple_choice', lessonId, orderIndex),
  )
  const [fieldErrors, setFieldErrors] = useState<
    ReturnType<typeof validateExerciseForm>['errors']
  >([])
  const [apiError, setApiError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [focusSummary, setFocusSummary] = useState(false)
  const submittingRef = useRef(false)
  const statusId = `${formId}-save-status`

  useEffect(() => {
    if (mode === 'edit' && baseline) {
      setForm(formStateFromExercise(baseline))
      setFieldErrors([])
      setApiError(null)
      setConflict(false)
      setPermissionDenied(false)
    }
  }, [mode, baseline])

  useEffect(() => {
    if (mode === 'create') {
      setForm(createInitialFormState(form.type, lessonId, orderIndex))
      setFieldErrors([])
      setApiError(null)
    }
    // Reset create form when lesson/order context changes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional create remount semantics
  }, [mode, lessonId, orderIndex])

  const dirty = useMemo(
    () => isFormDirty(baseline, form, mode),
    [baseline, form, mode],
  )

  useEffect(() => {
    onDirtyChange(dirty)
  }, [dirty, onDirtyChange])

  const validation = useMemo(() => validateExerciseForm(form), [form])
  const canSave =
    (mode === 'create' || dirty) &&
    validation.valid &&
    !submitting &&
    !permissionDenied

  const setPrompt = (prompt: string) => {
    setForm((prev) => ({ ...prev, prompt }))
  }
  const setOrderIndex = (order_index: number) => {
    setForm((prev) => ({ ...prev, order_index }))
  }
  const setAudioUrl = (audio_url: string | null) => {
    setForm((prev) => ({ ...prev, audio_url }))
  }
  const setTtsText = (tts_text: string | null) => {
    setForm((prev) => ({ ...prev, tts_text }))
  }
  const setTtsLang = (tts_lang: string | null) => {
    setForm((prev) => ({ ...prev, tts_lang }))
  }
  const setIsActive = (is_active: boolean) => {
    setForm((prev) => ({ ...prev, is_active }))
  }
  const setMetadataJson = (metadata_json: string) => {
    setForm((prev) => ({ ...prev, metadata_json }))
  }

  const onTypeChange = (type: ExerciseType) => {
    if (mode === 'edit') return
    setForm(createInitialFormState(type, lessonId, orderIndex))
    setFieldErrors([])
    setApiError(null)
  }

  const onReset = () => {
    if (mode === 'edit' && baseline) {
      setForm(formStateFromExercise(baseline))
    } else {
      setForm(createInitialFormState(form.type, lessonId, orderIndex))
    }
    setFieldErrors([])
    setApiError(null)
    setConflict(false)
    setFocusSummary(false)
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submittingRef.current) return

    const result = validateExerciseForm(form)
    if (!result.valid) {
      setFieldErrors(result.errors)
      setFocusSummary(true)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setApiError(null)
    setConflict(false)
    setPermissionDenied(false)
    setFieldErrors([])
    setFocusSummary(false)

    try {
      if (mode === 'create') {
        const payload = buildCreatePayload(form)
        const created = await createExercise(payload)
        onSaved(created)
        addToast({
          variant: 'success',
          title: 'Exercise created',
          description: `Exercise #${created.id} saved.`,
          priority: 'normal',
          duration: 4000,
        })
        setForm(formStateFromExercise(created))
      } else if (baseline) {
        const patch = buildPatchPayload(baseline, form)
        if (Object.keys(patch).length === 0) {
          submittingRef.current = false
          setSubmitting(false)
          return
        }
        const updated = await updateExercise(
          baseline.id,
          patch as Parameters<typeof updateExercise>[1],
        )
        onSaved(updated)
        addToast({
          variant: 'success',
          title: 'Exercise updated',
          description: `Exercise #${updated.id} saved.`,
          priority: 'normal',
          duration: 4000,
        })
        setForm(formStateFromExercise(updated))
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 403 || err.code === 'CONTENT_ADMIN_REQUIRED') {
          setPermissionDenied(true)
          setApiError(err.message)
        } else if (err.code === 'CONTENT_IN_ACTIVE_ATTEMPT') {
          setConflict(true)
          setApiError(
            'An active learner attempt currently uses this exercise. Your draft was preserved. Resolve or wait for the attempt, then retry.',
          )
        } else {
          setApiError(err.message)
        }
        setFocusSummary(true)
      } else {
        setApiError('Unable to reach the LingoQuest API.')
        setFocusSummary(true)
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <SurfaceCard className={cn('space-y-4 p-4 sm:p-5', className)}>
      <header className="space-y-1">
        <p className="text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
          {mode === 'create' ? 'Create exercise' : 'Edit exercise'}
        </p>
        <h2 className="text-lq-xl font-extrabold">
          {mode === 'edit' && baseline
            ? `Exercise #${baseline.id}`
            : 'New exercise'}
        </h2>
        <p className="text-lq-sm text-lq-text-secondary">{contextLabel}</p>
      </header>

      <AdminErrorSummary
        errors={fieldErrors}
        apiMessage={apiError}
        focusOnMount={focusSummary}
        title={
          conflict
            ? 'Active-attempt conflict'
            : permissionDenied
              ? 'Permission denied'
              : 'Please fix the following'
        }
      />

      {conflict ? (
        <div className="flex flex-wrap gap-2">
          <Button3D
            type="button"
            variant="secondary"
            onClick={() => setConflict(false)}
          >
            Keep draft
          </Button3D>
          <Button3D
            type="button"
            variant="primary"
            disabled={submitting}
            onClick={() => {
              const formEl = document.getElementById(formId)
              formEl?.dispatchEvent(
                new Event('submit', { cancelable: true, bubbles: true }),
              )
            }}
          >
            Retry save
          </Button3D>
        </div>
      ) : null}

      <form id={formId} noValidate className="space-y-4" onSubmit={onSubmit}>
        {mode === 'create' ? (
          <div className="space-y-1">
            <label htmlFor="admin-field-type" className="text-lq-sm font-bold">
              Exercise type
            </label>
            <select
              id="admin-field-type"
              value={form.type}
              onChange={(e) => onTypeChange(e.target.value as ExerciseType)}
              className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
            >
              {EXERCISE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {EXERCISE_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-lq-sm">
            Type:{' '}
            <strong>{EXERCISE_TYPE_LABELS[form.type]}</strong>{' '}
            <span className="text-lq-text-secondary">
              (changing type requires sending options and correct_answer
              together; prefer create for a new type)
            </span>
          </p>
        )}

        {form.type !== 'fill_blank' ? (
          <div className="space-y-1">
            <label htmlFor="admin-field-prompt" className="text-lq-sm font-bold">
              Prompt
            </label>
            <textarea
              id="admin-field-prompt"
              value={form.prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 py-2 text-lq-sm"
            />
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor="admin-field-order_index"
              className="text-lq-sm font-bold"
            >
              Order index
            </label>
            <input
              id="admin-field-order_index"
              type="number"
              min={0}
              step={1}
              value={form.order_index}
              onChange={(e) =>
                setOrderIndex(Number.parseInt(e.target.value, 10) || 0)
              }
              className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
            />
          </div>
          <div className="space-y-1">
            <label
              htmlFor="admin-field-is_active"
              className="text-lq-sm font-bold"
            >
              Active
            </label>
            <select
              id="admin-field-is_active"
              value={form.is_active ? 'true' : 'false'}
              onChange={(e) => setIsActive(e.target.value === 'true')}
              className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
            >
              <option value="true">Active</option>
              <option value="false">Inactive (supported removal)</option>
            </select>
          </div>
        </div>

        {form.type === 'multiple_choice' ? (
          <MultipleChoiceEditor
            options={form.options}
            correctOptionId={form.correct_answer.option_id}
            onChange={(next) =>
              setForm((prev) =>
                prev.type === 'multiple_choice'
                  ? { ...prev, ...next }
                  : prev,
              )
            }
          />
        ) : null}

        {form.type === 'translate_word_bank' ? (
          <WordBankEditor
            options={form.options}
            orderedIds={form.correct_answer.ordered_ids}
            onChange={(next) =>
              setForm((prev) =>
                prev.type === 'translate_word_bank'
                  ? { ...prev, ...next }
                  : prev,
              )
            }
          />
        ) : null}

        {form.type === 'match_pairs' ? (
          <MatchPairsEditor
            options={form.options}
            pairs={form.correct_answer.pairs}
            onChange={(next) =>
              setForm((prev) =>
                prev.type === 'match_pairs' ? { ...prev, ...next } : prev,
              )
            }
          />
        ) : null}

        {form.type === 'fill_blank' ? (
          <FillBlankEditor
            prompt={form.prompt}
            answerText={form.correct_answer.text}
            onPromptChange={(prompt) =>
              setForm((prev) =>
                prev.type === 'fill_blank' ? { ...prev, prompt } : prev,
              )
            }
            onAnswerChange={(text) =>
              setForm((prev) =>
                prev.type === 'fill_blank'
                  ? { ...prev, correct_answer: { text } }
                  : prev,
              )
            }
          />
        ) : null}

        {form.type === 'type_answer' ? (
          <TypeAnswerEditor
            accepted={form.correct_answer.accepted}
            onChange={(accepted) =>
              setForm((prev) =>
                prev.type === 'type_answer'
                  ? { ...prev, correct_answer: { accepted } }
                  : prev,
              )
            }
          />
        ) : null}

        <div className="space-y-1">
          <label htmlFor="admin-field-audio_url" className="text-lq-sm font-bold">
            Audio URL (optional)
          </label>
          <input
            id="admin-field-audio_url"
            type="url"
            value={form.audio_url ?? ''}
            onChange={(e) =>
              setAudioUrl(e.target.value.length === 0 ? null : e.target.value)
            }
            className="min-h-11 w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 text-lq-sm"
            placeholder="https://… (original or licensed audio only)"
          />
          <p className="text-lq-xs text-lq-text-secondary">
            Do not use Duolingo-hosted assets. Leave empty for null.
          </p>
        </div>

        <TtsFields
          ttsText={form.tts_text}
          ttsLang={form.tts_lang}
          onTtsTextChange={setTtsText}
          onTtsLangChange={setTtsLang}
        />

        <div className="space-y-1">
          <label htmlFor="admin-field-metadata" className="text-lq-sm font-bold">
            Metadata (JSON object, optional)
          </label>
          <textarea
            id="admin-field-metadata"
            value={form.metadata_json}
            onChange={(e) => setMetadataJson(e.target.value)}
            rows={4}
            spellCheck={false}
            className="w-full rounded-lq border-2 border-lq-border-default bg-lq-bg-surface px-3 py-2 font-mono text-lq-xs"
            placeholder='{"hint": "…"}'
          />
          <p className="text-lq-xs text-lq-text-secondary">
            Advanced field. Empty means null. Invalid JSON blocks save. Merged
            PATCH replaces metadata only when this field changes.
          </p>
        </div>

        <div
          className={cn(
            'sticky bottom-0 z-10 flex flex-col gap-2 border-t border-lq-border-default',
            'bg-lq-bg-surface/95 py-3 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between',
          )}
        >
          <p id={statusId} className="text-lq-xs text-lq-text-secondary" role="status">
            {submitting
              ? 'Saving…'
              : dirty
                ? 'Unsaved changes'
                : mode === 'create'
                  ? 'New exercise draft'
                  : 'No unsaved changes'}
          </p>
          <div className="flex flex-wrap gap-2">
            {mode === 'create' && onCancelCreate ? (
              <Button3D
                type="button"
                variant="ghost"
                onClick={onCancelCreate}
                disabled={submitting}
              >
                Cancel
              </Button3D>
            ) : null}
            <Button3D
              type="button"
              variant="secondary"
              onClick={onReset}
              disabled={submitting || (!dirty && mode === 'edit')}
            >
              Reset
            </Button3D>
            <Button3D
              type="submit"
              loading={submitting}
              disabled={!canSave}
              aria-describedby={statusId}
            >
              {mode === 'create' ? 'Create exercise' : 'Save changes'}
            </Button3D>
          </div>
        </div>
      </form>
    </SurfaceCard>
  )
}
