import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import LeaderboardPage from '@/app/leaderboard/page'
import { LeaderboardView } from '@/components/leaderboard/leaderboard-view'
import { ApiError } from '@/lib/api/client'
import { useSessionStore } from '@/stores/session-store'
import { mockCourse } from '@/tests/fixtures/phase9a'
import {
  mockLeaderboard,
  mockLeaderboardFew,
  mockLeaderboardOutsideTop,
} from '@/tests/fixtures/phase11a'

const getCourseMock = vi.fn()
const getLeaderboardMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/leaderboard',
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
    getCourse: (...args: unknown[]) => getCourseMock(...args),
    getLeaderboard: (...args: unknown[]) => getLeaderboardMock(...args),
  }
})

describe('Phase 11A leaderboard', () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    getLeaderboardMock.mockReset()
    useSessionStore.getState().reset()
    getCourseMock.mockResolvedValue(mockCourse)
    getLeaderboardMock.mockResolvedValue(mockLeaderboard)
  })

  it('preserves backend order and rank numbers', async () => {
    render(<LeaderboardPage />)

    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument()
    expect(screen.getByText('Ranked by total XP')).toBeInTheDocument()

    const names = screen.getAllByText(/Leo|Asha|Maya|Noah/).map((node) => node.textContent)
    const leoIndex = names.findIndex((text) => text?.includes('Leo'))
    const ashaIndex = names.findIndex((text) => text?.includes('Asha'))
    const mayaIndex = names.findIndex((text) => text?.includes('Maya'))
    expect(leoIndex).toBeLessThan(ashaIndex)
    expect(ashaIndex).toBeLessThan(mayaIndex)

    expect(screen.getByLabelText('Rank 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Rank 3')).toBeInTheDocument()
    expect(screen.getByText('#3')).toBeInTheDocument()
  })

  it('highlights the current user accessibly', async () => {
    render(<LeaderboardPage />)
    await screen.findByRole('heading', { name: 'Leaderboard' })

    const currentRows = screen.getAllByRole('listitem').filter(
      (item) => item.getAttribute('aria-current') === 'true',
    )
    expect(currentRows.length).toBeGreaterThan(0)
    expect(within(currentRows[0]!).getByText(/Maya/)).toBeInTheDocument()
  })

  it('shows current user outside the top list when provided', () => {
    render(<LeaderboardView data={mockLeaderboardOutsideTop} />)

    expect(screen.getByText('Your standing')).toBeInTheDocument()
    expect(screen.getByText('#12')).toBeInTheDocument()
    expect(screen.getByLabelText('Rank 12')).toBeInTheDocument()
  })

  it('handles fewer than three users', () => {
    render(<LeaderboardView data={mockLeaderboardFew} />)

    expect(screen.getByText('Maya')).toBeInTheDocument()
    expect(screen.getByText('Leo')).toBeInTheDocument()
    expect(screen.queryByText('Asha')).not.toBeInTheDocument()
  })

  it('shows empty and error states with retry', async () => {
    const user = userEvent.setup()
    getLeaderboardMock.mockResolvedValueOnce({
      ranking_basis: 'total_xp',
      entries: [],
      current_user: mockLeaderboard.current_user,
    })

    const { unmount } = render(<LeaderboardPage />)
    expect(await screen.findByRole('heading', { name: 'No rankings yet' })).toBeInTheDocument()
    unmount()

    getLeaderboardMock.mockRejectedValueOnce(
      new ApiError(500, 'SERVER_ERROR', 'Leaderboard failed.'),
    )
    getLeaderboardMock.mockResolvedValueOnce(mockLeaderboard)

    render(<LeaderboardPage />)
    expect(
      await screen.findByRole('heading', { name: 'Could not load leaderboard' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument()
  })

  it('does not locally rerank entries', () => {
    const reversed = {
      ...mockLeaderboard,
      entries: [...mockLeaderboard.entries].reverse(),
    }
    render(<LeaderboardView data={reversed} />)

    const podium = screen.getByLabelText('Top ranked learners')
    const firstCard = within(podium).getAllByRole('listitem')[0]!
    expect(within(firstCard).getByText('Noah')).toBeInTheDocument()
    expect(within(firstCard).getByLabelText('Rank 4')).toBeInTheDocument()
  })
})
