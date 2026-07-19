import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SettingsPage from '@/app/settings/page'
import { ToastProvider } from '@/components/ui/toast'
import { ApiError } from '@/lib/api/client'
import { useSessionStore } from '@/stores/session-store'
import { useUIStore } from '@/stores/ui-store'
import { mockCourse } from '@/tests/fixtures/phase9a'
import { mockProfile } from '@/tests/fixtures/phase11a'

const getCourseMock = vi.fn()
const getCurrentUserMock = vi.fn()
const updateCurrentUserMock = vi.fn()
const getContentTreeMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/settings',
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
    updateCurrentUser: (...args: unknown[]) => updateCurrentUserMock(...args),
    getContentTree: (...args: unknown[]) => getContentTreeMock(...args),
  }
})

function renderSettings() {
  return render(
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>,
  )
}

describe('Phase 11A settings', () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    getCurrentUserMock.mockReset()
    updateCurrentUserMock.mockReset()
    getContentTreeMock.mockReset()
    useSessionStore.getState().reset()
    useUIStore.setState({ theme: 'light' })
    getCourseMock.mockResolvedValue(mockCourse)
    getCurrentUserMock.mockResolvedValue(mockProfile)
    getContentTreeMock.mockRejectedValue(
      new ApiError(403, 'CONTENT_ADMIN_REQUIRED', 'Admin required'),
    )
  })

  it('initializes fields from GET /user/me and tracks dirty state', async () => {
    const user = userEvent.setup()
    renderSettings()

    const nameInput = await screen.findByLabelText('Display name')
    const goalInput = screen.getByLabelText('Daily goal (XP)')
    const save = screen.getByRole('button', { name: 'Save changes' })

    expect(nameInput).toHaveValue('Maya')
    expect(goalInput).toHaveValue(20)
    expect(save).toBeDisabled()
    expect(screen.getByText('No unsaved changes')).toBeInTheDocument()

    await user.clear(nameInput)
    await user.type(nameInput, 'Maya Quest')
    expect(save).toBeEnabled()
  })

  it('sends exact PATCH payload and applies the response', async () => {
    const user = userEvent.setup()
    updateCurrentUserMock.mockResolvedValue({
      display_name: 'Maya Quest',
      daily_goal_xp: 30,
      today_xp: 10,
      daily_goal_progress: 0.3333,
    })

    renderSettings()

    const nameInput = await screen.findByLabelText('Display name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Maya Quest')
    await user.click(screen.getByRole('button', { name: '30' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => {
      expect(updateCurrentUserMock).toHaveBeenCalledTimes(1)
    })
    expect(updateCurrentUserMock).toHaveBeenCalledWith({
      display_name: 'Maya Quest',
      daily_goal_xp: 30,
    })

    await waitFor(() => {
      expect(useSessionStore.getState().learner?.display_name).toBe('Maya Quest')
      expect(useSessionStore.getState().learner?.daily_goal_xp).toBe(30)
      expect(useSessionStore.getState().learner?.today_xp).toBe(10)
      expect(useSessionStore.getState().learner?.daily_goal_progress).toBe(0.3333)
    })

    expect(await screen.findByText('Settings saved')).toBeInTheDocument()
    expect(screen.getByLabelText('Display name')).toHaveValue('Maya Quest')
  })

  it('prevents duplicate save and preserves draft on failed PATCH', async () => {
    const user = userEvent.setup()
    let resolvePatch!: (value: {
      display_name: string
      daily_goal_xp: number
      today_xp: number
      daily_goal_progress: number
    }) => void
    updateCurrentUserMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolvePatch = resolve
        }),
    )

    renderSettings()
    const nameInput = await screen.findByLabelText('Display name')
    await user.clear(nameInput)
    await user.type(nameInput, 'Draft Name')

    const save = screen.getByRole('button', { name: 'Save changes' })
    await user.click(save)
    await user.click(save)
    expect(updateCurrentUserMock).toHaveBeenCalledTimes(1)

    resolvePatch({
      display_name: 'Draft Name',
      daily_goal_xp: 20,
      today_xp: 10,
      daily_goal_progress: 0.5,
    })
    await waitFor(() => {
      expect(screen.getByLabelText('Display name')).toHaveValue('Draft Name')
    })

    updateCurrentUserMock.mockRejectedValueOnce(
      new ApiError(422, 'VALIDATION_ERROR', 'Display name is invalid.'),
    )
    await user.clear(screen.getByLabelText('Display name'))
    await user.type(screen.getByLabelText('Display name'), 'Kept Draft')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Display name is invalid.')).toBeInTheDocument()
    expect(screen.getByLabelText('Display name')).toHaveValue('Kept Draft')
  })

  it('validates daily goal bounds', async () => {
    const user = userEvent.setup()
    renderSettings()

    const goalInput = await screen.findByLabelText('Daily goal (XP)')
    await user.clear(goalInput)
    await user.type(goalInput, '2')

    expect(
      screen.getByText('Daily goal must be between 5 and 100 XP.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(updateCurrentUserMock).not.toHaveBeenCalled()
  })

  it('exposes theme preference without persisting learner data', async () => {
    const user = userEvent.setup()
    renderSettings()
    await screen.findByLabelText('Display name')

    await user.click(screen.getByRole('radio', { name: 'Dark theme' }))
    expect(useUIStore.getState().theme).toBe('dark')

    const persistedUi = window.localStorage.getItem('lingoquest-ui')
    expect(persistedUi).toContain('dark')
    expect(persistedUi).not.toContain('total_xp')
    expect(persistedUi).not.toContain('daily_goal')
    expect(window.localStorage.getItem('lingoquest-session')).toBeNull()
  })

  it('renders Coming Soon placeholders without API calls', async () => {
    renderSettings()
    await screen.findByLabelText('Display name')

    expect(screen.getByRole('heading', { name: 'Coming Soon' })).toBeInTheDocument()
    expect(screen.getByText(/Pronunciation practice/i)).toBeInTheDocument()
    expect(screen.getByText(/Super & in-app purchases/i)).toBeInTheDocument()
    expect(screen.getByText(/Friends & social/i)).toBeInTheDocument()
    expect(screen.getByText(/More languages/i)).toBeInTheDocument()
    expect(updateCurrentUserMock).not.toHaveBeenCalled()
  })
})
