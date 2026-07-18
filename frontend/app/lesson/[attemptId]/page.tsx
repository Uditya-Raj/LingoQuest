/**
 * Lesson attempt placeholder — route is /lesson/[attemptId].
 * Player UI is not implemented in Phase 8A.
 */
export default async function LessonPage({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-lg text-center">
        <h1 className="mb-3 text-2xl font-bold">Lesson</h1>
        <p className="text-gray-600">
          Placeholder for attempt <code>{attemptId}</code>. Lesson player is not
          implemented in Phase 8A.
        </p>
      </div>
    </main>
  )
}
