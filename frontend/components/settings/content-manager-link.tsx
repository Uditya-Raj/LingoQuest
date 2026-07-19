'use client'

/**
 * Optional Settings entry to the content manager.
 * Visible only after a successful GET /admin/content/tree probe.
 * Never stores an admin flag in localStorage.
 */

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { FolderTree } from 'lucide-react'

import { SurfaceCard } from '@/components/ui/surface-card'
import { ApiError, getContentTree } from '@/lib/api'
import { cn } from '@/lib/utils'

type ProbeStatus = 'idle' | 'checking' | 'allowed' | 'denied' | 'error'

export function ContentManagerLink({ className }: { className?: string }) {
  const [status, setStatus] = useState<ProbeStatus>('checking')
  const probedRef = useRef(false)

  useEffect(() => {
    if (probedRef.current) return
    probedRef.current = true
    const controller = new AbortController()

    void getContentTree(controller.signal)
      .then(() => {
        if (!controller.signal.aborted) setStatus('allowed')
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return
        if (
          err instanceof ApiError &&
          (err.status === 403 || err.code === 'CONTENT_ADMIN_REQUIRED')
        ) {
          setStatus('denied')
          return
        }
        setStatus('error')
      })

    return () => controller.abort()
  }, [])

  if (status !== 'allowed') {
    return null
  }

  return (
    <SurfaceCard className={cn('p-5', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lq bg-lq-bg-sunken text-lq-secondary"
            aria-hidden="true"
          >
            <FolderTree className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-lq-lg font-extrabold">Content manager</h2>
            <p className="mt-1 text-lq-sm text-lq-text-secondary">
              Administration access confirmed by the content tree API. A hidden
              link is not a security boundary.
            </p>
          </div>
        </div>
        <Link
          href="/admin/content"
          className={cn(
            'inline-flex min-h-11 items-center justify-center rounded-lq px-4',
            'bg-lq-primary font-extrabold text-lq-text-inverse',
            'border-b-[length:var(--lq-depth-md)] border-b-lq-primary-depth',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lq-focus',
          )}
        >
          Open content manager
        </Link>
      </div>
    </SurfaceCard>
  )
}
