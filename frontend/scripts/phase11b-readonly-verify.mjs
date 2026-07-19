/**
 * Phase 11B real-backend read-only verification.
 * Loads admin tree, walks hierarchy, opens five exercise types conceptually
 * via the API (no POST/PATCH). Confirms attempt 143 unchanged.
 */

const BASE = process.env.LINGOQUEST_API_BASE ?? 'http://127.0.0.1:8000'

async function main() {
  const health = await fetch(`${BASE}/api/health`)
  if (!health.ok) throw new Error(`health ${health.status}`)

  const before = await fetch(`${BASE}/api/lessons/143`)
  if (!before.ok) throw new Error(`attempt 143 before: ${before.status}`)
  const beforeBody = await before.json()
  const beforeSnapshot = JSON.stringify(beforeBody)

  const treeRes = await fetch(`${BASE}/api/admin/content/tree`)
  if (treeRes.status === 403) {
    console.log('DENIED: current user is not content admin')
    console.log(await treeRes.text())
    process.exit(2)
  }
  if (!treeRes.ok) throw new Error(`tree ${treeRes.status}`)
  const tree = await treeRes.json()

  let courses = 0
  let units = 0
  let skills = 0
  let lessons = 0
  let exercises = 0
  const byType = {
    multiple_choice: 0,
    translate_word_bank: 0,
    match_pairs: 0,
    fill_blank: 0,
    type_answer: 0,
  }
  let ttsCount = 0
  let sampleWithAnswer = null

  for (const course of tree.courses) {
    courses += 1
    for (const unit of course.units) {
      units += 1
      for (const skill of unit.skills) {
        skills += 1
        for (const lesson of skill.lessons) {
          lessons += 1
          for (const ex of lesson.exercises) {
            exercises += 1
            byType[ex.type] = (byType[ex.type] ?? 0) + 1
            if (ex.tts_text && ex.tts_lang) ttsCount += 1
            if (!sampleWithAnswer && ex.correct_answer) {
              sampleWithAnswer = { id: ex.id, type: ex.type }
            }
            if (!('correct_answer' in ex)) {
              throw new Error(`admin exercise ${ex.id} missing correct_answer`)
            }
          }
        }
      }
    }
  }

  for (const type of Object.keys(byType)) {
    if (byType[type] < 1) {
      throw new Error(`missing exercise type in tree: ${type}`)
    }
  }

  const after = await fetch(`${BASE}/api/lessons/143`)
  if (!after.ok) throw new Error(`attempt 143 after: ${after.status}`)
  const afterBody = await after.json()
  if (JSON.stringify(afterBody) !== beforeSnapshot) {
    throw new Error('attempt 143 changed during read-only verification')
  }
  for (const ex of afterBody.exercises ?? []) {
    if ('correct_answer' in ex) {
      throw new Error('learner retrieve leaked correct_answer')
    }
  }

  console.log('PASS read-only admin verification')
  console.log(
    JSON.stringify(
      {
        courses,
        units,
        skills,
        lessons,
        exercises,
        byType,
        ttsCount,
        sampleWithAnswer,
        attempt143Status: afterBody.status,
        attempt143Id: afterBody.attempt_id ?? afterBody.id ?? 143,
      },
      null,
      2,
    ),
  )
}

main().catch((err) => {
  console.error('FAIL', err)
  process.exit(1)
})
