'use client'

import { notFound } from 'next/navigation'
import { useState } from 'react'
import {
  Heart,
  Flame,
  Star,
  Gem,
  Crown,
  Volume2,
  Settings,
  Trophy,
} from 'lucide-react'

import {
  Button3D,
  IconButton3D,
  SurfaceCard,
  ChoiceTile,
  WordTile,
  MatchTile,
  StatusBadge,
  StatIndicator,
  ProgressBar,
  ProgressRing,
  Modal,
  ToastProvider,
  useToast,
  FeedbackSurface,
  Skeleton,
  ThemeToggle,
  QuestMascot,
} from '@/components/ui'

export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== 'development') {
    notFound()
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-lq-bg-page p-4 sm:p-8">
        <div className="mx-auto max-w-lq-wide space-y-12">
          <header>
            <h1 className="text-lq-3xl font-extrabold">LingoQuest Design System</h1>
            <p className="text-lq-text-secondary text-lq-lg mt-2">
              Development-only showcase of all primitives.
            </p>
            <div className="mt-4">
              <ThemeToggle />
            </div>
          </header>

          <ButtonSection />
          <IconButtonSection />
          <TileSection />
          <CardSection />
          <BadgeSection />
          <StatSection />
          <ProgressSection />
          <ModalSection />
          <ToastSection />
          <FeedbackSection />
          <SkeletonSection />
          <MascotSection />
        </div>
      </div>
    </ToastProvider>
  )
}

/* ─── Sections ─── */

function SectionHeading({ children }: { children: string }) {
  return <h2 className="text-lq-2xl font-bold mb-4 border-b border-lq-border-divider pb-2">{children}</h2>
}

function SubHeading({ children }: { children: string }) {
  return <h3 className="text-lq-lg font-semibold mb-3 text-lq-text-secondary">{children}</h3>
}

function ButtonSection() {
  return (
    <section>
      <SectionHeading>Button3D</SectionHeading>

      <SubHeading>Variants</SubHeading>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button3D variant="primary">Primary</Button3D>
        <Button3D variant="secondary">Secondary</Button3D>
        <Button3D variant="success">Success</Button3D>
        <Button3D variant="danger">Danger</Button3D>
        <Button3D variant="timed">Timed</Button3D>
        <Button3D variant="ghost">Ghost</Button3D>
      </div>

      <SubHeading>Sizes</SubHeading>
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <Button3D size="sm">Small</Button3D>
        <Button3D size="md">Medium</Button3D>
        <Button3D size="lg">Large</Button3D>
      </div>

      <SubHeading>States</SubHeading>
      <div className="flex flex-wrap gap-3 mb-6">
        <Button3D disabled>Disabled</Button3D>
        <Button3D loading>Loading</Button3D>
        <Button3D variant="success" loading>Loading Success</Button3D>
      </div>

      <SubHeading>Long Label</SubHeading>
      <div className="max-w-xs">
        <Button3D className="w-full">This is a much longer button label for testing</Button3D>
      </div>
    </section>
  )
}

function IconButtonSection() {
  return (
    <section>
      <SectionHeading>IconButton3D</SectionHeading>
      <div className="flex flex-wrap items-end gap-3">
        <IconButton3D size="sm" aria-label="Settings small"><Settings /></IconButton3D>
        <IconButton3D size="md" aria-label="Play audio"><Volume2 /></IconButton3D>
        <IconButton3D size="lg" aria-label="Trophy"><Trophy /></IconButton3D>
        <IconButton3D active aria-label="Active button"><Star /></IconButton3D>
        <IconButton3D disabled aria-label="Disabled button"><Settings /></IconButton3D>
        <IconButton3D loading aria-label="Loading button"><Settings /></IconButton3D>
      </div>
    </section>
  )
}

function TileSection() {
  const [choiceState, setChoiceState] = useState<number | null>(null)

  return (
    <section>
      <SectionHeading>Tiles</SectionHeading>

      <SubHeading>ChoiceTile</SubHeading>
      <div className="max-w-md space-y-2 mb-6" role="radiogroup" aria-label="Example choices">
        {['Buenos días', 'Hola', 'Adiós', 'Gracias'].map((text, i) => (
          <ChoiceTile
            key={text}
            label={text}
            shortcut={String(i + 1)}
            state={choiceState === i ? 'selected' : 'default'}
            onClick={() => setChoiceState(i)}
          />
        ))}
        <ChoiceTile label="Correct answer" state="correct" />
        <ChoiceTile label="Incorrect answer" state="incorrect" />
        <ChoiceTile label="Disabled option" state="disabled" />
      </div>

      <SubHeading>WordTile</SubHeading>
      <div className="flex flex-wrap gap-2 mb-6">
        <WordTile word="Hello" state="available" />
        <WordTile word="World" state="placed" />
        <WordTile word="Good" state="correct" />
        <WordTile word="Bad" state="incorrect" />
        <WordTile word="Skip" state="disabled" />
      </div>

      <SubHeading>MatchTile</SubHeading>
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="space-y-2">
          <MatchTile text="Hola" state="default" />
          <MatchTile text="Adiós" state="selected" />
          <MatchTile text="Gracias" state="correct" />
          <MatchTile text="Por favor" state="incorrect" />
        </div>
        <div className="space-y-2">
          <MatchTile text="Hello" state="default" />
          <MatchTile text="Goodbye" state="paired" />
          <MatchTile text="Thank you" state="correct" />
          <MatchTile text="Please" state="used" />
        </div>
      </div>
    </section>
  )
}

