import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QuestMascot } from '@/components/ui/quest-mascot'

describe('QuestMascot', () => {
  it('is decorative by default (hidden from assistive tech)', () => {
    const { container } = render(<QuestMascot />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
    expect(svg).toHaveAttribute('role', 'presentation')
  })

  it('has img role and label when not decorative', () => {
    const { container } = render(
      <QuestMascot decorative={false} label="Quest celebrating" />,
    )
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('role', 'img')
    expect(svg).toHaveAttribute('aria-label', 'Quest celebrating')
    expect(svg).not.toHaveAttribute('aria-hidden')
  })

  it.each(['neutral', 'encouraging', 'celebrating', 'concerned'] as const)(
    'renders %s variant without errors',
    (variant) => {
      const { container } = render(<QuestMascot variant={variant} />)
      expect(container.querySelector('svg')).toBeInTheDocument()
    },
  )

  it('respects custom size', () => {
    const { container } = render(<QuestMascot size={120} />)
    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '120')
    expect(svg).toHaveAttribute('height', '120')
  })
})
