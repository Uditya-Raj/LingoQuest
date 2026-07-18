import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LingoQuest',
  description: 'Original language learning with a tactile 3D experience',
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
