import type { Metadata } from 'next'

import { WelcomePage } from '@/components/welcome/welcome-page'

export const metadata: Metadata = {
  title: 'LingoQuest',
  description:
    'The fun, fast, and rewarding way to learn Spanish with LingoQuest.',
}

/** Site entry — welcome/onboarding before the learner dashboard. */
export default function HomePage() {
  return <WelcomePage />
}
