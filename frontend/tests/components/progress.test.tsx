import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProgressBar } from '@/components/ui/progress-bar'
import { ProgressRing } from '@/components/ui/progress-ring'

describe('ProgressBar', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressBar value={3} max={10} label="Lesson progress" />)
    const bar = screen.getByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '10')
    expect(bar).toHaveAttribute('aria-label', 'Lesson progress')
  })

  it('clamps value to min 0', () => {
    render(<ProgressBar value={-5} max={10} label="Progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })

  it('clamps value to max', () => {
    render(<ProgressBar value={15} max={10} label="Progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '10')
  })

  it('handles max=0 safely', () => {
    render(<ProgressBar value={5} max={0} label="Progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})

describe('ProgressRing', () => {
  it('renders with correct aria attributes', () => {
    render(<ProgressRing value={2} max={5} label="2 of 5 crowns" />)
    const ring = screen.getByRole('progressbar')
    expect(ring).toHaveAttribute('aria-valuenow', '2')
    expect(ring).toHaveAttribute('aria-valuemin', '0')
    expect(ring).toHaveAttribute('aria-valuemax', '5')
    expect(ring).toHaveAttribute('aria-label', '2 of 5 crowns')
  })

  it('clamps value within range', () => {
    render(<ProgressRing value={8} max={5} label="Crowns" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
  })
})
