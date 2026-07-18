import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal } from '@/components/ui/modal'

describe('Modal', () => {
  it('renders children when open', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>Modal content</p>
      </Modal>,
    )
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>Hidden content</p>
      </Modal>,
    )
    expect(screen.queryByText('Hidden content')).not.toBeInTheDocument()
  })

  it('has dialog role with aria-modal', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>Dialog</p>
      </Modal>,
    )
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('calls onClose when Escape is pressed and dismissible', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} dismissible>
        <button>Focus target</button>
      </Modal>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose on Escape when non-dismissible', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <Modal open onClose={onClose} dismissible={false}>
        <button>Focus target</button>
      </Modal>,
    )
    await user.keyboard('{Escape}')
    expect(onClose).not.toHaveBeenCalled()
  })

  it('focuses the first focusable element on open', async () => {
    render(
      <Modal open onClose={() => {}}>
        <button>First button</button>
        <button>Second button</button>
      </Modal>,
    )
    await waitFor(() => {
      expect(screen.getByText('First button')).toHaveFocus()
    })
  })

  it('traps focus within the modal', async () => {
    const user = userEvent.setup()
    render(
      <Modal open onClose={() => {}}>
        <button>First</button>
        <button>Last</button>
      </Modal>,
    )

    await waitFor(() => {
      expect(screen.getByText('First')).toHaveFocus()
    })

    await user.tab()
    expect(screen.getByText('Last')).toHaveFocus()

    await user.tab()
    expect(screen.getByText('First')).toHaveFocus()
  })
})
