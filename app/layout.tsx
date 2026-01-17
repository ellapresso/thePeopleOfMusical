import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'The People Of Musical',
  description: 'The People Of Musical 단원 검색',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  )
}

