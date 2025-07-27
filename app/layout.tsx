import './globals.css'
import { ReactNode } from 'react'
import AuthButton from './components/AuthButton'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-50 text-gray-900">
        <header className="flex justify-end p-4">
          <AuthButton />
        </header>
        {children}
      </body>
    </html>
  )
}
