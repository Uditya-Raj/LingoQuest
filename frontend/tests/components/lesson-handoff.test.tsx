import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import { LessonHandoff } from '@/components/lesson/lesson-handoff'
import { ApiError } from '@/lib/api/client'
import { mockAttempt } from '@/tests/fixtures/phase9a'
import { useSessionStore } from '@/stores/session-store'

const getAttemptMock = vi.fn()

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
  } & React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return {
    ...actual,
    getAttempt: (...args: unknown[]) => getAttemptMock(...args),
  }
})

describe('LessonHandoff', () => {
  beforeEach(() => {
    getAttemptMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('retrieves the persisted attempt and shows mode and exercise count', async () => {
    getAttemptMock.mockResolvedValue(
      mockAttempt({ attempt_id: 42, mode: 'standard', total_exercises: 10 }),
    )

    render(<LessonHandoff attemptId={42} />)
    expect(screen.getByLabelText('Loading lesson attempt')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByText('Standard lesson')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText(/Attempt #42 retrieved successfully/i)).toBeInTheDocument()
    expect(getAttemptMock).toHaveBeenCalledWith(42, expect.any(AbortSignal))
  })

  it('provides return-to-path navigation', async () => {
    getAttemptMock.mockResolvedValue(mockAttempt())
    render(<LessonHandoff attemptId={1} />)
    expect(await screen.findByRole('link', { name: /Return to learning path/i })).toHaveAttribute(
      'href',
      '/',
    )
  })

  it('never renders correct_answer from public exercises', async () => {
    const attempt = mockAttempt()
    getAttemptMock.mockResolvedValue(attempt)
    const { container } = render(<LessonHandoff attemptId={1} />)
    await screen.findByRole('heading', { name: 'Food' })

    expect(container.innerHTML).not.toContain('correct_answer')
    for (const exercise of attempt.exercises) {
      expect(exercise).not.toHaveProperty('correct_answer')
    }
  })

  it('shows not-found state', async () => {
    getAttemptMock.mockRejectedValue(
      new ApiError(404, 'ATTEMPT_NOT_FOUND', 'Attempt not found'),
    )
    render(<LessonHandoff attemptId={999} />)
    expect(await screen.findByRole('heading', { name: 'Attempt not found' })).toBeInTheDocument()
  })

  it('caches the retrieved attempt in the session store', async () => {
    getAttemptMock.mockResolvedValue(mockAttempt({ attempt_id: 88 }))
    render(<LessonHandoff attemptId={88} />)
    await waitFor(() => {
      expect(useSessionStore.getState().attempt?.attempt_id).toBe(88)
    })
  })
})
