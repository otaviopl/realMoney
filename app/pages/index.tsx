'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../lib/useToast'
import { supabase } from '../lib/supabaseClient'
import { mockGastos, mockConfig } from '../lib/mockData'
import Auth from '../components/ui/Auth'
import Dashboard from '../components/finance/Dashboard'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [useLocalData, setUseLocalData] = useState(false)
  const toast = useToast()

  useEffect(() => {
    // Verificar usuário atual
    const checkUser = async () => {
      try {
        // Verificar usuário do Supabase
        const { data: { user } } = await supabase.auth.getUser()
        
        if (user) {
          setUser(user)
          setUseLocalData(false)
        } else {
          // Se não tem usuário, verificar se tem dados locais
          const localUser = localStorage.getItem('currentUser')
          if (localUser) {
            setUser(JSON.parse(localUser))
            setUseLocalData(true)
          }
        }
      } catch (error) {
        toast.error('Erro ao verificar usuário')
        // Em caso de erro, usar dados locais se disponível
        const localUser = localStorage.getItem('currentUser')
        if (localUser) {
          setUser(JSON.parse(localUser))
          setUseLocalData(true)
        }
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null)
          setUseLocalData(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setUseLocalData(false)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      if (useLocalData) {
        // Limpar dados locais
        localStorage.removeItem('currentUser')
        localStorage.removeItem('gastos')
        localStorage.removeItem('config')
        setUser(null)
        setUseLocalData(false)
      } else {
        // Fazer logout do Supabase
        await supabase.auth.signOut()
      }
    } catch (error) {
      toast.error('Erro ao fazer logout')
    }
  }

  const handleMockLogin = () => {
    setUseLocalData(true)
    setUser({ email: 'teste@exemplo.com', id: 'mock-user' })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/realMoney-white.ico" 
              alt="realMoney Logo" 
              className="h-12 w-12 animate-pulse"
            />
          </div>
          <div className="text-gray-600">Carregando...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-lg">
          <div>
            <div className="flex justify-center mb-4">
              <img 
                src="/images/realMoney-white.ico" 
                alt="realMoney Logo" 
                className="h-16 w-16"
              />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              realMoney
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Sistema de controle financeiro pessoal
            </p>
          </div>
          
          <div className="space-y-4">
            <Auth />
            
            <div className="text-center">
              <div className="text-sm text-gray-500 mb-2">ou</div>
              <button
                onClick={handleMockLogin}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Testar com dados mockados
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <img 
                src="/images/realMoney-white.ico" 
                alt="realMoney Logo" 
                className="h-6 w-6"
              />
              <h1 className="text-xl font-bold text-gray-900">realMoney</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              {useLocalData && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Modo Local
                </span>
              )}
              <button
                onClick={handleSignOut}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard />
      </main>
    </div>
  )
}
