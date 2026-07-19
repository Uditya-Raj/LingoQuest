'use client'

/**
 * Welcome hero scene — animation extracted from the shared landing snippets:
 * 3D mouse parallax (rotateX/Y + translateZ layers), sparkle cursor trail,
 * mascot wiggle/bounce, and dashed path motion on the phone screen.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
  type CSSProperties,
} from 'react'

import { QuestMascot } from '@/components/ui/quest-mascot'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'

interface Parallax {
  x: number
  y: number
}

interface Sparkle {
  id: number
  x: number
  y: number
  size: number
  color: string
}

const SPARKLE_COLORS = ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#34d399']

function DepthLayer({
  parallax,
  z,
  pan,
  className,
  style,
  children,
}: {
  parallax: Parallax
  /** translateZ depth in px */
  z: number
  /** How strongly this layer drifts with the cursor */
  pan: number
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div
      className={cn(
        'absolute transition-transform duration-300 ease-out',
        className,
      )}
      style={{
        transform: `translateZ(${z}px) translate(${parallax.x * pan}px, ${parallax.y * pan}px)`,
        transformStyle: 'preserve-3d',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function HeroIllustration({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)
  const sparkleIdRef = useRef(0)
  const [parallax, setParallax] = useState<Parallax>({ x: 0, y: 0 })
  const [sparkles, setSparkles] = useState<Sparkle[]>([])

  const onPointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !frameRef.current) return
      const rect = frameRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left - rect.width / 2) / (rect.width / 2)
      const y = (event.clientY - rect.top - rect.height / 2) / (rect.height / 2)
      setParallax({ x, y })

      // Magic mouse-trail sparkles (from shared LandingPage snippet)
      if (Math.random() < 0.25) {
        const relativeX = event.clientX - rect.left
        const relativeY = event.clientY - rect.top
        const newSparkle: Sparkle = {
          id: sparkleIdRef.current++,
          x: relativeX,
          y: relativeY,
          size: Math.random() * 8 + 6,
          color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
        }
        setSparkles((prev) => [...prev.slice(-15), newSparkle])
      }
    },
    [reducedMotion],
  )

  const onPointerLeave = useCallback(() => {
    setParallax({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    if (sparkles.length === 0) return
    const timeout = window.setTimeout(() => {
      setSparkles((prev) => prev.slice(1))
    }, 450)
    return () => window.clearTimeout(timeout)
  }, [sparkles])

  const p = reducedMotion ? { x: 0, y: 0 } : parallax

  return (
    <div
      ref={frameRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[min(100%,420px)] cursor-crosshair overflow-hidden',
        'sm:max-w-[460px] lg:max-w-[500px]',
        'select-none rounded-[28px] sm:rounded-[36px]',
        className,
      )}
      style={{ perspective: reducedMotion ? undefined : '1200px' }}
      aria-hidden="true"
    >
      {/* Soft vignette frame */}
      <div
        className={cn(
          'absolute inset-[2%] rounded-[22%]',
          'bg-gradient-to-br from-[#f7fcff] via-white to-[#f5fff2]',
          'dark:from-[#15242b] dark:via-[#1a2f38] dark:to-[#142820]',
          'dark:ring-1 dark:ring-white/5',
          'dark:shadow-[0_24px_60px_rgba(0,0,0,0.45)]',
        )}
      />
      <div className="pointer-events-none absolute inset-[6%] rounded-[40%] bg-[radial-gradient(circle_at_48%_42%,rgba(88,204,2,0.14),transparent_58%)] dark:bg-[radial-gradient(circle_at_48%_42%,rgba(88,204,2,0.22),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-[10%] rounded-full bg-[radial-gradient(circle_at_55%_55%,rgba(28,176,246,0.08),transparent_60%)] dark:bg-[radial-gradient(circle_at_55%_55%,rgba(28,176,246,0.14),transparent_60%)]" />

      {/* Sparkle cursor trail */}
      {!reducedMotion &&
        sparkles.map((s) => (
          <div
            key={s.id}
            className="pointer-events-none absolute flex items-center justify-center rounded-full opacity-75 lq-welcome-sparkle"
            style={{
              left: s.x - s.size / 2,
              top: s.y - s.size / 2,
              width: s.size,
              height: s.size,
              backgroundColor: s.color,
              boxShadow: `0 0 8px ${s.color}`,
            }}
          >
            <span className="text-[6px] text-white">✦</span>
          </div>
        ))}

      {/* Core 3D transforming container (from LandingPage parallax) */}
      <div
        className="relative flex h-full w-full items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: reducedMotion
            ? undefined
            : `rotateX(${p.y * -16}deg) rotateY(${p.x * 16}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Soft depth glow behind scene */}
        <div
          className="pointer-events-none absolute -z-10 h-[70%] w-[70%] rounded-full bg-teal-50/60 opacity-60 blur-3xl dark:bg-teal-900/30"
          style={{ transform: 'translateZ(-40px)' }}
        />

        {/* Phone — mid depth, slight clay tilt */}
        <DepthLayer
          parallax={p}
          z={25}
          pan={10}
          className="right-[8%] top-[14%] h-[52%] w-[34%] sm:right-[10%] sm:top-[16%]"
          style={{
            transform: `translateZ(25px) rotateY(-18deg) rotateX(12deg) rotateZ(-4deg) translate(${p.x * 10}px, ${p.y * 10}px)`,
          }}
        >
          <PhoneCard animate={!reducedMotion} />
        </DepthLayer>

        {/* Quest fox */}
        <DepthLayer
          parallax={p}
          z={45}
          pan={18}
          className="bottom-[6%] left-[4%] z-10 w-[48%] max-w-[240px] sm:left-[6%] sm:w-[52%]"
        >
          <div className={cn('relative', !reducedMotion && 'lq-welcome-mascot-bob')}>
            <div className="absolute -inset-3 rounded-full bg-[#ffd9a8]/50 blur-xl dark:bg-[#ffb45a]/25" />
            <QuestMascot
              variant="encouraging"
              size={220}
              className={cn(
                'relative h-auto w-full drop-shadow-[0_12px_18px_rgba(240,151,43,0.35)]',
                'dark:drop-shadow-[0_16px_28px_rgba(240,151,43,0.45)]',
                !reducedMotion && 'lq-welcome-mascot-wave',
              )}
            />
            <span
              className={cn(
                'absolute bottom-[28%] right-[-4%] rotate-[28deg]',
                !reducedMotion && 'lq-welcome-pencil-pulse',
              )}
            >
              <svg
                width="28"
                height="72"
                viewBox="0 0 28 72"
                fill="none"
                className="h-[clamp(2.5rem,8vw,4.5rem)] w-auto"
              >
                <rect x="10" y="8" width="8" height="48" rx="2" fill="#FFC800" />
                <rect x="10" y="8" width="8" height="10" rx="2" fill="#FF4B4B" />
                <path d="M10 56h8l-4 10-4-10Z" fill="#E8C39A" />
                <path d="M12 62h4l-2 4-2-4Z" fill="#3C3C3C" />
              </svg>
            </span>
          </div>
        </DepthLayer>

        {/* Hola bubble */}
        <DepthLayer
          parallax={p}
          z={60}
          pan={-15}
          className="left-[6%] top-[12%] z-30 sm:left-[8%] sm:top-[14%]"
        >
          <div className={reducedMotion ? undefined : 'lq-welcome-float'}>
            <SpeechBubble />
          </div>
        </DepthLayer>

        {/* Heart */}
        <DepthLayer
          parallax={p}
          z={80}
          pan={-25}
          className="left-[32%] top-[10%] z-30 sm:left-[34%] sm:top-[12%]"
        >
          <div className={reducedMotion ? undefined : 'lq-welcome-float-delay'}>
            <HeartGem />
          </div>
        </DepthLayer>

        {/* Coin */}
        <DepthLayer
          parallax={p}
          z={70}
          pan={20}
          className="right-[18%] top-[16%] z-30 sm:right-[20%]"
        >
          <div className={reducedMotion ? undefined : 'lq-welcome-float-slow'}>
            <CoinBadge />
          </div>
        </DepthLayer>

        {/* Blue star */}
        <DepthLayer
          parallax={p}
          z={75}
          pan={25}
          className="right-[6%] top-[6%] z-40"
        >
          <div className={reducedMotion ? undefined : 'lq-welcome-float'}>
            <StarBadge />
          </div>
        </DepthLayer>

        {/* Portraits — farthest Z for strong parallax */}
        <DepthLayer
          parallax={p}
          z={90}
          pan={-30}
          className="left-[3%] top-[4%] z-40"
        >
          <PortraitCard tone="warm" face="A" />
        </DepthLayer>
        <DepthLayer
          parallax={p}
          z={85}
          pan={28}
          className="bottom-[4%] right-[3%] z-40"
        >
          <PortraitCard tone="cool" face="B" />
        </DepthLayer>
      </div>
    </div>
  )
}

function PhoneCard({ animate }: { animate: boolean }) {
  return (
    <div
      className={cn(
        'relative h-full w-full min-h-[140px] rounded-[clamp(1rem,3vw,1.6rem)]',
        'border-[3px] border-[#1f2430] bg-white',
        'shadow-[0_18px_40px_rgba(31,36,48,0.18)]',
        'dark:border-[#0a1216] dark:bg-[#eef6f8]',
        'dark:shadow-[0_18px_40px_rgba(0,0,0,0.45)]',
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="absolute inset-x-[18%] top-2 h-1.5 rounded-full bg-[#1f2430]/85" />
      <div className="absolute inset-[8%] overflow-hidden rounded-[clamp(0.75rem,2.5vw,1.1rem)] bg-gradient-to-b from-[#e8f9ff] to-[#f7fff0]">
        <svg viewBox="0 0 120 200" className="h-full w-full" fill="none">
          <path
            d="M60 18 C 40 40, 88 55, 52 78 C 20 98, 90 112, 58 138 C 36 156, 78 168, 60 188"
            stroke="#58CC02"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d="M60 18 C 40 40, 88 55, 52 78 C 20 98, 90 112, 58 138 C 36 156, 78 168, 60 188"
            stroke="#58CC02"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={animate ? '4 4' : undefined}
            className={animate ? 'lq-welcome-path-dash' : undefined}
          />
          {[
            [60, 22],
            [48, 58],
            [72, 92],
            [50, 126],
            [66, 160],
            [58, 188],
          ].map(([cx, cy], i) => (
            <g key={i} style={{ transform: `translateZ(${10 + i * 2}px)` }}>
              <circle
                cx={cx}
                cy={cy}
                r="11"
                fill="#FFFFFF"
                stroke="#58CC02"
                strokeWidth="3"
              />
              <circle
                cx={cx}
                cy={cy}
                r="5"
                fill={i === 3 ? '#FFC800' : '#58CC02'}
              />
            </g>
          ))}
        </svg>
        {animate ? (
          <span className="absolute right-2 top-2 rounded-full bg-lq-success px-1.5 py-0.5 text-[8px] font-extrabold tracking-wider text-white lq-welcome-live-pulse">
            LIVE
          </span>
        ) : null}
      </div>
    </div>
  )
}

function SpeechBubble() {
  return (
    <div className="relative">
      <div
        className={cn(
          'rounded-2xl bg-white px-3.5 py-2',
          'text-sm font-extrabold text-[#1f2430]',
          'shadow-[0_10px_24px_rgba(31,36,48,0.12)]',
          'ring-1 ring-black/5',
          'dark:bg-[#243844] dark:text-white dark:ring-white/10',
          'dark:shadow-[0_12px_28px_rgba(0,0,0,0.4)]',
        )}
      >
        Hola
      </div>
      <span className="absolute -bottom-1.5 left-5 h-3 w-3 rotate-45 bg-white shadow-[2px_2px_0_rgba(0,0,0,0.04)] dark:bg-[#243844]" />
    </div>
  )
}

function HeartGem() {
  return (
    <svg
      width="44"
      height="40"
      viewBox="0 0 44 40"
      className="h-[clamp(1.75rem,5vw,2.75rem)] w-auto drop-shadow-[0_8px_14px_rgba(255,75,75,0.35)]"
    >
      <path
        d="M22 36 C 8 26, 2 16, 8 9 C 12 4, 18 5, 22 10 C 26 5, 32 4, 36 9 C 42 16, 36 26, 22 36Z"
        fill="#FF4B4B"
      />
      <path
        d="M14 12 C 16 9, 19 10, 20 13"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

function CoinBadge() {
  return (
    <svg
      width="46"
      height="46"
      viewBox="0 0 46 46"
      className="h-[clamp(1.75rem,5vw,2.85rem)] w-auto drop-shadow-[0_8px_14px_rgba(255,200,0,0.4)]"
    >
      <circle cx="23" cy="23" r="20" fill="#FFC800" />
      <circle
        cx="23"
        cy="23"
        r="15"
        fill="#FFE566"
        stroke="#E6B400"
        strokeWidth="2"
      />
      <path
        d="M23 12l2.2 6.6H32l-5.4 4 2.1 6.5L23 25.6l-5.7 3.5 2.1-6.5L14 18.6h6.8L23 12Z"
        fill="#E6B400"
      />
    </svg>
  )
}

function StarBadge() {
  return (
    <svg
      width="42"
      height="42"
      viewBox="0 0 42 42"
      className="h-[clamp(1.5rem,4.5vw,2.6rem)] w-auto drop-shadow-[0_8px_14px_rgba(28,176,246,0.35)]"
    >
      <path
        d="M21 4 25.5 15.5 38 16.2 28.2 24.2 31.5 36.5 21 29.8 10.5 36.5 13.8 24.2 4 16.2 16.5 15.5 21 4Z"
        fill="#1CB0F6"
      />
      <path
        d="M21 11l1.6 4.8H28l-4.2 3 1.6 4.9L21 20.8l-4.4 2.9 1.6-4.9-4.2-3h5.4L21 11Z"
        fill="#FFFFFF"
        opacity="0.55"
      />
    </svg>
  )
}

function PortraitCard({
  tone,
  face,
}: {
  tone: 'warm' | 'cool'
  face: 'A' | 'B'
}) {
  const bg = tone === 'warm' ? '#FFE0C2' : '#D7ECFF'
  const hair = tone === 'warm' ? '#5A3A22' : '#2F2A44'
  const skin = tone === 'warm' ? '#F0B48A' : '#C99572'

  return (
    <div
      className={cn(
        'h-[clamp(2.75rem,8vw,3.5rem)] w-[clamp(2.75rem,8vw,3.5rem)] overflow-hidden rounded-xl border-[3px] border-white',
        'shadow-[0_10px_20px_rgba(31,36,48,0.14)]',
        'rotate-[-8deg]',
        'dark:border-[#2a4a58] dark:shadow-[0_12px_24px_rgba(0,0,0,0.45)]',
      )}
      style={{ background: bg }}
    >
      <svg viewBox="0 0 56 56" className="h-full w-full">
        <circle cx="28" cy="40" r="18" fill={skin} />
        <ellipse cx="28" cy="18" rx="16" ry="12" fill={hair} />
        {face === 'A' ? (
          <>
            <circle cx="22" cy="34" r="2" fill="#3C3C3C" />
            <circle cx="34" cy="34" r="2" fill="#3C3C3C" />
            <path
              d="M23 40 Q28 44 33 40"
              stroke="#3C3C3C"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
          </>
        ) : (
          <>
            <circle cx="22" cy="33" r="2" fill="#3C3C3C" />
            <circle cx="34" cy="33" r="2" fill="#3C3C3C" />
            <path
              d="M24 40 Q28 42 32 40"
              stroke="#3C3C3C"
              strokeWidth="1.8"
              fill="none"
              strokeLinecap="round"
            />
            <rect
              x="16"
              y="28"
              width="24"
              height="3"
              rx="1.5"
              fill="#58CC02"
              opacity="0.7"
            />
          </>
        )}
      </svg>
    </div>
  )
}
