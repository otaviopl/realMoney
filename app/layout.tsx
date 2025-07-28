'use client'
import './globals.css'
import { ReactNode } from 'react'
import useThemeSwitcher from './hooks/useThemeSwitcher'

export default function RootLayout({ children }: { children: ReactNode }) {
  const { theme } = useThemeSwitcher()
  return (
    <html lang="pt-BR" className={theme}>
      <body className="min-h-screen bg-white text-gray-900 dark:bg-dark-bg dark:text-light-text">
        {children}
      </body>
    </html>
  )
}
