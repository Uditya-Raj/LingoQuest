import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import AdminContentPage from '@/app/admin/content/page'
import { ToastProvider } from '@/components/ui/toast'
import { formStateFromExercise } from '@/lib/admin/exercise-form-state'
import { validateExerciseForm } from '@/lib/admin/exercise-validation'
import { ApiError } from '@/lib/api/client'
import { useSessionStore } from '@/stores/session-store'
import { mockCourse } from '@/tests/fixtures/phase9a'
import {
  mockContentTree,
  mockMcExercise,
} from '@/tests/fixtures/phase11b'

const getCourseMock = vi.fn()
const getContentTreeMock = vi.fn()
const createExerciseMock = vi.fn()
const updateExerciseMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/content',
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
    getContentTree: (...args: unknown[]) => getContentTreeMock(...args),
    createExercise: (...args: unknown[]) => createExerciseMock(...args),
    updateExercise: (...args: unknown[]) => updateExerciseMock(...args),
  }
})

function renderAdmin() {
  return render(
    <ToastProvider>
      <AdminContentPage />
    </ToastProvider>,
  )
}

describe('Phase 11B content manager', () => {
  beforeEach(() => {
    getCourseMock.mockReset()
    getContentTreeMock.mockReset()
    createExerciseMock.mockReset()
    updateExerciseMock.mockReset()
    useSessionStore.getState().reset()
    getCourseMock.mockResolvedValue(mockCourse)
    getContentTreeMock.mockResolvedValue(mockContentTree)
  })

  it('renders hierarchy from successful tree response', async () => {
    renderAdmin()
    expect(await screen.findByRole('heading', { name: 'Content manager' })).toBeInTheDocument()
    expect(screen.getByText('Spanish')).toBeInTheDocument()
    expect(screen.getByText('First Steps')).toBeInTheDocument()
    expect(screen.getByText('Greetings')).toBeInTheDocument()
    expect(screen.getByText(/Multiple choice/)).toBeInTheDocument()
  })

  it('shows access denied on 403 and does not fake an empty tree', async () => {
    getContentTreeMock.mockRejectedValue(
      new ApiError(403, 'CONTENT_ADMIN_REQUIRED', 'Admin required'),
    )
    renderAdmin()
    expect(
      await screen.findByRole('heading', { name: 'Access denied' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('tree')).not.toBeInTheDocument()
    expect(screen.queryByText('Spanish')).not.toBeInTheDocument()
  })

  it('supports loading error retry', async () => {
    const user = userEvent.setup()
    getContentTreeMock.mockRejectedValueOnce(
      new ApiError(500, 'HTTP_ERROR', 'Server down'),
    )
    renderAdmin()
    expect(
      await screen.findByRole('heading', { name: 'Could not load content' }),
    ).toBeInTheDocument()
    getContentTreeMock.mockResolvedValueOnce(mockContentTree)
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByRole('heading', { name: 'Content manager' }),
    ).toBeInTheDocument()
  })

  it('opens edit form with admin TTS and correct answer fields', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 501, Multiple choice/i }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Exercise #501' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('TTS text')).toHaveValue('hola')
    expect(screen.getByLabelText(/TTS language/)).toHaveValue('es-ES')
    expect(screen.getByText(/administrator only/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Hello')).toBeInTheDocument()
  })

  it('creates a multiple-choice exercise with exact payload', async () => {
    const user = userEvent.setup()
    createExerciseMock.mockResolvedValue({
      ...mockMcExercise,
      id: 999,
      prompt: 'Created MC',
      order_index: 2,
    })
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Lesson 3,/i }),
    )
    await user.click(screen.getByRole('button', { name: 'Create exercise' }))
    const prompt = await screen.findByLabelText('Prompt')
    await user.clear(prompt)
    await user.type(prompt, 'Created MC')

    const optionInputs = screen.getAllByLabelText(/Option \d+ text/)
    await user.clear(optionInputs[0])
    await user.type(optionInputs[0], 'Yes')
    await user.clear(optionInputs[1])
    await user.type(optionInputs[1], 'No')

    await user.click(screen.getByRole('button', { name: 'Create exercise' }))

    await waitFor(() => {
      expect(createExerciseMock).toHaveBeenCalledTimes(1)
    })
    const payload = createExerciseMock.mock.calls[0][0]
    expect(payload.type).toBe('multiple_choice')
    expect(payload.lesson_id).toBe(3)
    expect(payload.prompt).toBe('Created MC')
    expect(payload.correct_answer).toEqual({
      option_id: expect.any(String),
    })
    expect(payload.options).toHaveLength(2)
    expect(payload.options[0].id).not.toBe('0')
    expect(payload.options[0].text).toBe('Yes')
  })

  it('preserves draft on active-attempt 409 without success toast', async () => {
    const user = userEvent.setup()
    updateExerciseMock.mockRejectedValue(
      new ApiError(
        409,
        'CONTENT_IN_ACTIVE_ATTEMPT',
        'Cannot edit an exercise referenced by an active attempt',
        { exercise_id: 501 },
      ),
    )
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 501, Multiple choice/i }),
    )
    const prompt = await screen.findByLabelText('Prompt')
    await user.clear(prompt)
    await user.type(prompt, 'Should not apply')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(
      await screen.findByRole('heading', { name: 'Active-attempt conflict' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt')).toHaveValue('Should not apply')
    expect(screen.queryByText('Exercise updated')).not.toBeInTheDocument()
  })

  it('guards unsaved changes when switching selection', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 501, Multiple choice/i }),
    )
    const prompt = await screen.findByLabelText('Prompt')
    await user.type(prompt, ' dirty')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 502,/i }),
    )
    expect(
      await screen.findByRole('heading', { name: 'Discard unsaved changes?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Keep editing' }))
    expect(screen.getByLabelText('Prompt')).toHaveValue('Hola dirty')
  })

  it('does not write admin answers into the session store', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 501, Multiple choice/i }),
    )
    await screen.findByRole('heading', { name: 'Exercise #501' })
    const state = useSessionStore.getState()
    expect(JSON.stringify(state)).not.toContain('correct_answer')
    expect(JSON.stringify(state)).not.toContain('"option_id":"a"')
    expect(window.localStorage.getItem('lingoquest-admin')).toBeNull()
  })

  it('disables save when fill-blank marker count is invalid', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 502,/i }),
    )
    const prompt = await screen.findByLabelText(/Prompt \(exactly one/)
    await user.clear(prompt)
    await user.type(prompt, 'No blank here')
    expect(screen.getByText(/Blank markers found: 0/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(updateExerciseMock).not.toHaveBeenCalled()
  })

  it('disables save for partial TTS pair', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(
      screen.getByRole('treeitem', { name: /Exercise 501, Multiple choice/i }),
    )
    const lang = await screen.findByLabelText(/TTS language/)
    await user.clear(lang)
    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled()
    expect(updateExerciseMock).not.toHaveBeenCalled()
    const form = formStateFromExercise(mockMcExercise)
    form.tts_lang = null
    expect(validateExerciseForm(form).valid).toBe(false)
  })

  it('word-bank keyboard reorder controls are present', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Spanish')
    await user.click(screen.getByRole('treeitem', { name: /Lesson 3,/i }))
    await user.click(screen.getByRole('button', { name: 'Create exercise' }))
    await user.selectOptions(
      screen.getByLabelText('Exercise type'),
      'translate_word_bank',
    )
    const tiles = await screen.findByLabelText('Word bank tiles')
    expect(within(tiles).getByRole('button', { name: /Add tile 1 to correct sequence/i })).toBeInTheDocument()
  })
})
