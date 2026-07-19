import type {
  AdminContentTreeResponse,
  AdminExerciseRepresentation,
} from '@/lib/contracts/admin'

export const mockMcExercise: AdminExerciseRepresentation = {
  id: 501,
  lesson_id: 3,
  order_index: 0,
  type: 'multiple_choice',
  prompt: 'Hola',
  audio_url: null,
  tts_text: 'hola',
  tts_lang: 'es-ES',
  options: [
    { id: 'a', text: 'Hello' },
    { id: 'b', text: 'Goodbye' },
  ],
  correct_answer: { option_id: 'a' },
  metadata: { hint: 'A common greeting' },
  is_active: true,
  created_at: '2026-07-01T08:00:00Z',
  updated_at: '2026-07-01T08:00:00Z',
}

export const mockFillExercise: AdminExerciseRepresentation = {
  id: 502,
  lesson_id: 3,
  order_index: 1,
  type: 'fill_blank',
  prompt: 'Ella ___ estudiante.',
  audio_url: null,
  tts_text: null,
  tts_lang: null,
  options: null,
  correct_answer: { text: 'es' },
  metadata: null,
  is_active: true,
  created_at: '2026-07-01T08:00:00Z',
  updated_at: '2026-07-01T08:00:00Z',
}

export const mockContentTree: AdminContentTreeResponse = {
  courses: [
    {
      id: 1,
      title: 'Spanish',
      units: [
        {
          id: 1,
          title: 'First Steps',
          skills: [
            {
              id: 1,
              title: 'Greetings',
              lessons: [
                {
                  id: 1,
                  order_index: 0,
                  xp_reward: 10,
                  exercises: [],
                },
              ],
            },
            {
              id: 3,
              title: 'Food',
              lessons: [
                {
                  id: 3,
                  order_index: 0,
                  xp_reward: 10,
                  exercises: [mockMcExercise, mockFillExercise],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
