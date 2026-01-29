import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Providers } from '@/lib/providers'
import { Sidebar } from '@/components/sidebar'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Tokenized CRM',
  description: 'Sales CRM for managing sponsors and leads',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Providers>
          <Sidebar />
          <main className="ml-64 min-h-screen bg-background">
            <div className="p-8">{children}</div>
          </main>
        </Providers>
      </body>
    </html>
  )
}