function CardSection() {
  return (
    <section>
      <SectionHeading>SurfaceCard</SectionHeading>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SurfaceCard className="p-4">
          <h3 className="font-bold text-lq-lg">Default Card</h3>
          <p className="text-lq-text-secondary text-lq-sm mt-1">Standard surface card.</p>
        </SurfaceCard>
        <SurfaceCard variant="elevated" className="p-4">
          <h3 className="font-bold text-lq-lg">Elevated Card</h3>
          <p className="text-lq-text-secondary text-lq-sm mt-1">Deeper shadow for emphasis.</p>
        </SurfaceCard>
        <SurfaceCard variant="interactive" className="p-4">
          <h3 className="font-bold text-lq-lg">Interactive Card</h3>
          <p className="text-lq-text-secondary text-lq-sm mt-1">Hover lift, press depth.</p>
        </SurfaceCard>
      </div>
    </section>
  )
}

function BadgeSection() {
  return (
    <section>
      <SectionHeading>StatusBadge</SectionHeading>
      <div className="flex flex-wrap gap-3">
        <StatusBadge variant="default">Default</StatusBadge>
        <StatusBadge variant="success">Completed</StatusBadge>
        <StatusBadge variant="error">Failed</StatusBadge>
        <StatusBadge variant="warning">Warning</StatusBadge>
        <StatusBadge variant="info">Active</StatusBadge>
        <StatusBadge variant="locked">Locked</StatusBadge>
      </div>
    </section>
  )
}

function StatSection() {
  return (
    <section>
      <SectionHeading>StatIndicator</SectionHeading>
      <div className="flex flex-wrap gap-4">
        <StatIndicator variant="heart" value={5} icon={<Heart fill="currentColor" />} label="5 hearts" />
        <StatIndicator variant="streak" value={12} icon={<Flame fill="currentColor" />} label="12 day streak" />
        <StatIndicator variant="xp" value={340} icon={<Star fill="currentColor" />} label="340 XP" />
        <StatIndicator variant="gem" value={100} icon={<Gem fill="currentColor" />} label="100 gems" />
        <StatIndicator variant="crown" value={8} icon={<Crown fill="currentColor" />} label="8 crowns" />
      </div>
    </section>
  )
}

function ProgressSection() {
  return (
    <section>
      <SectionHeading>Progress</SectionHeading>

      <SubHeading>ProgressBar</SubHeading>
      <div className="space-y-3 max-w-md mb-6">
        <ProgressBar value={0} max={10} label="Empty progress" />
        <ProgressBar value={3} max={10} label="3 of 10 exercises" />
        <ProgressBar value={7} max={10} label="7 of 10 exercises" />
        <ProgressBar value={10} max={10} label="Complete" />
        <ProgressBar value={5} max={10} variant="primary" label="Primary variant" />
        <ProgressBar value={5} max={10} variant="timed" label="Timed variant" />
      </div>

      <SubHeading>ProgressRing</SubHeading>
      <div className="flex flex-wrap gap-4">
        <div className="text-center">
          <ProgressRing value={0} max={5} label="0 of 5 crowns" />
          <p className="text-lq-xs mt-1">0/5</p>
        </div>
        <div className="text-center">
          <ProgressRing value={2} max={5} label="2 of 5 crowns" />
          <p className="text-lq-xs mt-1">2/5</p>
        </div>
        <div className="text-center">
          <ProgressRing value={5} max={5} label="5 of 5 crowns" />
          <p className="text-lq-xs mt-1">5/5</p>
        </div>
        <div className="text-center">
          <ProgressRing value={3} max={5} size={80} strokeWidth={6} label="Large ring" />
          <p className="text-lq-xs mt-1">3/5 (large)</p>
        </div>
      </div>
    </section>
  )
}

function ModalSection() {
  const [open, setOpen] = useState(false)
  const [locked, setLocked] = useState(false)

  return (
    <section>
      <SectionHeading>Modal</SectionHeading>
      <div className="flex gap-3">
        <Button3D onClick={() => setOpen(true)}>Open Modal</Button3D>
        <Button3D variant="danger" onClick={() => setLocked(true)}>Non-dismissible Modal</Button3D>
      </div>
      <Modal open={open} onClose={() => setOpen(false)}>
        <h2 id="demo-modal-title" className="text-lq-xl font-bold mb-2">Demo Modal</h2>
        <p className="text-lq-text-secondary mb-4">
          This modal has focus trapping, Escape to close, and scroll lock.
        </p>
        <Button3D variant="success" onClick={() => setOpen(false)}>Close</Button3D>
      </Modal>
      <Modal open={locked} onClose={() => setLocked(false)} dismissible={false}>
        <h2 className="text-lq-xl font-bold mb-2">Non-Dismissible</h2>
        <p className="text-lq-text-secondary mb-4">
          Cannot be closed with Escape or backdrop click.
        </p>
        <Button3D onClick={() => setLocked(false)}>Acknowledge</Button3D>
      </Modal>
    </section>
  )
}

