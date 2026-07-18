'use client'

import { use } from 'react'

import { AppShell } from '@/components/layout/app-shell'
import { SkillDetailView } from '@/components/skill/skill-detail'
import { useSessionStore } from '@/stores/session-store'

export default function SkillPage({
  params,
}: {
  params: Promise<{ skillId: string }>
}) {
  const { skillId: skillIdRaw } = use(params)
  const skillId = Number.parseInt(skillIdRaw, 10)
  const learner = useSessionStore((s) => s.learner)

  if (!Number.isFinite(skillId) || skillId <= 0) {
    return (
      <AppShell learner={learner} learnerLoading={false}>
        <div className="mx-auto max-w-md py-12 text-center" role="alert">
          <h1 className="text-lq-2xl font-extrabold">Skill not found</h1>
          <p className="mt-2 text-lq-sm text-lq-text-secondary">
            That skill link is invalid.
          </p>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell learner={learner} learnerLoading={learner === null}>
      <SkillDetailView skillId={skillId} />
    </AppShell>
  )
}
