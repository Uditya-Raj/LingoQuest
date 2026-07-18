import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { LearningPath } from '@/components/path/learning-path'
import { SkillNode } from '@/components/path/skill-node'
import { GamificationBar } from '@/components/layout/gamification-bar'
import { DesktopNav } from '@/components/layout/desktop-nav'
import { MobileNav } from '@/components/layout/mobile-nav'
import { mockCourse, mockLearner } from '@/tests/fixtures/phase9a'

const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
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

describe('GamificationBar', () => {
  it('renders backend learner values exactly', () => {
    render(<GamificationBar learner={mockLearner} />)
    expect(screen.getByLabelText('4 of 5 hearts')).toHaveTextContent('4/5')
    expect(screen.getByLabelText('6 day streak')).toHaveTextContent('6')
    expect(screen.getByLabelText('340 total XP')).toHaveTextContent('340')
    expect(screen.getByLabelText('100 gems')).toHaveTextContent('100')
  })

  it('shows skeleton while loading without hardcoded Maya values', () => {
    render(<GamificationBar learner={null} loading />)
    expect(screen.getByLabelText('Loading learner stats')).toBeInTheDocument()
    expect(screen.queryByText('340')).not.toBeInTheDocument()
  })
})

describe('LearningPath', () => {
  it('renders units and all four skill states from API data', () => {
    render(<LearningPath course={mockCourse} />)

    expect(screen.getByRole('heading', { name: 'First Steps' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Everyday Life' })).toBeInTheDocument()

    expect(
      screen.getByRole('link', { name: /Greetings, completed, 5 of 5 crowns/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Food, in progress, 2 of 5 crowns/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Family, available, 0 of 5 crowns/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /Questions, locked, 0 of 5 crowns/i }),
    ).toBeInTheDocument()
  })

  it('renders backend crown values exactly', () => {
    render(<LearningPath course={mockCourse} />)
    expect(screen.getAllByLabelText('5 of 5 crowns').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByLabelText('2 of 5 crowns').length).toBeGreaterThanOrEqual(1)
  })

  it('does not navigate locked nodes and shows locked feedback', async () => {
    const user = userEvent.setup()
    render(<LearningPath course={mockCourse} />)

    const locked = screen.getByRole('button', {
      name: /Questions, locked, 0 of 5 crowns/i,
    })
    expect(locked).toHaveAttribute('aria-disabled', 'true')
    await user.click(locked)

    expect(
      screen.getByText(/Questions is locked/i),
    ).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Questions/i })).not.toBeInTheDocument()
  })

  it('links available and in-progress nodes to skill detail', () => {
    render(<LearningPath course={mockCourse} />)
    expect(
      screen.getByRole('link', { name: /Food, in progress/i }),
    ).toHaveAttribute('href', '/skill/3')
    expect(
      screen.getByRole('link', { name: /Family, available/i }),
    ).toHaveAttribute('href', '/skill/4')
  })
})

describe('SkillNode locked behavior', () => {
  it('does not call start APIs when activated', async () => {
    const user = userEvent.setup()
    const onLocked = vi.fn()
    const lockedSkill = mockCourse.units[2].skills[0]

    render(
      <SkillNode
        skill={lockedSkill}
        pathIndex={4}
        isCurrent={false}
        onLockedActivate={onLocked}
      />,
    )

    await user.click(screen.getByRole('button', { name: /locked/i }))
    expect(onLocked).toHaveBeenCalledTimes(1)
    expect(onLocked).toHaveBeenCalledWith(lockedSkill)
  })
})

describe('responsive navigation semantics', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('marks Learn as the active page on desktop nav', () => {
    render(<DesktopNav />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    const learn = within(nav).getByRole('link', { name: 'Learn' })
    expect(learn).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Profile' })).not.toHaveAttribute(
      'aria-current',
    )
  })

  it('renders four mobile destinations without design-system links', () => {
    render(<MobileNav />)
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).getAllByRole('link')).toHaveLength(4)
    expect(screen.queryByText(/design.system/i)).not.toBeInTheDocument()
  })
})

describe('no local gamification arithmetic', () => {
  it('displays hearts and XP from props without incrementing', async () => {
    const { rerender } = render(<GamificationBar learner={mockLearner} />)
    expect(screen.getByLabelText('4 of 5 hearts')).toBeInTheDocument()
    expect(screen.getByLabelText('340 total XP')).toBeInTheDocument()

    rerender(
      <GamificationBar
        learner={{ ...mockLearner, hearts: 3, total_xp: 350 }}
      />,
    )
    await waitFor(() => {
      expect(screen.getByLabelText('3 of 5 hearts')).toBeInTheDocument()
      expect(screen.getByLabelText('350 total XP')).toBeInTheDocument()
    })
  })
})