function ToastSection() {
  const { addToast } = useToast()

  return (
    <section>
      <SectionHeading>Toast</SectionHeading>
      <div className="flex flex-wrap gap-3">
        <Button3D
          variant="success"
          size="sm"
          onClick={() =>
            addToast({
              variant: 'xp',
              title: '+10 XP',
              description: 'Lesson complete!',
              icon: <Star className="text-lq-xp" fill="currentColor" />,
              priority: 'normal',
              duration: 3000,
            })
          }
        >
          XP Toast
        </Button3D>
        <Button3D
          size="sm"
          onClick={() =>
            addToast({
              variant: 'streak',
              title: 'Streak extended!',
              description: '7 days strong!',
              icon: <Flame className="text-lq-streak" fill="currentColor" />,
              priority: 'normal',
              duration: 3000,
            })
          }
        >
          Streak Toast
        </Button3D>
        <Button3D
          variant="secondary"
          size="sm"
          onClick={() =>
            addToast({
              variant: 'achievement',
              title: 'Achievement unlocked!',
              description: 'First Lesson',
              icon: <Trophy className="text-lq-crown" />,
              priority: 'normal',
              duration: 4000,
            })
          }
        >
          Achievement Toast
        </Button3D>
        <Button3D
          variant="danger"
          size="sm"
          onClick={() =>
            addToast({
              variant: 'error',
              title: 'Connection error',
              description: 'Tap to retry',
              priority: 'high',
              duration: 5000,
            })
          }
        >
          Error Toast
        </Button3D>
      </div>
    </section>
  )
}

function FeedbackSection() {
  const [fb, setFb] = useState<'correct' | 'incorrect' | null>(null)

  return (
    <section>
      <SectionHeading>FeedbackSurface</SectionHeading>
      <div className="flex gap-3 mb-4">
        <Button3D variant="success" size="sm" onClick={() => setFb('correct')}>Show Correct</Button3D>
        <Button3D variant="danger" size="sm" onClick={() => setFb('incorrect')}>Show Incorrect</Button3D>
        <Button3D variant="ghost" size="sm" onClick={() => setFb(null)}>Hide</Button3D>
      </div>
      <div className="relative overflow-hidden rounded-lq-lg border border-lq-border-default" style={{ minHeight: 120 }}>
        <div className="p-4 text-lq-text-secondary text-lq-sm">Exercise content area</div>
        <div className="absolute bottom-0 left-0 right-0">
          <FeedbackSurface
            open={fb === 'correct'}
            variant="correct"
            message="Nailed it!"
          />
          <FeedbackSurface
            open={fb === 'incorrect'}
            variant="incorrect"
            message="Not quite — keep going!"
            solution='The correct answer is: "Buenos días"'
          />
        </div>
      </div>
    </section>
  )
}

function SkeletonSection() {
  return (
    <section>
      <SectionHeading>Skeleton / Loading</SectionHeading>
      <div className="space-y-3 max-w-md">
        <Skeleton variant="text" width="60%" />
        <Skeleton variant="text" width="80%" />
        <Skeleton variant="text" width="40%" />
        <div className="flex gap-3 items-center">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" />
          </div>
        </div>
        <Skeleton variant="rectangular" height={120} className="w-full" />
      </div>
    </section>
  )
}

function MascotSection() {
  return (
    <section>
      <SectionHeading>Quest Mascot</SectionHeading>
      <div className="flex flex-wrap gap-6 items-end">
        <div className="text-center">
          <QuestMascot variant="neutral" size={80} />
          <p className="text-lq-xs mt-2">Neutral</p>
        </div>
        <div className="text-center">
          <QuestMascot variant="encouraging" size={80} />
          <p className="text-lq-xs mt-2">Encouraging</p>
        </div>
        <div className="text-center">
          <QuestMascot variant="celebrating" size={80} />
          <p className="text-lq-xs mt-2">Celebrating</p>
        </div>
        <div className="text-center">
          <QuestMascot variant="concerned" size={80} />
          <p className="text-lq-xs mt-2">Concerned</p>
        </div>
        <div className="text-center">
          <QuestMascot variant="neutral" size={48} />
          <p className="text-lq-xs mt-2">Small (48px)</p>
        </div>
        <div className="text-center">
          <QuestMascot variant="celebrating" size={120} decorative={false} label="Quest celebrating your achievement" />
          <p className="text-lq-xs mt-2">Large (120px, labeled)</p>
        </div>
      </div>
    </section>
  )
}
