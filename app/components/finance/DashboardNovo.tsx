'use client'
import { useEffect, useState } from 'react'
import { useToast } from '../../lib/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  DollarSign,
  Info,
  Zap,
  Activity,
  BarChart3,
  User
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { obterResumoDetalhado } from '../../lib/calculoAutomatico'
import type { 
  Configuracoes as ConfiguracoesType,
  Transacao,
  GastoMensal
} from '../../types/types'

interface DashboardData {
  resumoAtual: {
    totalEntradas: number
    totalSaidas: number
    totalDespesasForms: number
    saldoFinal: number
    detalhesCalculo: {
      formula: string
      entradas: number
      saidas: number
      salario: number
      despesasForms: number
      resultado: string
    }
  }
  resumosPorMes: any[]
  transacoes: Transacao[]
  gastosMensais: GastoMensal[]
  configuracoes: ConfiguracoesType
  categorias: any[]
  contatos: any[]
  estatisticas: {
    totalTransacoes: number
    totalCategorias: number
    totalContatos: number
    mesesComDados: number
  }
}

export default function DashboardNovo() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [mesSelecionado, setMesSelecionado] = useState<string>('')
  const toast = useToast()

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      // Buscar dados usando a nova API
      const token = await supabase.auth.getSession().then(session => session.data.session?.access_token)
      const response = await fetch('/api/dashboard', {
        headers: {
          'sb-access-token': token || '',
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar dados do dashboard')
      }

      const data = await response.json()
      setDashboardData(data)
      
      // Definir o mês mais recente como selecionado
      if (data.resumosPorMes.length > 0) {
        setMesSelecionado(data.resumosPorMes[0].mes)
      }

    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
      toast.error('Erro ao carregar dados do dashboard')
    } finally {
      setLoading(false)
    }
  }

  const obterResumoMes = (mes: string) => {
    if (!dashboardData) return null
    return dashboardData.resumosPorMes.find(resumo => resumo.mes === mes)
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="flex justify-center mb-4">
            <img 
              src="/images/realMoney-white.ico" 
              alt="realMoney Logo" 
              className="h-16 w-16 animate-pulse dark:filter dark:invert"
            />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dashboard...</p>
        </motion.div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">Erro ao carregar dados</p>
        </div>
      </div>
    )
  }

  const resumoMesSelecionado = obterResumoMes(mesSelecionado)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/images/realMoney-white.ico" 
                  alt="realMoney Logo" 
                  className="h-8 w-8 dark:filter dark:invert"
                />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">realMoney</h1>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Novo Schema</span>
              </div>
              
              {mesSelecionado && (
                <div className="flex items-center space-x-2">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{mesSelecionado}</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Cards Principais */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {/* Total Entradas */}
            <motion.div
              variants={cardVariants}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Total Entradas</h3>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-green-600">
                  R$ {dashboardData.resumoAtual.totalEntradas.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Todas as receitas do período
              </p>
            </motion.div>

            {/* Total Saídas */}
            <motion.div
              variants={cardVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Saídas</h3>
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-red-600">
                  R$ {dashboardData.resumoAtual.totalSaidas.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                Todas as despesas registradas
              </p>
            </motion.div>

            {/* Despesas dos Forms */}
            <motion.div
              variants={cardVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Despesas Forms</h3>
                <PiggyBank className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-purple-600">
                  R$ {dashboardData.resumoAtual.totalDespesasForms.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                Gastos categorizados mensais
              </p>
            </motion.div>

            {/* Saldo Final */}
            <motion.div
              variants={cardVariants}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Saldo Final</h3>
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex items-baseline">
                <span className={`text-3xl font-bold ${
                  dashboardData.resumoAtual.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  R$ {dashboardData.resumoAtual.saldoFinal.toLocaleString('pt-BR')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                Nova fórmula aplicada
              </p>
            </motion.div>
          </motion.div>

          {/* Explicação da Nova Fórmula */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Nova Fórmula de Cálculo</h3>
                <p className="text-gray-500 dark:text-gray-400">Baseado no novo schema: (Entradas) - (Saídas) - (Salário - Despesas dos Forms)</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-100 dark:border-blue-700">
              <div className="flex items-start space-x-3">
                <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Fórmula Aplicada</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {dashboardData.resumoAtual.detalhesCalculo.resultado}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Estatísticas Gerais */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Estatísticas Gerais</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.estatisticas.totalTransacoes}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Transações</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.estatisticas.totalCategorias}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Categorias</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.estatisticas.totalContatos}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Contatos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {dashboardData.estatisticas.mesesComDados}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Meses</div>
              </div>
            </div>
          </motion.div>

          {/* Lista de Resumos por Mês */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Resumo por Mês</h3>
            
            <div className="space-y-4">
              {dashboardData.resumosPorMes.map((resumo, index) => (
                <div 
                  key={resumo.mes}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    mesSelecionado === resumo.mes
                      ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                      : 'bg-gray-50 border-gray-200 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                  onClick={() => setMesSelecionado(resumo.mes)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{resumo.mes}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Entradas: R$ {resumo.totalEntradas.toLocaleString('pt-BR')} | 
                        Saídas: R$ {resumo.totalSaidas.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className={`text-lg font-semibold ${
                      resumo.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      R$ {resumo.saldoFinal.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}