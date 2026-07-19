'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'

import { Button3D } from '@/components/ui/button-3d'
import { SurfaceCard } from '@/components/ui/surface-card'
import { useToast } from '@/components/ui/toast'
import { ApiError, updateCurrentUser } from '@/lib/api'
import type { ProfileResponse, UserPatchRequest } from '@/lib/contracts/user'
import { useSessionStore } from '@/stores/session-store'
import { cn } from '@/lib/utils'

const DISPLAY_NAME_MIN = 1
const DISPLAY_NAME_MAX = 50
const DAILY_GOAL_MIN = 5
const DAILY_GOAL_MAX = 100
const DAILY_GOAL_PRESETS = [10, 20, 30, 50] as const

interface SettingsFormProps {
  profile: ProfileResponse
  className?: string
}

function validateDisplayName(value: string): string | null {
  const trimmed = value.trim()
  if (trimmed.length < DISPLAY_NAME_MIN) {
    return 'Display name is required.'
  }
  if (trimmed.length > DISPLAY_NAME_MAX) {
    return `Display name must be ${DISPLAY_NAME_MAX} characters or fewer.`
  }
  return null
}

function validateDailyGoal(value: number): string | null {
  if (!Number.isInteger(value)) {
    return 'Daily goal must be a whole number.'
  }
  if (value < DAILY_GOAL_MIN || value > DAILY_GOAL_MAX) {
    return `Daily goal must be between ${DAILY_GOAL_MIN} and ${DAILY_GOAL_MAX} XP.`
  }
  return null
}

/**
 * Working display_name + daily_goal_xp editor via PATCH /user/me.
 */
export function SettingsForm({ profile, className }: SettingsFormProps) {
  const formId = useId()
  const nameId = `${formId}-display-name`
  const goalId = `${formId}-daily-goal`
  const nameErrorId = `${formId}-display-name-error`
  const goalErrorId = `${formId}-daily-goal-error`
  const statusId = `${formId}-status`

  const applyUserPatch = useSessionStore((s) => s.applyUserPatch)
  const { addToast } = useToast()

  const [displayName, setDisplayName] = useState(profile.user.display_name)
  const [dailyGoalXp, setDailyGoalXp] = useState(profile.stats.daily_goal_xp)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    setDisplayName(profile.user.display_name)
    setDailyGoalXp(profile.stats.daily_goal_xp)
  }, [profile.user.display_name, profile.stats.daily_goal_xp])

  const nameError = validateDisplayName(displayName)
  const goalError = validateDailyGoal(dailyGoalXp)

  const dirty = useMemo(() => {
    return (
      displayName.trim() !== profile.user.display_name.trim() ||
      dailyGoalXp !== profile.stats.daily_goal_xp
    )
  }, [
    dailyGoalXp,
    displayName,
    profile.stats.daily_goal_xp,
    profile.user.display_name,
  ])

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  const canSave = dirty && !nameError && !goalError && !submitting

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave || submittingRef.current) return

    const nextName = displayName.trim()
    const payload: UserPatchRequest = {}
    if (nextName !== profile.user.display_name.trim()) {
      payload.display_name = nextName
    }
    if (dailyGoalXp !== profile.stats.daily_goal_xp) {
      payload.daily_goal_xp = dailyGoalXp
    }
    if (Object.keys(payload).length === 0) return

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)

    try {
      const response = await updateCurrentUser(payload)
      applyUserPatch(response)
      setDisplayName(response.display_name)
      setDailyGoalXp(response.daily_goal_xp)
      addToast({
        variant: 'success',
        title: 'Settings saved',
        description: 'Your profile preferences were updated.',
        priority: 'normal',
        duration: 3000,
      })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Unable to save settings. Check your connection and try again.')
      }
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <SurfaceCard className={cn('p-5 sm:p-6', className)}>
      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div>
          <h2 className="text-lq-lg font-extrabold">Learner profile</h2>
          <p className="mt-1 text-lq-sm text-lq-text-secondary">
            Changes save to the LingoQuest backend. Progress stats stay
            server-owned.
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor={nameId} className="block text-lq-sm font-bold">
            Display name
          </label>
          <input
            id={nameId}
            name="display_name"
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            maxLength={DISPLAY_NAME_MAX}
            autoComplete="nickname"
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? nameErrorId : undefined}
            className={cn(
              'min-h-11 w-full rounded-lq border-2 border-lq-border-default',
              'bg-lq-bg-surface px-3 py-2',
              'text-lq-base font-semibold text-lq-text-primary',
              'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
              nameError && dirty && 'border-lq-error',
            )}
          />
          {nameError && dirty ? (
            <p id={nameErrorId} className="text-lq-sm text-lq-error" role="alert">
              {nameError}
            </p>
          ) : (
            <p className="text-lq-xs text-lq-text-secondary">
              1–50 characters after trimming.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor={goalId} className="block text-lq-sm font-bold">
            Daily goal (XP)
          </label>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Daily goal presets"
          >
            {DAILY_GOAL_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setDailyGoalXp(preset)}
                className={cn(
                  'min-h-11 min-w-11 rounded-lq px-3',
                  'border-2 border-lq-border-default',
                  'text-lq-sm font-bold',
                  'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
                  dailyGoalXp === preset
                    ? 'border-lq-primary bg-lq-primary/15 text-lq-primary'
                    : 'bg-lq-bg-surface text-lq-text-secondary',
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <input
            id={goalId}
            name="daily_goal_xp"
            type="number"
            inputMode="numeric"
            min={DAILY_GOAL_MIN}
            max={DAILY_GOAL_MAX}
            step={1}
            value={Number.isNaN(dailyGoalXp) ? '' : dailyGoalXp}
            onChange={(event) => {
              const next = Number(event.target.value)
              setDailyGoalXp(Number.isNaN(next) ? Number.NaN : next)
            }}
            aria-invalid={goalError ? true : undefined}
            aria-describedby={goalError ? goalErrorId : undefined}
            className={cn(
              'min-h-11 w-full rounded-lq border-2 border-lq-border-default',
              'bg-lq-bg-surface px-3 py-2',
              'text-lq-base font-semibold tabular-nums text-lq-text-primary',
              'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
              goalError && 'border-lq-error',
            )}
          />
          {goalError ? (
            <p id={goalErrorId} className="text-lq-sm text-lq-error" role="alert">
              {goalError}
            </p>
          ) : (
            <p className="text-lq-xs text-lq-text-secondary">
              Choose {DAILY_GOAL_MIN}–{DAILY_GOAL_MAX} XP. Today’s XP does not
              change when you edit the goal.
            </p>
          )}
        </div>

        {formError ? (
          <p id={statusId} className="text-lq-sm text-lq-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button3D
            type="submit"
            variant="primary"
            loading={submitting}
            disabled={!canSave}
          >
            Save changes
          </Button3D>
          {!dirty ? (
            <p className="text-lq-sm text-lq-text-secondary" aria-live="polite">
              No unsaved changes
            </p>
          ) : null}
        </div>
      </form>
    </SurfaceCard>
  )
}
