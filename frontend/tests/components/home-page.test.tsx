import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

import HomePage from '@/app/page'
import { mockCourse } from '@/tests/fixtures/phase9a'
import { useSessionStore } from '@/stores/session-store'

const getCourseMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/',
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
  }
})

describe('HomePage course loading', () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    useSessionStore.getState().reset()
  })

  it('loads course and learner data into the path', async () => {
    getCourseMock.mockResolvedValue(mockCourse)
    render(<HomePage />)

    expect(screen.getByLabelText('Loading learning path')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'First Steps' })).toBeInTheDocument()
    expect(screen.getByLabelText('4 of 5 hearts')).toBeInTheDocument()
    expect(screen.getByLabelText('340 total XP')).toBeInTheDocument()

    await waitFor(() => {
      expect(useSessionStore.getState().learner?.display_name).toBe('Maya')
    })
  })
})
