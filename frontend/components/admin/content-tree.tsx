'use client'

import { useState, type KeyboardEvent } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Volume2,
} from 'lucide-react'

import type {
  AdminContentTreeResponse,
  AdminCourseNode,
  AdminExerciseRepresentation,
  AdminLessonNode,
  AdminSkillNode,
  AdminUnitNode,
} from '@/lib/contracts/admin'
import type { AdminSelection } from '@/lib/admin/exercise-form-state'
import { EXERCISE_TYPE_LABELS } from '@/lib/admin/exercise-form-state'
import { cn } from '@/lib/utils'

interface ContentTreeProps {
  tree: AdminContentTreeResponse
  selection: AdminSelection
  onSelect: (selection: AdminSelection) => void
  className?: string
}

function hasAudio(exercise: AdminExerciseRepresentation): boolean {
  return Boolean(
    (exercise.audio_url && exercise.audio_url.trim()) ||
      (exercise.tts_text && exercise.tts_lang),
  )
}

function selectionKey(selection: AdminSelection): string {
  switch (selection.kind) {
    case 'none':
      return 'none'
    case 'course':
      return `course-${selection.courseId}`
    case 'unit':
      return `unit-${selection.unitId}`
    case 'skill':
      return `skill-${selection.skillId}`
    case 'lesson':
      return `lesson-${selection.lessonId}`
    case 'exercise':
      return `exercise-${selection.exerciseId}`
    case 'create':
      return `create-${selection.lessonId}`
  }
}

function isSelected(
  selection: AdminSelection,
  kind: AdminSelection['kind'],
  id: number,
): boolean {
  switch (kind) {
    case 'course':
      return selection.kind === 'course' && selection.courseId === id
    case 'unit':
      return selection.kind === 'unit' && selection.unitId === id
    case 'skill':
      return selection.kind === 'skill' && selection.skillId === id
    case 'lesson':
      return (
        (selection.kind === 'lesson' || selection.kind === 'create') &&
        selection.lessonId === id
      )
    case 'exercise':
      return selection.kind === 'exercise' && selection.exerciseId === id
    default:
      return false
  }
}

export function ContentTree({
  tree,
  selection,
  onSelect,
  className,
}: ContentTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    for (const course of tree.courses) {
      initial.add(`course-${course.id}`)
      for (const unit of course.units) {
        initial.add(`unit-${unit.id}`)
        for (const skill of unit.skills) {
          initial.add(`skill-${skill.id}`)
        }
      }
    }
    return initial
  })

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const onTreeKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('[role="treeitem"]'),
    )
    const currentIndex = items.indexOf(document.activeElement as HTMLElement)
    if (currentIndex < 0) return
    event.preventDefault()
    const delta = event.key === 'ArrowDown' ? 1 : -1
    const next = items[currentIndex + delta]
    next?.focus()
  }

  return (
    <nav
      className={cn(
        'flex max-h-[70vh] flex-col overflow-hidden rounded-lq border border-lq-border-default bg-lq-bg-surface',
        className,
      )}
      aria-label="Content hierarchy"
    >
      <div className="border-b border-lq-border-default px-3 py-2">
        <h2 className="text-lq-sm font-extrabold">Course content</h2>
        <p className="text-lq-xs text-lq-text-secondary">
          Browse units, skills, lessons, and exercises.
        </p>
      </div>
      <ul
        role="tree"
        aria-label="Content tree"
        className="flex-1 overflow-y-auto p-2 text-lq-sm"
        onKeyDown={onTreeKeyDown}
      >
        {tree.courses.map((course) => (
          <CourseNode
            key={course.id}
            course={course}
            expanded={expanded}
            toggle={toggle}
            selection={selection}
            onSelect={onSelect}
          />
        ))}
      </ul>
      <p className="sr-only" aria-live="polite">
        Selected: {selectionKey(selection)}
      </p>
    </nav>
  )
}

function ExpandButton({
  expanded,
  label,
  onClick,
}: {
  expanded: boolean
  label: string
  onClick: () => void
}) {
  const Icon = expanded ? ChevronDown : ChevronRight
  return (
    <button
      type="button"
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lq text-lq-text-secondary hover:bg-lq-bg-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lq-focus"
      aria-expanded={expanded}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  )
}

function TreeRow({
  selected,
  level,
  onActivate,
  children,
  ariaLabel,
}: {
  selected: boolean
  level: number
  onActivate: () => void
  children: React.ReactNode
  ariaLabel: string
}) {
  return (
    <div
      role="treeitem"
      tabIndex={0}
      aria-selected={selected}
      aria-label={ariaLabel}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-1 rounded-lq px-1 py-1',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lq-focus',
        selected &&
          'bg-lq-primary/15 font-extrabold ring-2 ring-inset ring-lq-primary',
        !selected && 'hover:bg-lq-bg-sunken',
      )}
      style={{ paddingLeft: `${level * 0.5}rem` }}
      onClick={onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onActivate()
        }
      }}
    >
      {children}
    </div>
  )
}

