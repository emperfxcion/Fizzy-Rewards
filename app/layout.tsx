import './globals.css'
import type { Metadata } from 'next'
import { Brand } from '@/components/Brand'

export const metadata: Metadata = { title: `${Brand.name} Rewards`, description: Brand.tagline }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="p-4">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <div className="h-10 w-10 rounded-full" style={{background: Brand.colors.primary}}/>
            <div>
              <h1 className="font-display text-2xl leading-none">{Brand.name} Rewards</h1>
              <p className="text-sm opacity-70">{Brand.tagline}</p>
            </div>
          </div>
        </header>
        <main className="max-w-3xl mx-auto p-4">{children}</main>
        <footer className="max-w-3xl mx-auto p-4 text-sm opacity-70">
          <span>Made for Fizzy B’s • Colors: Pink {Brand.colors.primary}, Blue {Brand.colors.accent}</span>
        </footer>
      </body>
    </html>
  )
}
