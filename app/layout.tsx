'use client'
import './globals.css'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import useThemeSwitcher from './hooks/useThemeSwitcher'
import QueryProvider from './components/QueryProvider'

export default function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = useThemeSwitcher()
  return (
    <html lang="pt-BR" className={theme === 'dark' ? 'dark' : ''}>
      <head>
        <link rel="icon" href="/images/realMoney-white.ico" />
        <title>realMoney - Controle Financeiro</title>
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        <QueryProvider>
          {children}
          <Toaster position="top-center" />
        </QueryProvider>
      </body>
    </html>
  )
}
