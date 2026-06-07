import type { Metadata } from 'next'
import { Cinzel, Playfair_Display, Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import FloatingHearts from '@/components/shared/FloatingHearts'

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-gothic',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Secret Store — Produtos Digitais Premium',
    template: '%s | Secret Store',
  },
  description: 'Sua loja de produtos digitais com estética gótica e design alternativo',
  keywords: ['produtos digitais', 'ebooks', 'cursos online', 'templates', 'dark aesthetic'],
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${playfair.variable} ${inter.variable}`}>
      <body className="bg-black text-white font-body antialiased">
        <Providers>
          <FloatingHearts />
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #ff007f',
                boxShadow: '0 0 10px #ff007f40',
              },
              success: {
                iconTheme: {
                  primary: '#ff007f',
                  secondary: '#000',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#000',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
