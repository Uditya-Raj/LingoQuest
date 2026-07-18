import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button3D } from '@/components/ui/button-3d'

describe('Button3D', () => {
  it('renders with text content', () => {
    render(<Button3D>Click me</Button3D>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('renders primary variant by default', () => {
    render(<Button3D>Primary</Button3D>)
    const btn = screen.getByRole('button')
    expect(btn).not.toBeDisabled()
  })

  it.each(['primary', 'secondary', 'success', 'danger', 'timed', 'ghost'] as const)(
    'renders %s variant',
    (variant) => {
      render(<Button3D variant={variant}>{variant}</Button3D>)
      expect(screen.getByRole('button', { name: variant })).toBeInTheDocument()
    },
  )

  it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
    render(<Button3D size={size}>Button</Button3D>)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('disabled button cannot be activated', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button3D disabled onClick={() => { clicked = true }}>Disabled</Button3D>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    await user.click(btn)
    expect(clicked).toBe(false)
  })

  it('loading button is disabled and shows busy state', () => {
    render(<Button3D loading>Loading</Button3D>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Loading', { selector: '.sr-only' })).toBeInTheDocument()
  })

  it('responds to keyboard activation', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button3D onClick={() => { clicked = true }}>Press me</Button3D>)
    const btn = screen.getByRole('button')
    btn.focus()
    await user.keyboard('{Enter}')
    expect(clicked).toBe(true)
  })

  it('responds to Space key', async () => {
    const user = userEvent.setup()
    let clicked = false
    render(<Button3D onClick={() => { clicked = true }}>Space</Button3D>)
    const btn = screen.getByRole('button')
    btn.focus()
    await user.keyboard(' ')
    expect(clicked).toBe(true)
  })

  it('forwards className', () => {
    render(<Button3D className="my-custom-class">Styled</Button3D>)
    expect(screen.getByRole('button')).toHaveClass('my-custom-class')
  })
})
