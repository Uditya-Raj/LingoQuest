import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SkillDetailView } from '@/components/skill/skill-detail'
import { ApiError } from '@/lib/api/client'
import {
  mockAttempt,
  mockLearner,
  mockSkillDetail,
} from '@/tests/fixtures/phase9a'
import { useSessionStore } from '@/stores/session-store'

const pushMock = vi.fn()
const getSkillMock = vi.fn()
const startLessonMock = vi.fn()
const startTimedMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => '/skill/3',
}))

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
    getSkill: (...args: unknown[]) => getSkillMock(...args),
    startLesson: (...args: unknown[]) => startLessonMock(...args),
    startTimedPractice: (...args: unknown[]) => startTimedMock(...args),
  }
})

describe('SkillDetailView', () => {
  beforeEach(() => {
    pushMock.mockReset()
    getSkillMock.mockReset()
    startLessonMock.mockReset()
    startTimedMock.mockReset()
    useSessionStore.getState().reset()
    useSessionStore.getState().setLearner(mockLearner)
  })

  it('loads skill detail from the API', async () => {
    getSkillMock.mockResolvedValue(mockSkillDetail())
    render(<SkillDetailView skillId={3} />)

    expect(screen.getByLabelText('Loading skill details')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Food' })).toBeInTheDocument()
    expect(screen.getByText('2 / 5')).toBeInTheDocument()
    expect(getSkillMock).toHaveBeenCalledWith(3, expect.any(AbortSignal))
  })

  it('shows 404 state for unknown skills', async () => {
    getSkillMock.mockRejectedValue(
      new ApiError(404, 'SKILL_NOT_FOUND', 'Skill not found'),
    )
    render(<SkillDetailView skillId={999} />)

    expect(
      await screen.findByRole('heading', { name: 'Skill not found' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to learning path/i })).toBeInTheDocument()
  })

  it('shows error state with retry', async () => {
    const user = userEvent.setup()
    getSkillMock
      .mockRejectedValueOnce(new ApiError(500, 'SERVER_ERROR', 'Boom'))
      .mockResolvedValueOnce(mockSkillDetail())

    render(<SkillDetailView skillId={3} />)
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Food' })).toBeInTheDocument()
  })

  it('starts a standard lesson and navigates with backend attempt id', async () => {
    const user = userEvent.setup()
    getSkillMock.mockResolvedValue(mockSkillDetail())
    startLessonMock.mockResolvedValue(mockAttempt({ attempt_id: 4242, resumed: false }))

    render(<SkillDetailView skillId={3} />)
    await screen.findByRole('heading', { name: 'Food' })

    await user.click(screen.getByRole('button', { name: 'Start Lesson' }))
    await waitFor(() => {
      expect(startLessonMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/lesson/4242')
    })
  })

  it('resumes using Resume Lesson label when an active attempt exists', async () => {
    const user = userEvent.setup()
    getSkillMock.mockResolvedValue(
      mockSkillDetail({
        active_attempt: {
          id: 55,
          current_index: 2,
          total_exercises: 10,
          started_at: '2026-07-18T10:00:00Z',
        },
      }),
    )
    startLessonMock.mockResolvedValue(
      mockAttempt({ attempt_id: 55, resumed: true, current_index: 2 }),
    )

    render(<SkillDetailView skillId={3} />)
    await screen.findByRole('heading', { name: 'Food' })
    expect(screen.getByText(/exercise 3 of 10/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Resume Lesson' }))
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/lesson/55')
    })
  })

  it('prevents duplicate start clicks while pending', async () => {
    const user = userEvent.setup()
    getSkillMock.mockResolvedValue(mockSkillDetail())
    let resolveStart: (value: unknown) => void = () => {}
    startLessonMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveStart = resolve
        }),
    )

    render(<SkillDetailView skillId={3} />)
    await screen.findByRole('heading', { name: 'Food' })

    const button = screen.getByRole('button', { name: 'Start Lesson' })
    await user.click(button)
    await user.click(button)

    expect(startLessonMock).toHaveBeenCalledTimes(1)
    resolveStart(mockAttempt({ attempt_id: 7 }))
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/lesson/7'))
  })

  it('starts timed practice without fabricating attempt ids', async () => {
    const user = userEvent.setup()
    getSkillMock.mockResolvedValue(mockSkillDetail())
    startTimedMock.mockResolvedValue(
      mockAttempt({ attempt_id: 777, mode: 'timed', resumed: false }),
    )

    render(<SkillDetailView skillId={3} />)
    await screen.findByRole('heading', { name: 'Food' })

    await user.click(screen.getByRole('button', { name: 'Timed Practice' }))
    await waitFor(() => {
      expect(startTimedMock).toHaveBeenCalledTimes(1)
      expect(pushMock).toHaveBeenCalledWith('/lesson/777')
    })
  })

  it('surfaces backend start errors accessibly', async () => {
    const user = userEvent.setup()
    getSkillMock.mockResolvedValue(mockSkillDetail())
    startLessonMock.mockRejectedValue(
      new ApiError(409, 'OUT_OF_HEARTS', 'You need hearts to start this lesson.'),
    )

    render(<SkillDetailView skillId={3} />)
    await screen.findByRole('heading', { name: 'Food' })
    await user.click(screen.getByRole('button', { name: 'Start Lesson' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('OUT_OF_HEARTS')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'You need hearts to start this lesson.',
    )
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('hides start actions for locked skills', async () => {
    getSkillMock.mockResolvedValue(
      mockSkillDetail({
        skill: {
          id: 5,
          title: 'Questions',
          description: 'Form basic questions.',
          icon: 'question-bubble',
          status: 'locked',
          crowns: 0,
          max_level: 5,
          prerequisite: { id: 4, title: 'Family', satisfied: false },
        },
        can_start: false,
        blocked_reason: 'Complete Family first.',
      }),
    )

    render(<SkillDetailView skillId={5} />)
    expect(await screen.findByRole('heading', { name: 'Questions' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Start Lesson/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Timed Practice/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Complete Family first/i)).toBeInTheDocument()
  })
})
