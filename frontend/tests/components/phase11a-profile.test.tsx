import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import ProfilePage from '@/app/profile/page'
import { ProfileView } from '@/components/profile/profile-view'
import { ApiError } from '@/lib/api/client'
import { formatProfileDate } from '@/lib/profile/format-date'
import { useSessionStore } from '@/stores/session-store'
import { mockCourse } from '@/tests/fixtures/phase9a'
import {
  mockAchievements,
  mockLongNameProfile,
  mockProfile,
} from '@/tests/fixtures/phase11a'

const getCourseMock = vi.fn()
const getCurrentUserMock = vi.fn()
const getAchievementsMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/profile',
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
    getCurrentUser: (...args: unknown[]) => getCurrentUserMock(...args),
    getAchievements: (...args: unknown[]) => getAchievementsMock(...args),
  }
})

describe('Phase 11A profile', () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    getCurrentUserMock.mockReset()
    getAchievementsMock.mockReset()
    useSessionStore.getState().reset()
    getCourseMock.mockResolvedValue(mockCourse)
    getCurrentUserMock.mockResolvedValue(mockProfile)
    getAchievementsMock.mockResolvedValue(mockAchievements)
  })

  it('renders exact API profile values without local streak/XP math', async () => {
    render(<ProfilePage />)

    expect(screen.getByLabelText('Loading profile')).toBeInTheDocument()

    expect(await screen.findByRole('heading', { name: 'Maya' })).toBeInTheDocument()
    expect(screen.getByText('@maya_demo')).toBeInTheDocument()
    expect(screen.getByText('Total XP').closest('div')?.querySelector('dd')).toHaveTextContent(
      '340',
    )
    expect(
      screen.getByText('Current streak').closest('div')?.querySelector('dd'),
    ).toHaveTextContent('6')
    expect(
      screen.getByText('Longest streak').closest('div')?.querySelector('dd'),
    ).toHaveTextContent('11')
    expect(screen.getByText('Hearts').closest('div')?.querySelector('dd')).toHaveTextContent(
      '4/5',
    )
    expect(screen.getByText('Gems').closest('div')?.querySelector('dd')).toHaveTextContent(
      '100',
    )
    expect(screen.getByText('10/20 XP')).toBeInTheDocument()
    expect(
      screen.getByText(formatProfileDate('2026-06-01T08:00:00Z')),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /edit settings/i })).toHaveAttribute(
      'href',
      '/settings',
    )

    await waitFor(() => {
      expect(useSessionStore.getState().learner?.total_xp).toBe(340)
      expect(useSessionStore.getState().learner?.current_streak).toBe(6)
    })
  })

  it('shows earned and locked achievements from the achievements API', async () => {
    render(<ProfilePage />)

    expect(await screen.findByText('First Steps')).toBeInTheDocument()
    expect(screen.getByText('XP Trailblazer')).toBeInTheDocument()
    expect(screen.getByText('Earned', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getAllByText('Not yet earned').length).toBeGreaterThan(0)
    expect(screen.getByText(/Progress 2 of 1/)).toBeInTheDocument()
    expect(screen.getByText(/Progress 340 of 500/)).toBeInTheDocument()
    expect(screen.getByText('Mystery Badge')).toBeInTheDocument()
  })

  it('supports loading error retry for GET profile', async () => {
    const user = userEvent.setup()
    getCurrentUserMock.mockRejectedValueOnce(
      new ApiError(503, 'SERVICE_UNAVAILABLE', 'Profile temporarily unavailable.'),
    )
    getCurrentUserMock.mockResolvedValueOnce(mockProfile)

    render(<ProfilePage />)

    expect(
      await screen.findByRole('heading', { name: 'Could not load profile' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Profile temporarily unavailable.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('heading', { name: 'Maya' })).toBeInTheDocument()
  })

  it('handles large and optional profile values accessibly', () => {
    render(
      <ProfileView
        profile={mockLongNameProfile}
        achievements={mockAchievements.achievements}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Maya Extremely-Long-Explorer-Name-For-Wrapping',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('1234567')).toBeInTheDocument()
    expect(screen.getByText('999')).toBeInTheDocument()
  })

  it('does not invent achievements from profile stats alone', () => {
    render(
      <ProfileView profile={mockProfile} achievements={[]} />,
    )

    expect(screen.getByText(/No achievements are available yet/i)).toBeInTheDocument()
    expect(screen.queryByText('First Steps')).not.toBeInTheDocument()
  })
})
