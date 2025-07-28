import './globals.css'
import { ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
