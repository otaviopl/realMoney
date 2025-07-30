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
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 5000, // 5 segundos em vez do padrão de 2-3 segundos
              style: {
                background: '#363636',
                color: '#fff',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                duration: 6000, // 6 segundos para mensagens de sucesso
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 8000, // 8 segundos para mensagens de erro (mais tempo para ler)
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </QueryProvider>
      </body>
    </html>
  )
}
