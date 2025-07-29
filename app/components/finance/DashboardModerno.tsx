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
  Plus,
  Edit3,
  Trash2,
  Eye,
  Calendar,
  User,
  Tag,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  CreditCard,
  TrendingUpIcon,
  TrendingDownIcon,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { 
  Configuracoes as ConfiguracoesType,
  Transacao,
  Categoria,
  Contato,
  GastoMensal
} from '../../types/types'

// Modais
import ModalTransacao from '../ui/ModalTransacao'
import ModalCategoria from '../ui/ModalCategoria'
import ModalContato from '../ui/ModalContato'

interface StatsCard {
  title: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: any
  color: string
  bgColor: string
}

interface ResumoMensal {
  mes: string
  totalEntradas: number
  totalSaidas: number
  saldoFinal: number
  transacoes: number
}

export default function DashboardModerno() {
  const [loading, setLoading] = useState(true)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [config, setConfig] = useState<ConfiguracoesType | null>(null)
  const [resumosMensais, setResumosMensais] = useState<ResumoMensal[]>([])
  const [mesSelecionado, setMesSelecionado] = useState<string>('')
  
  // Estados dos modais
  const [showModalTransacao, setShowModalTransacao] = useState(false)
  const [showModalCategoria, setShowModalCategoria] = useState(false)
  const [showModalContato, setShowModalContato] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'categories' | 'contacts'>('overview')

  const toast = useToast()

  useEffect(() => {
    carregarTodosOsDados()
  }, [])

  const carregarTodosOsDados = async () => {
    setLoading(true)
    try {
      await Promise.all([
        carregarTransacoes(),
        carregarCategorias(),
        carregarContatos(),
        carregarConfiguracoes()
      ])
      calcularResumosMensais()
    } catch (error) {
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const carregarTransacoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('transacoes')
          .select('*')
          .eq('user_id', user.id)
          .order('data', { ascending: false })
        setTransacoes(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
    }
  }

  const carregarCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('categorias')
          .select('*')
          .eq('user_id', user.id)
          .order('nome')
        setCategorias(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }

  const carregarContatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('contatos')
          .select('*')
          .eq('user_id', user.id)
          .order('nome')
        setContatos(data || [])
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    }
  }

  const carregarConfiguracoes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .single()
        setConfig(data)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    }
  }

  const calcularResumosMensais = () => {
    const resumos: { [key: string]: ResumoMensal } = {}
    
    transacoes.forEach(transacao => {
      const data = new Date(transacao.data)
      const mes = data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      
      if (!resumos[mes]) {
        resumos[mes] = {
          mes,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoFinal: 0,
          transacoes: 0
        }
      }
      
      resumos[mes].transacoes++
      
      if (transacao.tipo === 'entrada') {
        resumos[mes].totalEntradas += transacao.valor
      } else {
        resumos[mes].totalSaidas += transacao.valor
      }
      
      resumos[mes].saldoFinal = resumos[mes].totalEntradas - resumos[mes].totalSaidas
    })
    
    const resumosArray = Object.values(resumos).sort((a, b) => {
      // Melhor ordenação por data
      const [mesA, anoA] = a.mes.split(' ')
      const [mesB, anoB] = b.mes.split(' ')
      const dataA = new Date(`${anoA}-${obterNumeroMes(mesA)}-01`)
      const dataB = new Date(`${anoB}-${obterNumeroMes(mesB)}-01`)
      return dataB.getTime() - dataA.getTime()
    })
    
    setResumosMensais(resumosArray)
    
    if (resumosArray.length > 0 && !mesSelecionado) {
      setMesSelecionado(resumosArray[0].mes)
    }
  }

  const obterNumeroMes = (nomeMes: string): string => {
    const meses = {
      'janeiro': '01', 'fevereiro': '02', 'março': '03', 'abril': '04',
      'maio': '05', 'junho': '06', 'julho': '07', 'agosto': '08',
      'setembro': '09', 'outubro': '10', 'novembro': '11', 'dezembro': '12'
    }
    return meses[nomeMes.toLowerCase() as keyof typeof meses] || '01'
  }

  const obterEstatisticas = (): StatsCard[] => {
    const resumoAtual = resumosMensais.find(r => r.mes === mesSelecionado)
    const resumoAnterior = resumosMensais[resumosMensais.findIndex(r => r.mes === mesSelecionado) + 1]
    
    const totalEntradas = resumoAtual?.totalEntradas || 0
    const totalSaidas = resumoAtual?.totalSaidas || 0
    const saldoFinal = resumoAtual?.saldoFinal || 0
    
    const changeEntradas = resumoAnterior ? 
      ((totalEntradas - resumoAnterior.totalEntradas) / resumoAnterior.totalEntradas * 100) : 0
    const changeSaidas = resumoAnterior ? 
      ((totalSaidas - resumoAnterior.totalSaidas) / resumoAnterior.totalSaidas * 100) : 0
    const changeSaldo = resumoAnterior ? 
      ((saldoFinal - resumoAnterior.saldoFinal) / Math.abs(resumoAnterior.saldoFinal) * 100) : 0

    return [
      {
        title: 'Total Entradas',
        value: `R$ ${totalEntradas.toLocaleString('pt-BR')}`,
        change: `${changeEntradas > 0 ? '+' : ''}${changeEntradas.toFixed(1)}%`,
        trend: changeEntradas > 0 ? 'up' : changeEntradas < 0 ? 'down' : 'neutral',
        icon: TrendingUpIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      },
      {
        title: 'Total Saídas',
        value: `R$ ${totalSaidas.toLocaleString('pt-BR')}`,
        change: `${changeSaidas > 0 ? '+' : ''}${changeSaidas.toFixed(1)}%`,
        trend: changeSaidas > 0 ? 'up' : changeSaidas < 0 ? 'down' : 'neutral',
        icon: TrendingDownIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50'
      },
      {
        title: 'Saldo Final',
        value: `R$ ${saldoFinal.toLocaleString('pt-BR')}`,
        change: `${changeSaldo > 0 ? '+' : ''}${changeSaldo.toFixed(1)}%`,
        trend: saldoFinal > 0 ? 'up' : saldoFinal < 0 ? 'down' : 'neutral',
        icon: Wallet,
        color: saldoFinal > 0 ? 'text-green-600' : 'text-red-600',
        bgColor: saldoFinal > 0 ? 'bg-green-50' : 'bg-red-50'
      },
      {
        title: 'Meta de Reserva',
        value: `R$ ${config?.meta_reserva?.toLocaleString('pt-BR') || '0'}`,
        change: 'Meta anual',
        trend: 'neutral',
        icon: Target,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      }
    ]
  }

  const handleDeleteTransacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return
    
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Transação excluída com sucesso!')
      carregarTodosOsDados()
    } catch (error) {
      toast.error('Erro ao excluir transação')
    }
  }

  const handleDeleteCategoria = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return
    
    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Categoria excluída com sucesso!')
      carregarTodosOsDados()
    } catch (error) {
      toast.error('Erro ao excluir categoria')
    }
  }

  const handleDeleteContato = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return
    
    try {
      const { error } = await supabase
        .from('contatos')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      toast.success('Contato excluído com sucesso!')
      carregarTodosOsDados()
    } catch (error) {
      toast.error('Erro ao excluir contato')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Carregando dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">realMoney</h1>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Dashboard Moderno</span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={carregarTodosOsDados}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
              
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { key: 'overview', label: 'Visão Geral', icon: BarChart3 },
              { key: 'transactions', label: 'Transações', icon: Activity },
              { key: 'categories', label: 'Categorias', icon: Tag },
              { key: 'contacts', label: 'Contatos', icon: Users }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Seletor de Mês */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Financeiro</h2>
                <select
                  value={mesSelecionado}
                  onChange={(e) => setMesSelecionado(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  {resumosMensais.map((resumo) => (
                    <option key={resumo.mes} value={resumo.mes}>
                      {resumo.mes}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {obterEstatisticas().map((stat, index) => (
                  <motion.div
                    key={stat.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div className={`flex items-center space-x-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 
                        stat.trend === 'down' ? 'text-red-600' : 'text-gray-500'
                      }`}>
                        {stat.trend === 'up' && <ArrowUpRight className="h-4 w-4" />}
                        {stat.trend === 'down' && <ArrowDownRight className="h-4 w-4" />}
                        <span>{stat.change}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Resumo por Mês */}
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Resumo Mensal</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Mês</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Entradas</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Saídas</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Saldo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Transações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resumosMensais.map((resumo, index) => (
                        <tr key={resumo.mes} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                          <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">{resumo.mes}</td>
                          <td className="py-3 px-4 text-green-600">R$ {resumo.totalEntradas.toLocaleString('pt-BR')}</td>
                          <td className="py-3 px-4 text-red-600">R$ {resumo.totalSaidas.toLocaleString('pt-BR')}</td>
                          <td className={`py-3 px-4 font-medium ${resumo.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            R$ {resumo.saldoFinal.toLocaleString('pt-BR')}
                          </td>
                          <td className="py-3 px-4 text-gray-500 dark:text-gray-400">{resumo.transacoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModalTransacao(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Transação</span>
                </button>
              </div>

              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Data</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Valor</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transacoes.map((transacao) => {
                        const categoria = categorias.find(c => c.id === transacao.categoria_id)
                        return (
                          <tr key={transacao.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-4 px-6 text-gray-900 dark:text-white">
                              {new Date(transacao.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="py-4 px-6 text-gray-900 dark:text-white">{transacao.descricao || '-'}</td>
                            <td className="py-4 px-6">
                              {categoria ? (
                                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                                  {categoria.nome}
                                </span>
                              ) : '-'}
                            </td>
                            <td className={`py-4 px-6 font-medium ${
                              transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transacao.tipo === 'entrada' ? '+' : '-'}R$ {transacao.valor.toLocaleString('pt-BR')}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`px-2 py-1 rounded-full text-sm ${
                                transacao.tipo === 'entrada' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              }`}>
                                {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingItem(transacao)
                                    setShowModalTransacao(true)
                                  }}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                  <Edit3 className="h-4 w-4 text-gray-500" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTransacao(transacao.id!)}
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModalCategoria(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nova Categoria</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categorias.map((categoria) => (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          categoria.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
                        }`}>
                          <Tag className={`h-5 w-5 ${
                            categoria.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{categoria.nome}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingItem(categoria)
                            setShowModalCategoria(true)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit3 className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoria(categoria.id!)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {categoria.unidade && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Unidade: {categoria.unidade}
                        </p>
                      )}
                      {categoria.preco_unitario && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Preço unitário: R$ {categoria.preco_unitario.toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'contacts' && (
            <motion.div
              key="contacts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contatos</h2>
                <button
                  onClick={() => {
                    setEditingItem(null)
                    setShowModalContato(true)
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Novo Contato</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {contatos.map((contato) => (
                  <motion.div
                    key={contato.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{contato.nome}</h3>
                          {contato.tipo && (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {contato.tipo === 'pagador' ? 'Pagador' : 'Recebedor'}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingItem(contato)
                            setShowModalContato(true)
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Edit3 className="h-4 w-4 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteContato(contato.id!)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Criado em: {new Date(contato.created_at || '').toLocaleDateString('pt-BR')}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modais */}
      <ModalTransacao
        isOpen={showModalTransacao}
        onClose={() => {
          setShowModalTransacao(false)
          setEditingItem(null)
        }}
        onSuccess={() => {
          carregarTodosOsDados()
          setShowModalTransacao(false)
          setEditingItem(null)
        }}
        editingTransaction={editingItem}
      />

      <ModalCategoria
        isOpen={showModalCategoria}
        onClose={() => {
          setShowModalCategoria(false)
          setEditingItem(null)
        }}
        onSuccess={() => {
          carregarTodosOsDados()
          setShowModalCategoria(false)
          setEditingItem(null)
        }}
        editingCategoria={editingItem}
      />

      <ModalContato
        isOpen={showModalContato}
        onClose={() => {
          setShowModalContato(false)
          setEditingItem(null)
        }}
        onSuccess={() => {
          carregarTodosOsDados()
          setShowModalContato(false)
          setEditingItem(null)
        }}
        editingContato={editingItem}
      />
    </div>
  )
}