function CourseNode({
  course,
  expanded,
  toggle,
  selection,
  onSelect,
}: {
  course: AdminCourseNode
  expanded: Set<string>
  toggle: (key: string) => void
  selection: AdminSelection
  onSelect: (s: AdminSelection) => void
}) {
  const key = `course-${course.id}`
  const isOpen = expanded.has(key)
  const selected = isSelected(selection, 'course', course.id)

  return (
    <li role="none" className="mb-1">
      <TreeRow
        selected={selected}
        level={0}
        ariaLabel={`Course ${course.title}`}
        onActivate={() =>
          onSelect({ kind: 'course', courseId: course.id })
        }
      >
        <ExpandButton
          expanded={isOpen}
          label={isOpen ? `Collapse ${course.title}` : `Expand ${course.title}`}
          onClick={() => toggle(key)}
        />
        <span className="truncate">{course.title}</span>
      </TreeRow>
      {isOpen ? (
        <ul role="group" className="mt-0.5">
          {course.units.map((unit) => (
            <UnitNode
              key={unit.id}
              courseId={course.id}
              unit={unit}
              expanded={expanded}
              toggle={toggle}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function UnitNode({
  courseId,
  unit,
  expanded,
  toggle,
  selection,
  onSelect,
}: {
  courseId: number
  unit: AdminUnitNode
  expanded: Set<string>
  toggle: (key: string) => void
  selection: AdminSelection
  onSelect: (s: AdminSelection) => void
}) {
  const key = `unit-${unit.id}`
  const isOpen = expanded.has(key)
  const selected = isSelected(selection, 'unit', unit.id)

  return (
    <li role="none" className="mb-0.5">
      <TreeRow
        selected={selected}
        level={1}
        ariaLabel={`Unit ${unit.title}`}
        onActivate={() =>
          onSelect({ kind: 'unit', courseId, unitId: unit.id })
        }
      >
        <ExpandButton
          expanded={isOpen}
          label={isOpen ? `Collapse ${unit.title}` : `Expand ${unit.title}`}
          onClick={() => toggle(key)}
        />
        <span className="truncate">{unit.title}</span>
      </TreeRow>
      {isOpen ? (
        <ul role="group">
          {unit.skills.map((skill) => (
            <SkillNode
              key={skill.id}
              courseId={courseId}
              unitId={unit.id}
              skill={skill}
              expanded={expanded}
              toggle={toggle}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function SkillNode({
  courseId,
  unitId,
  skill,
  expanded,
  toggle,
  selection,
  onSelect,
}: {
  courseId: number
  unitId: number
  skill: AdminSkillNode
  expanded: Set<string>
  toggle: (key: string) => void
  selection: AdminSelection
  onSelect: (s: AdminSelection) => void
}) {
  const key = `skill-${skill.id}`
  const isOpen = expanded.has(key)
  const selected = isSelected(selection, 'skill', skill.id)

  return (
    <li role="none" className="mb-0.5">
      <TreeRow
        selected={selected}
        level={2}
        ariaLabel={`Skill ${skill.title}`}
        onActivate={() =>
          onSelect({ kind: 'skill', courseId, unitId, skillId: skill.id })
        }
      >
        <ExpandButton
          expanded={isOpen}
          label={isOpen ? `Collapse ${skill.title}` : `Expand ${skill.title}`}
          onClick={() => toggle(key)}
        />
        <span className="truncate">{skill.title}</span>
      </TreeRow>
      {isOpen ? (
        <ul role="group">
          {skill.lessons.map((lesson) => (
            <LessonNode
              key={lesson.id}
              courseId={courseId}
              unitId={unitId}
              skillId={skill.id}
              lesson={lesson}
              selection={selection}
              onSelect={onSelect}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function LessonNode({
  courseId,
  unitId,
  skillId,
  lesson,
  selection,
  onSelect,
}: {
  courseId: number
  unitId: number
  skillId: number
  lesson: AdminLessonNode
  selection: AdminSelection
  onSelect: (s: AdminSelection) => void
}) {
  const selected = isSelected(selection, 'lesson', lesson.id)
  const [open, setOpen] = useState(true)

  return (
    <li role="none" className="mb-0.5">
      <TreeRow
        selected={selected}
        level={3}
        ariaLabel={`Lesson ${lesson.id}, ${lesson.xp_reward} XP`}
        onActivate={() =>
          onSelect({
            kind: 'lesson',
            courseId,
            unitId,
            skillId,
            lessonId: lesson.id,
          })
        }
      >
        <ExpandButton
          expanded={open}
          label={open ? `Collapse lesson ${lesson.id}` : `Expand lesson ${lesson.id}`}
          onClick={() => setOpen((v) => !v)}
        />
        <span className="truncate">
          Lesson {lesson.id}{' '}
          <span className="font-normal text-lq-text-secondary">
            · order {lesson.order_index} · {lesson.xp_reward} XP
          </span>
        </span>
      </TreeRow>
      {open ? (
        <ul role="group">
          {lesson.exercises.map((exercise) => {
            const exSelected = isSelected(selection, 'exercise', exercise.id)
            return (
              <li key={exercise.id} role="none">
                <TreeRow
                  selected={exSelected}
                  level={4}
                  ariaLabel={`Exercise ${exercise.id}, ${EXERCISE_TYPE_LABELS[exercise.type]}${exercise.is_active ? '' : ', inactive'}`}
                  onActivate={() =>
                    onSelect({
                      kind: 'exercise',
                      courseId,
                      unitId,
                      skillId,
                      lessonId: lesson.id,
                      exerciseId: exercise.id,
                    })
                  }
                >
                  <span className="ml-9 flex min-w-0 flex-1 items-center gap-2 truncate">
                    <span className="truncate">
                      #{exercise.id}{' '}
                      <span className="font-normal">
                        {EXERCISE_TYPE_LABELS[exercise.type]}
                      </span>
                    </span>
                    {hasAudio(exercise) ? (
                      <Volume2
                        className="h-3.5 w-3.5 shrink-0 text-lq-secondary"
                        aria-label="Has audio or TTS"
                      />
                    ) : null}
                    {!exercise.is_active ? (
                      <span className="shrink-0 rounded-lq bg-lq-bg-sunken px-1.5 py-0.5 text-lq-xs font-bold uppercase tracking-wide text-lq-text-secondary">
                        Inactive
                      </span>
                    ) : null}
                  </span>
                </TreeRow>
              </li>
            )
          })}
        </ul>
      ) : null}
    </li>
  )
}
