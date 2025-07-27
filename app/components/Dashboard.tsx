'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, 
  ChevronDown, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  DollarSign,
  Calendar,
  Edit3,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight,
  Plus
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { mockGastos, mockConfig } from '../lib/mockData'
import GraficoBarras from './GraficoBarras'
import GraficoLinha from './GraficoLinha'
import GraficoProgresso from './GraficoProgresso'
import Insight from './Insight'
import Historico from './Historico'
import Configuracoes from './Configuracoes'
import Formulario from './Formulario'
import type { 
  GastosMensais, 
  GraficoGastos, 
  GraficoEvolucao, 
  Insight as InsightType,
  Configuracoes as ConfiguracoesType
} from '../types/types'

export default function Dashboard() {
  const [gastos, setGastos] = useState<GastosMensais[]>([])
  const [config, setConfig] = useState<ConfiguracoesType | null>(null)
  const [loading, setLoading] = useState(true)
  const [useLocalData, setUseLocalData] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'historico' | 'configuracoes' | 'formulario'>('dashboard')
  const [selectedMonth, setSelectedMonth] = useState<GastosMensais | null>(null)
  const [showMonthSelector, setShowMonthSelector] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Verificar se usuário está logado no Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Usuário logado - carregar dados do Supabase
        const { data: gastosData } = await supabase
          .from('gastos_mensais')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Mapear snake_case para camelCase
        const gastosMapeados = (gastosData || []).map(item => ({
          id: item.id,
          mes: item.mes,
          salarioLiquido: item.salario_liquido,
          cartaoCredito: item.cartao_credito,
          contasFixas: item.contas_fixas,
          hashish: item.hashish,
          mercado: item.mercado,
          gasolina: item.gasolina,
          flash: item.flash,
          metaEconomia: item.meta_economia,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }))

        setGastos(gastosMapeados)
        setSelectedMonth(gastosMapeados[0] || null)

        // Carregar configurações do usuário
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Mapear configurações se existirem
        const configMapeada = configData ? {
          id: configData.id,
          metaReserva: configData.meta_reserva,
          saldoInicial: configData.saldo_inicial,
          userId: configData.user_id,
        } : null

        setConfig(configMapeada)
        setUseLocalData(false)
        
      } else {
        // Usuário não logado - usar dados locais
        console.log('Usando dados locais')
        setUseLocalData(true)
        
        // Carregar dados do localStorage
        try {
          const localGastos = JSON.parse(localStorage.getItem('gastos') || '[]')
          if (localGastos.length > 0) {
            setGastos(localGastos)
            setSelectedMonth(localGastos[0])
          } else {
            setGastos(mockGastos)
            setSelectedMonth(mockGastos[0])
          }

          const localConfig = JSON.parse(localStorage.getItem('config') || 'null')
          if (localConfig) {
            setConfig(localConfig)
          } else {
            setConfig(mockConfig)
          }
        } catch (localError) {
          console.log('Erro ao carregar dados locais, usando mockados')
          setGastos(mockGastos)
          setSelectedMonth(mockGastos[0])
          setConfig(mockConfig)
        }
      }
    } catch (error) {
      console.log('Erro ao carregar dados do Supabase, usando locais')
      setUseLocalData(true)
      
      // Fallback para dados locais
      try {
        const localGastos = JSON.parse(localStorage.getItem('gastos') || '[]')
        if (localGastos.length > 0) {
          setGastos(localGastos)
          setSelectedMonth(localGastos[0])
        } else {
          setGastos(mockGastos)
          setSelectedMonth(mockGastos[0])
        }

        const localConfig = JSON.parse(localStorage.getItem('config') || 'null')
        if (localConfig) {
          setConfig(localConfig)
        } else {
          setConfig(mockConfig)
        }
      } catch (localError) {
        console.log('Erro ao carregar dados locais, usando mockados')
        setGastos(mockGastos)
        setSelectedMonth(mockGastos[0])
        setConfig(mockConfig)
      }
    } finally {
      setLoading(false)
    }
  }

  const calcularSobra = (item: GastosMensais) => {
    const totalGastos = item.cartaoCredito + item.contasFixas + item.hashish + item.mercado + item.gasolina
    return item.salarioLiquido + item.flash - totalGastos
  }

  const calcularDadosGraficoGastos = (): GraficoGastos[] => {
    if (!selectedMonth) return []

    const totalGastos = selectedMonth.cartaoCredito + selectedMonth.contasFixas + selectedMonth.hashish + selectedMonth.mercado + selectedMonth.gasolina

    return [
      { categoria: 'Cartão de Crédito', valor: selectedMonth.cartaoCredito, porcentagem: (selectedMonth.cartaoCredito / totalGastos) * 100 },
      { categoria: 'Contas Fixas', valor: selectedMonth.contasFixas, porcentagem: (selectedMonth.contasFixas / totalGastos) * 100 },
      { categoria: 'Hashish', valor: selectedMonth.hashish, porcentagem: (selectedMonth.hashish / totalGastos) * 100 },
      { categoria: 'Mercado', valor: selectedMonth.mercado, porcentagem: (selectedMonth.mercado / totalGastos) * 100 },
      { categoria: 'Gasolina', valor: selectedMonth.gasolina, porcentagem: (selectedMonth.gasolina / totalGastos) * 100 },
    ]
  }

  const calcularDadosGraficoEvolucao = (): GraficoEvolucao[] => {
    return gastos.map(item => ({
      mes: item.mes,
      sobra: calcularSobra(item),
      acumulado: 0 // Será calculado abaixo
    })).map((item, index, array) => ({
      ...item,
      acumulado: array.slice(0, index + 1).reduce((acc, curr) => acc + curr.sobra, 0)
    }))
  }

  const calcularInsight = (): InsightType => {
    const dadosEvolucao = calcularDadosGraficoEvolucao()
    const valorAtual = dadosEvolucao.length > 0 ? dadosEvolucao[dadosEvolucao.length - 1].acumulado : 0
    const meta = config?.metaReserva || 12000
    
    if (valorAtual >= meta) {
      return {
        mesesParaMeta: 0,
        valorAtual,
        meta,
        mensagem: 'Parabéns! Você atingiu sua meta!'
      }
    }

    const mediaSobra = dadosEvolucao.length > 0 
      ? dadosEvolucao.reduce((acc, item) => acc + item.sobra, 0) / dadosEvolucao.length 
      : 0

    const mesesParaMeta = mediaSobra > 0 ? Math.ceil((meta - valorAtual) / mediaSobra) : 0

    return {
      mesesParaMeta,
      valorAtual,
      meta,
      mensagem: `Você vai atingir R$${meta.toLocaleString('pt-BR')} em ${mesesParaMeta} meses`
    }
  }

  const handleEditar = (item: GastosMensais) => {
    if (useLocalData) {
      alert('Funcionalidade de edição disponível apenas com Supabase configurado')
    } else {
      setSelectedMonth(item)
      setActiveTab('formulario')
    }
  }

  const handleClonar = (item: GastosMensais) => {
    if (useLocalData) {
      alert('Funcionalidade de clonagem disponível apenas com Supabase configurado')
    } else {
      // Implementar clonagem
      console.log('Clonar:', item)
    }
  }

  const getMoodAvatar = () => {
    if (!selectedMonth) return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', message: 'Carregando...' }
    
    const sobra = calcularSobra(selectedMonth)
    const meta = selectedMonth.metaEconomia
    
    if (sobra >= meta) {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', message: 'Está tudo em ordem!' }
    } else if (sobra >= meta * 0.7) {
      return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50', message: 'Quase lá!' }
    } else {
      return { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50', message: 'Atenção com os gastos!' }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sua dashboard...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Fixo */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">realMoney</h1>
              
              {selectedMonth && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 font-medium">{selectedMonth.mes}</span>
                  <button
                    onClick={() => setShowMonthSelector(!showMonthSelector)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('formulario')}
                className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Novo Mês
              </button>
              
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Seletor de Mês */}
      <AnimatePresence>
        {showMonthSelector && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-gray-200"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {gastos.slice(0, 12).map((gasto) => (
                  <button
                    key={gasto.id}
                    onClick={() => {
                      setSelectedMonth(gasto)
                      setShowMonthSelector(false)
                    }}
                    className={`p-3 text-sm rounded-lg border transition-colors ${
                      selectedMonth?.id === gasto.id
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {gasto.mes}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Aviso de modo local */}
              {useLocalData && (
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-yellow-50 border border-yellow-200 rounded-xl p-4"
                >
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-yellow-400 mr-3" />
                    <div>
                      <h3 className="text-sm font-medium text-yellow-800">
                        Modo Local
                      </h3>
                      <p className="text-sm text-yellow-700 mt-1">
                        Dados salvos localmente no navegador. Para sincronização na nuvem, faça login no Supabase.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Bloco 1 – Visão Geral */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {/* Saldo Atual */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Saldo Atual</h3>
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {selectedMonth ? calcularSobra(selectedMonth).toLocaleString('pt-BR') : '0'}
                    </span>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12%
                    </span>
                  </div>
                </motion.div>

                {/* Economia */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Economia</h3>
                    <PiggyBank className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {selectedMonth ? selectedMonth.metaEconomia.toLocaleString('pt-BR') : '0'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">meta</span>
                  </div>
                </motion.div>

                {/* Meta de Reserva */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Meta de Reserva</h3>
                    <Target className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900">
                      R$ {config?.metaReserva?.toLocaleString('pt-BR') || '12.000'}
                    </span>
                  </div>
                </motion.div>

                {/* Status */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    {(() => {
                      const mood = getMoodAvatar()
                      return (
                        <div className={`p-2 rounded-full ${mood.bg}`}>
                          <mood.icon className={`h-4 w-4 ${mood.color}`} />
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-sm text-gray-700">{getMoodAvatar().message}</p>
                </motion.div>
              </motion.div>

              {/* Bloco 2 – Gráficos */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Gráfico de Gastos */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Distribuição de Gastos</h3>
                    <PieChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <GraficoBarras data={calcularDadosGraficoGastos()} />
                </motion.div>

                {/* Gráfico de Evolução */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Evolução do Saldo</h3>
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <GraficoLinha data={calcularDadosGraficoEvolucao()} />
                </motion.div>
              </motion.div>

              {/* Bloco 3 – Insights */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
                  {(() => {
                    const mood = getMoodAvatar()
                    return (
                      <div className={`p-2 rounded-full ${mood.bg}`}>
                        <mood.icon className={`h-5 w-5 ${mood.color}`} />
                      </div>
                    )
                  })()}
                </div>
                <Insight insight={calcularInsight()} />
              </motion.div>

              {/* Bloco 4 – Detalhamento */}
              {selectedMonth && (
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Detalhamento do Mês</h3>
                    <button
                      onClick={() => handleEditar(selectedMonth)}
                      className="inline-flex items-center px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Salário Líquido</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.salarioLiquido.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Cartão de Crédito</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.cartaoCredito.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Contas Fixas</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.contasFixas.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Hashish</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedMonth.hashish}g
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Mercado</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.mercado.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Gasolina</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.gasolina.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Flash Recebido</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {selectedMonth.flash.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Sobra</p>
                      <p className="text-lg font-semibold text-green-600">
                        R$ {calcularSobra(selectedMonth).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'historico' && (
            <motion.div
              key="historico"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Historico 
                historico={gastos} 
                onEditar={handleEditar} 
                onClonar={handleClonar} 
              />
            </motion.div>
          )}

          {activeTab === 'configuracoes' && (
            <motion.div
              key="configuracoes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Configuracoes />
            </motion.div>
          )}

                     {activeTab === 'formulario' && (
             <motion.div
               key="formulario"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
             >
               <Formulario onBack={() => setActiveTab('dashboard')} />
             </motion.div>
           )}
        </AnimatePresence>
      </main>

      {/* Tabs de Navegação */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'historico'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity className="h-5 w-5 mb-1" />
              <span className="text-xs">Histórico</span>
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'configuracoes'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Target className="h-5 w-5 mb-1" />
              <span className="text-xs">Config</span>
            </button>
            <button
              onClick={() => setActiveTab('formulario')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'formulario'
                  ? 'text-gray-900 bg-gray-100'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs">Novo</span>
            </button>
          </div>
        </div>
      </motion.nav>
    </div>
  )
}
