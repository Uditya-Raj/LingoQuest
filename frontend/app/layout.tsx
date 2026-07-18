import type { Metadata, Viewport } from 'next'
import '@fontsource-variable/nunito'
import './globals.css'
import { ThemeScript } from '@/components/ui/theme-script'
import { ToastProvider } from '@/components/ui/toast'

export const metadata: Metadata = {
  title: 'LingoQuest',
  description: 'Original language learning with a tactile 3D experience',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
