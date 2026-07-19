'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

import { BrandMark } from '@/components/welcome/brand-mark'
import { WelcomeThemeButton } from '@/components/welcome/welcome-theme-button'
import { cn } from '@/lib/utils'

const SITE_LANGUAGES = ['English'] as const

/**
 * Top welcome chrome: brand left; theme + site-language on the right.
 */
export function WelcomeNav() {
  const [open, setOpen] = useState(false)
  const [siteLanguage, setSiteLanguage] =
    useState<(typeof SITE_LANGUAGES)[number]>('English')
  const menuId = useId()
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header className="relative z-20 flex items-center justify-between gap-3 px-5 pt-5 sm:px-8 lg:px-12">
      <a
        href="/"
        className="rounded-lq focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2"
        aria-label="LingoQuest home"
      >
        <BrandMark />
      </a>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <WelcomeThemeButton />

        <div ref={rootRef} className="relative">
          <button
            type="button"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={menuId}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lq px-2 py-1.5',
              'text-[11px] font-extrabold uppercase tracking-[0.08em] text-lq-text-secondary',
              'hover:bg-lq-bg-sunken/70',
              'focus-visible:outline-2 focus-visible:outline-lq-border-focus focus-visible:outline-offset-2',
            )}
          >
            <span className="hidden sm:inline">Site language: </span>
            <span className="sm:hidden">Lang: </span>
            {siteLanguage}
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform',
                open && 'rotate-180',
              )}
              aria-hidden="true"
            />
          </button>

          {open ? (
            <ul
              id={menuId}
              role="listbox"
              aria-label="Site language"
              className={cn(
                'absolute right-0 mt-2 min-w-[10rem] overflow-hidden',
                'rounded-lq border border-lq-border-default bg-lq-bg-surface py-1 shadow-lq-lg',
              )}
            >
              {SITE_LANGUAGES.map((lang) => (
                <li
                  key={lang}
                  role="option"
                  aria-selected={siteLanguage === lang}
                >
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2 text-left text-lq-sm font-bold',
                      'hover:bg-lq-bg-sunken focus-visible:bg-lq-bg-sunken',
                      siteLanguage === lang
                        ? 'text-lq-success'
                        : 'text-lq-text-primary',
                    )}
                    onClick={() => {
                      setSiteLanguage(lang)
                      setOpen(false)
                    }}
                  >
                    {lang}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </header>
  )
}
