import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LingoPath - Learn Languages',
  description: 'Language learning application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
