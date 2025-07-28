'use client'
import './globals.css'
import { ReactNode } from 'react'
import useThemeSwitcher from './hooks/useThemeSwitcher'

export default function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = useThemeSwitcher()
  return (
    <html lang="pt-BR" className={theme === 'dark' ? 'dark' : ''}>
      <body className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
        {children}
      </body>
    </html>
  )
}
