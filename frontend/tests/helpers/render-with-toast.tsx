import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'

import { ToastProvider } from '@/components/ui/toast'

export function renderWithToast(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return render(ui, {
    ...options,
    wrapper: ({ children }) => <ToastProvider>{children}</ToastProvider>,
  })
}
