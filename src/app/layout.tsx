import type { Metadata } from 'next'
import AmbientMusic from '../components/AmbientMusic'
import SocialSignature from '../components/SocialSignature'
import './globals.css'

export const metadata: Metadata = {
  title: 'Anatomia do invisível',
  description: 'Uma anatomia cinematográfica sobre autoestima, dismorfia corporal e presença.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
        <AmbientMusic />
        <SocialSignature />
      </body>
    </html>
  )
}
