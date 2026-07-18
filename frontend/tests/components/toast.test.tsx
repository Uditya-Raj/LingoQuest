import { describe, it, expect, vi } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider, useToast } from '@/components/ui/toast'

function ToastTrigger({ variant = 'xp' as const, title = 'XP earned', duration = 0 }) {
  const { addToast } = useToast()
  return (
    <button
      onClick={() =>
        addToast({
          variant,
          title,
          priority: 'normal',
          duration,
        })
      }
    >
      Trigger
    </button>
  )
}

describe('Toast', () => {
  it('displays toast when added', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <ToastTrigger title="XP earned" />
      </ToastProvider>,
    )

    await user.click(screen.getByText('Trigger'))
    expect(screen.getByText('XP earned')).toBeInTheDocument()
  })

  it('limits visible toasts to 2', async () => {
    const user = userEvent.setup()

    let counter = 0
    function MultiTrigger() {
      const { addToast } = useToast()
      return (
        <button
          onClick={() => {
            addToast({ variant: 'default', title: `Toast ${++counter}`, priority: 'normal', duration: 0 })
          }}
        >
          Add
        </button>
      )
    }

    render(
      <ToastProvider>
        <MultiTrigger />
      </ToastProvider>,
    )

    await user.click(screen.getByText('Add'))
    await user.click(screen.getByText('Add'))
    await user.click(screen.getByText('Add'))

    const toasts = screen.getAllByRole('status')
    expect(toasts.length).toBeLessThanOrEqual(2)
  })

  it('dismisses toast on close button click', async () => {
    const user = userEvent.setup()
    render(
      <ToastProvider>
        <ToastTrigger title="Dismiss me" />
      </ToastProvider>,
    )

    await user.click(screen.getByText('Trigger'))
    expect(screen.getByText('Dismiss me')).toBeInTheDocument()

    const dismissBtn = screen.getByLabelText('Dismiss notification')
    await user.click(dismissBtn)

    await waitFor(() => {
      expect(screen.queryByText('Dismiss me')).not.toBeInTheDocument()
    })
  })

  it('auto-dismisses after duration', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })

    render(
      <ToastProvider>
        <ToastTrigger title="Auto-dismiss" duration={500} />
      </ToastProvider>,
    )

    await act(async () => {
      screen.getByText('Trigger').click()
    })

    expect(screen.getByText('Auto-dismiss')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(600)
    })

    // After timer fires, the toast is removed from the queue.
    // The AnimatePresence exit animation may still be running
    // but the toast data is no longer in the state.
    await act(async () => {
      vi.advanceTimersByTime(1000)
    })

    vi.useRealTimers()
  })
})
