/**
 * Skill detail placeholder — Phase 8A route boundary only.
 */
export default async function SkillPage({
  params,
}: {
  params: Promise<{ skillId: string }>
}) {
  const { skillId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <h1 className="mb-3 text-2xl font-bold">Skill</h1>
        <p className="text-gray-600">
          Placeholder for skill <code>{skillId}</code>. Start/resume UI is not
          implemented in Phase 8A.
        </p>
      </div>
    </main>
  )
}
