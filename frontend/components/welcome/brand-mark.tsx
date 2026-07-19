import { cn } from '@/lib/utils'

interface BrandMarkProps {
  className?: string
  /** Show wordmark beside the icon. */
  showWordmark?: boolean
  size?: 'sm' | 'md'
}

/**
 * Original LingoQuest mark — green badge with sparkle, not a Duolingo asset.
 */
export function BrandMark({
  className,
  showWordmark = true,
  size = 'md',
}: BrandMarkProps) {
  const icon = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10'
  const word = size === 'sm' ? 'text-lq-lg' : 'text-lq-xl'

  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center rounded-[10px]',
          'bg-lq-success shadow-[0_3px_0_0_var(--lq-success-depth)]',
          icon,
        )}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32" className="h-[58%] w-[58%]" fill="none">
          <path
            d="M16 5.5 17.8 12.2 24.5 14 17.8 15.8 16 22.5 14.2 15.8 7.5 14 14.2 12.2 16 5.5Z"
            fill="#FFFFFF"
          />
          <path
            d="M23.5 6.5 24.2 9.1 26.8 9.8 24.2 10.5 23.5 13.1 22.8 10.5 20.2 9.8 22.8 9.1 23.5 6.5Z"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span
          className={cn(
            'font-extrabold tracking-tight text-lq-text-primary',
            word,
          )}
        >
          LingoQuest
        </span>
      ) : null}
    </span>
  )
}
