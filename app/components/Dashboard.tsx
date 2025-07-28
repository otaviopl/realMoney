'use client'
import { useEffect, useState } from 'react'
import { useToast } from '../lib/useToast'
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
  Plus,
  HelpCircle,
  Info,
  Zap,
  ChevronLeft,
  ChevronRight,
  Tag,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react'
import { supabase, formatarMes } from '../lib/supabaseClient'
import { mockGastos, mockConfig } from '../lib/mockData'
import GraficoBarras from './GraficoBarras'
import GraficoLinha from './GraficoLinha'
import GraficoProgresso from './GraficoProgresso'
import Insight from './Insight'
import InsightAvancado from './InsightAvancado'
import Historico from './Historico'
import Configuracoes from './Configuracoes'
import Formulario from './Formulario'
import ModalTransacao from './ModalTransacao'
import ModalNovoMes from './ModalNovoMes' // Adicionado import
import ListaTransacoes from './ListaTransacoes' // Adicionado import
import GerenciadorCategorias from './GerenciadorCategorias'
import GerenciadorContatos from './GerenciadorContatos'
import { gerarInsightAvancado } from '../lib/insightEngine'
import useThemeSwitcher from '../hooks/useThemeSwitcher'
import type { 
  GraficoGastos, 
  GraficoEvolucao, 
  Insight as InsightType,
  InsightAvancado as InsightAvancadoType,
  Configuracoes as ConfiguracoesType,
  Transacao,
  Categoria,
  GastosMensais,
  ResumoMensal
} from '../types/types'
import { 
  calcularResumoMensal,
  calcularSaldoAtual,
  calcularTotalEntradas,
  calcularTotalSaidas,
  calcularSobraMensal,
  deveAtualizarResumoAutomatico
} from '../lib/calculoAutomatico'

export default function Dashboard() {
  const { theme, toggleTheme } = useThemeSwitcher()
  const [gastos, setGastos] = useState<any[]>([])
  const [config, setConfig] = useState<ConfiguracoesType | null>(null)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [loading, setLoading] = useState(true)
  const [useLocalData, setUseLocalData] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'historico' | 'configuracoes' | 'formulario'>('dashboard')
  const [selectedMonth, setSelectedMonth] = useState<any | null>(null)
  const [showMonthSelector, setShowMonthSelector] = useState(false)
  const [editingMonth, setEditingMonth] = useState<any | null>(null)
  const [showModalTransacao, setShowModalTransacao] = useState(false)
  const [showModalNovoMes, setShowModalNovoMes] = useState(false)
  const [showGerenciadorCategorias, setShowGerenciadorCategorias] = useState(false)
  const [showGerenciadorContatos, setShowGerenciadorContatos] = useState(false)
  const [tipoTransacaoRapida, setTipoTransacaoRapida] = useState<'entrada' | 'saida'>('saida')
  const toast = useToast()

  useEffect(() => {
    carregarDados()
  }, [])

  // Função para associar transações aos meses corretos
  // Função para atualizar resumos automaticamente baseado nas transações
  const atualizarResumosAutomaticamente = async (
    resumos: any[],
    transacoes: Transacao[],
    categorias: Categoria[],
    userId: string
  ) => {
    for (const resumo of resumos) {
      const resumoCalculado = calcularResumoMensal(transacoes, categorias, resumo.mes)
      
      // Verificar se há diferenças significativas
      const camposParaAtualizar = [
        'salario_liquido',
        'cartao_credito',
        'contas_fixas',
        'hashish',
        'mercado',
        'gasolina',
        'flash',
        'outros'
      ]

      let precisaAtualizar = false
      const dadosAtualizados: any = {}

      camposParaAtualizar.forEach(campo => {
        const valorAtual = resumo[campo.replace('_', '')] || 0 // Converter snake_case para camelCase
        const valorCalculado = resumoCalculado[campo as keyof typeof resumoCalculado]
        
        // Só atualizar se o valor calculado existe e é diferente do atual
        if (valorCalculado !== undefined && Math.abs(Number(valorAtual) - Number(valorCalculado)) > 0.01) {
          dadosAtualizados[campo] = valorCalculado
          precisaAtualizar = true
        }
      })

      if (precisaAtualizar) {
        try {
          await supabase
            .from('resumo_mensal')
            .update(dadosAtualizados)
            .eq('id', resumo.id)
          
        } catch (error) {
          toast.error(`Erro ao atualizar resumo do mês ${resumo.mes}`)
        }
      }
    }
  }

  const associarTransacoesAosMeses = (resumos: any[], transacoes: Transacao[]) => {
    return resumos.map(resumo => {
      // Filtrar transações do mês específico usando toLowerCase para comparação
      const transacoesDoMes = transacoes.filter(transacao => {
        const dataTransacao = new Date(transacao.data)
        const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
        return mesTransacao.toLowerCase() === resumo.mes.toLowerCase()
      })
      
      return {
        ...resumo,
        transacoes: transacoesDoMes
      }
    })
  }

  // Função para limpar resumos duplicados
  const limparResumosDuplicados = async (userId: string) => {
    try {
      // Buscar todos os resumos do usuário
      const { data: resumos } = await supabase
        .from('resumo_mensal')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!resumos || resumos.length <= 1) return

      // Agrupar por mês/ano
      const gruposPorMes: { [key: string]: any[] } = {}
      
      resumos.forEach(resumo => {
        const mesAno = resumo.mes.split(' ')
        const chave = `${mesAno[0]}_${mesAno[1]}`
        
        if (!gruposPorMes[chave]) {
          gruposPorMes[chave] = []
        }
        gruposPorMes[chave].push(resumo)
      })

      // Para cada grupo com mais de um resumo, manter apenas o mais recente
      for (const [chave, grupo] of Object.entries(gruposPorMes)) {
        if (grupo.length > 1) {
          // Ordenar por created_at e manter apenas o mais recente
          grupo.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          
          // Deletar os resumos duplicados (exceto o primeiro/mais recente)
          for (let i = 1; i < grupo.length; i++) {
            await supabase
              .from('resumo_mensal')
              .delete()
              .eq('id', grupo[i].id)
            
          }
        }
      }
    } catch (error) {
      toast.error('Erro ao limpar resumos duplicados')
    }
  }

  const carregarDados = async () => {
    setLoading(true)
    try {
      // Verificar se usuário está logado no Supabase
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Limpar resumos duplicados antes de carregar
        await limparResumosDuplicados(user.id)
        // Usuário logado - carregar dados do Supabase
        const { data: resumosData } = await supabase
          .from('resumo_mensal')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Mapear snake_case para camelCase
        const resumosMapeados = (resumosData || []).map(item => ({
          id: item.id,
          mes: item.mes,
          salarioLiquido: item.salario_liquido || 0,
          cartaoCredito: item.cartao_credito || 0,
          contasFixas: item.contas_fixas || 0,
          hashish: item.hashish || 0,
          mercado: item.mercado || 0,
          gasolina: item.gasolina || 0,
          flash: item.flash || 0,
          metaEconomia: item.meta_economia || 0,
          outros: item.outros || 0,
          categoria: 'Geral',
          transacoes: [], // Transações serão carregadas separadamente
          createdAt: item.created_at,
          updatedAt: item.updated_at,
        }))

        // Carregar configurações do usuário
        const { data: configData } = await supabase
          .from('configuracoes')
          .select('*')
          .eq('user_id', user.id)
          .single()

        // Mapear configurações se existirem
        const configMapeada = configData ? {
          id: configData.id,
          meta_reserva: configData.meta_reserva,
          saldo_inicial: configData.saldo_inicial,
          user_id: configData.user_id,
        } : null

        setConfig(configMapeada)

        // Carregar transações do usuário
        const { data: transacoesData } = await supabase
          .from('transacoes')
          .select('*')
          .eq('user_id', user.id)
          .order('data', { ascending: false })

        const transacoesMapeadas = (transacoesData || []).map(t => ({
          id: t.id,
          user_id: t.user_id,
          data: t.data,
          valor: t.valor,
          tipo: t.tipo,
          categoria_id: t.categoria_id,
          contato_id: t.contato_id,
          descricao: t.descricao,
          created_at: t.created_at,
        }))

        setTransacoes(transacoesMapeadas)
        
        // Comentado para evitar zerar dados - a atualização agora é feita apenas ao adicionar transações
        // await atualizarResumosAutomaticamente(resumosMapeados, transacoesMapeadas, [], user.id)

        // Associar transações aos meses corretos
        const resumosComTransacoes = associarTransacoesAosMeses(resumosMapeados, transacoesMapeadas)
        setGastos(resumosComTransacoes)
        setSelectedMonth(resumosComTransacoes[0] || null)
        
        setUseLocalData(false)
        
      } else {
        // Usuário não logado - usar dados locais
        setUseLocalData(true)
        
        // Carregar dados do localStorage
        try {
          const localGastos = JSON.parse(localStorage.getItem('gastos') || '[]')
          const localTransacoes = JSON.parse(localStorage.getItem('transacoes') || '[]')
          
          if (localGastos.length > 0) {
            const gastosComTransacoes = associarTransacoesAosMeses(localGastos, localTransacoes)
            setGastos(gastosComTransacoes)
            setSelectedMonth(gastosComTransacoes[0])
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

          const transacoesMapeadas = localTransacoes.map((t: any) => ({
            id: t.id,
            userID: t.userID || 'local',
            tipo: t.tipo,
            valor: t.valor,
            data: t.data,
            categoriaID: t.categoriaID || t.categoriaId,
            contactID: t.contactID,
            observacoes: t.observacoes,
            mesAssociado: t.mesAssociado,
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
          }))
          setTransacoes(transacoesMapeadas)
        } catch (localError) {
          toast.error('Erro ao carregar dados locais, usando mockados')
          setGastos(mockGastos)
          setSelectedMonth(mockGastos[0])
          setConfig(mockConfig)
        }
      }
    } catch (error) {
      toast.error('Erro ao carregar dados do Supabase, usando locais')
      setUseLocalData(true)
      
      // Fallback para dados locais
      try {
        const localGastos = JSON.parse(localStorage.getItem('gastos') || '[]')
        const localTransacoes = JSON.parse(localStorage.getItem('transacoes') || '[]')
        
        if (localGastos.length > 0) {
          const gastosComTransacoes = associarTransacoesAosMeses(localGastos, localTransacoes)
          setGastos(gastosComTransacoes)
          setSelectedMonth(gastosComTransacoes[0])
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

        const transacoesMapeadas = localTransacoes.map((t: any) => ({
          id: t.id,
          userID: t.userID || 'local',
          categoriaID: t.categoriaID || t.categoriaId,
          contatoID: t.contatoID,
          createdAt: t.createdAt,
        }))
        setTransacoes(transacoesMapeadas)
      } catch (localError) {
        toast.error('Erro ao carregar dados locais, usando mockados')
        setGastos(mockGastos)
        setSelectedMonth(mockGastos[0])
        setConfig(mockConfig)
      }
    } finally {
      setLoading(false)
    }
  }

  const calcularSobra = (item: any) => {
    const custoHashish = item.hashish * 95; // Calculate total cost of hashish
    const totalGastos = item.cartaoCredito + item.contasFixas + custoHashish + item.mercado + item.gasolina + (item.outros || 0);
    return item.salarioLiquido + item.flash - totalGastos;
  }

  const calcularDadosGraficoGastos = (): GraficoGastos[] => {
    if (!selectedMonth) return []

    const custoHashish = selectedMonth.hashish * 95; // Calculate total cost of hashish
    const totalGastos = selectedMonth.cartaoCredito + selectedMonth.contasFixas + custoHashish + selectedMonth.mercado + selectedMonth.gasolina + (selectedMonth.outros || 0);

    return [
      { categoria: 'Cartão de Crédito', valor: selectedMonth.cartaoCredito, porcentagem: (selectedMonth.cartaoCredito / totalGastos) * 100, cor: '#ef4444' }, // vermelho
      { categoria: 'Contas Fixas', valor: selectedMonth.contasFixas, porcentagem: (selectedMonth.contasFixas / totalGastos) * 100, cor: '#fbbf24' }, // amarelo
      { categoria: 'Hashish', valor: custoHashish, porcentagem: (custoHashish / totalGastos) * 100, cor: '#a78bfa' }, // roxo
      { categoria: 'Mercado', valor: selectedMonth.mercado, porcentagem: (selectedMonth.mercado / totalGastos) * 100, cor: '#34d399' }, // verde
      { categoria: 'Gasolina', valor: selectedMonth.gasolina, porcentagem: (selectedMonth.gasolina / totalGastos) * 100, cor: '#60a5fa' }, // azul
      { categoria: 'Outros', valor: selectedMonth.outros || 0, porcentagem: ((selectedMonth.outros || 0) / totalGastos) * 100, cor: '#f472b6' }, // rosa
    ]
  }

  const calcularDadosGraficoEvolucao = (): GraficoEvolucao[] => {
    let acumulado = 0;
    return gastos.map(item => {
      const entrada = item.salarioLiquido + item.flash;
      const saida = item.cartaoCredito + item.contasFixas + (item.hashish * 95) + item.mercado + item.gasolina + (item.outros || 0);
      const sobra = entrada - saida;
      acumulado += sobra;
      return {
        mes: item.mes,
        entrada,
        saida,
        saldo: sobra,
        sobra,
        acumulado
      }
    })
  }

  const calcularInsight = (): InsightType => {
    const dadosEvolucao = calcularDadosGraficoEvolucao()
    const valorAtual = dadosEvolucao.length > 0 ? dadosEvolucao[dadosEvolucao.length - 1].acumulado : 0
    const meta = config?.meta_reserva || 12000
    
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
    // Converter de GastosMensais (camelCase) para ResumoMensal (snake_case)
    const resumoMensal: ResumoMensal = {
      id: item.id,
      user_id: '', // Será preenchido pelo modal
      mes: item.mes,
      salario_liquido: item.salarioLiquido,
      cartao_credito: item.cartaoCredito,
      contas_fixas: item.contasFixas,
      hashish: item.hashish,
      mercado: item.mercado,
      gasolina: item.gasolina,
      flash: item.flash,
      outros: item.outros || 0,
      meta_economia: item.metaEconomia,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }
    setEditingMonth(resumoMensal) // Define o mês para edição
    setShowModalNovoMes(true) // Abre o modal de edição
  }

  const handleClonar = (item: GastosMensais) => {
    // Criar uma cópia do item para clonagem
    const itemClonado = {
      ...item,
      id: undefined, // Remove o ID para criar um novo registro
      mes: `${item.mes} (Cópia)`, // Adiciona sufixo para identificar
    }
    setEditingMonth(itemClonado) // Define o item clonado para edição
    setShowModalNovoMes(true) // Abre o modal de novo mês
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header Fixo */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">realMoney</h1>
              
              {selectedMonth && (
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300 font-medium">{selectedMonth.mes}</span>
                  <button
                    onClick={() => setShowMonthSelector(!showMonthSelector)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {/* Botão de Toggle do Tema */}
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title={`Mudar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </button>
              
              <div className="relative">
                <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
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
            className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800"
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
                        ? 'bg-gray-900 dark:bg-blue-600 text-white border-gray-900 dark:border-blue-600'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
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
                  className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-300">Saldo Atual</h3>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Salário + Flash - Total de Gastos
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                      R$ {selectedMonth ? calcularSobra(selectedMonth).toLocaleString('pt-BR') : '0'}
                    </span>
                    <span className="ml-2 text-sm text-green-600 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +12%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedMonth && (
                      <>
                        R$ {selectedMonth.salarioLiquido.toLocaleString('pt-BR')} + R$ {selectedMonth.flash.toLocaleString('pt-BR')} - R$ {(selectedMonth.cartaoCredito + selectedMonth.contasFixas + selectedMonth.hashish * 95 + selectedMonth.mercado + selectedMonth.gasolina).toLocaleString('pt-BR')}
                      </>
                    )}
                  </p>
                </motion.div>

                {/* Economia */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Economia</h3>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Meta de economia mensal definida
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <PiggyBank className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      R$ {selectedMonth ? selectedMonth.metaEconomia.toLocaleString('pt-BR') : '0'}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">meta</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-300 mt-2">
                    Valor que você planeja economizar por mês
                  </p>
                </motion.div>

                {/* Meta de Reserva */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Meta de Reserva</h3>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Valor total que você quer acumular
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    <Target className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      R$ {config?.meta_reserva?.toLocaleString('pt-BR') || '12.000'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Valor total para sua reserva de emergência
                  </p>
                </motion.div>

                {/* Status */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-500">Status</h3>
                      <div className="group relative">
                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                          Baseado na sobra vs meta mensal
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const mood = getMoodAvatar()
                      return (
                        <div className={`p-2 rounded-full ${mood.bg}`}>
                          <mood.icon className={`h-4 w-4 ${mood.color}`} />
                        </div>
                      )
                    })()}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{getMoodAvatar().message}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {selectedMonth && (
                      <>
                        Sobra: R$ {calcularSobra(selectedMonth).toLocaleString('pt-BR')} | Meta: R$ {selectedMonth.metaEconomia.toLocaleString('pt-BR')}
                      </>
                    )}
                  </p>
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribuição de Gastos</h3>
                    <PieChart className="h-5 w-5 text-gray-400" />
                  </div>
                  <GraficoBarras data={calcularDadosGraficoGastos()} />
                </motion.div>

                {/* Gráfico de Evolução */}
                <motion.div
                  variants={cardVariants}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evolução do Saldo</h3>
                    <Activity className="h-5 w-5 text-gray-400" />
                  </div>
                  <GraficoLinha data={calcularDadosGraficoEvolucao()} />
                </motion.div>
              </motion.div>

              {/* Bloco 3 – Ações Rápidas */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ações Rápidas</h3>
                  <Activity className="h-5 w-5 text-gray-400" />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Botão Entrada */}
                  <button
                    onClick={() => {
                      setTipoTransacaoRapida('entrada')
                      setShowModalTransacao(true)
                    }}
                    className="flex items-center justify-center space-x-3 p-4 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors group"
                  >
                    <div className="p-2 bg-green-500 rounded-lg group-hover:bg-green-600 transition-colors">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-green-900">Nova Entrada</p>
                      <p className="text-sm text-green-600">Registrar receita</p>
                    </div>
                  </button>

                  {/* Botão Saída */}
                  <button
                    onClick={() => {
                      setTipoTransacaoRapida('saida')
                      setShowModalTransacao(true)
                    }}
                    className="flex items-center justify-center space-x-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg hover:bg-red-100 transition-colors group"
                  >
                    <div className="p-2 bg-red-500 rounded-lg group-hover:bg-red-600 transition-colors">
                      <TrendingDown className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-red-900">Nova Saída</p>
                      <p className="text-sm text-red-600">Registrar despesa</p>
                    </div>
                  </button>

                  {/* Botão Novo Mês */}
                  <button
                    onClick={() => setShowModalNovoMes(true)}
                    className="flex items-center justify-center space-x-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors group"
                  >
                    <div className="p-2 bg-gray-500 rounded-lg group-hover:bg-gray-600 transition-colors">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Novo Mês</p>
                      <p className="text-sm text-gray-600">Adicionar mês</p>
                    </div>
                  </button>
                </div>
              </motion.div>

              {/* Bloco 4 – Insights Avançados */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Insights Inteligentes</h3>
                  {(() => {
                    const mood = getMoodAvatar()
                    return (
                      <div className={`p-2 rounded-full ${mood.bg}`}>
                        <mood.icon className={`h-5 w-5 ${mood.color}`} />
                      </div>
                    )
                  })()}
                </div>
                <InsightAvancado 
                  insight={gerarInsightAvancado(gastos, config, transacoes)} 
                  gastosMensais={gastos}
                  transacoes={transacoes}
                />
              </motion.div>

              {/* Bloco 5 – Detalhamento */}
              {selectedMonth && (
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Detalhamento do Mês</h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditar(selectedMonth)}
                        className="inline-flex items-center px-3 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleClonar(selectedMonth)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Clonar
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Salário Líquido</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        R$ {selectedMonth.salarioLiquido.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Cartão de Crédito</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
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
                      <p className="text-sm text-gray-500 mb-1">Outros</p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {(selectedMonth.outros || 0).toLocaleString('pt-BR')}
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

              {/* Bloco 6 – Lista de Transações */}
              {selectedMonth && selectedMonth.transacoes && selectedMonth.transacoes.length > 0 && (
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Transações do Mês</h3>
                    <span className="text-sm text-gray-500">
                      {selectedMonth.transacoes.length} transação{selectedMonth.transacoes.length !== 1 ? 'ões' : ''}
                    </span>
                  </div>
                  <ListaTransacoes 
                    transacoes={selectedMonth.transacoes} 
                    categorias={[]} // TODO: Carregar categorias
                  />
                </motion.div>
              )}

              {/* Bloco 7 – Explicação dos Cálculos */}
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Info className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Como são calculados os dados?</h3>
                    <p className="text-gray-500 dark:text-gray-400">Entenda a lógica por trás dos números</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Saldo Atual</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Fórmula:</strong> Salário Líquido + Flash - Total de Gastos
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Total de Gastos = Cartão + Contas Fixas + (Hashish × R$ 95) + Mercado + Gasolina + Outros
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Status do Mês</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Verde:</strong> Sobra &gt;= Meta mensal
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Amarelo:</strong> Sobra &gt;= 70% da meta
                        </p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Vermelho:</strong> Sobra &lt; 70% da meta
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Evolução do Saldo</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Cálculo:</strong> Soma acumulada das sobras mensais
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Mostra o crescimento do seu patrimônio ao longo do tempo
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Previsão de Meta</h4>
                      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          <strong>Fórmula:</strong> (Meta Total - Valor Atual) / Média de Sobra Mensal
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Baseado na média histórica dos últimos meses
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Info className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Dica</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Quanto mais dados você adicionar, mais precisas serão as previsões e insights. 
                        Mantenha seus registros atualizados para ter uma visão clara do seu progresso financeiro.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
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
        </AnimatePresence>
      </main>

      {/* Tabs de Navegação */}
      <motion.nav
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <BarChart3 className="h-5 w-5 mb-1" />
              <span className="text-xs">Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('historico')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'historico'
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Activity className="h-5 w-5 mb-1" />
              <span className="text-xs">Histórico</span>
            </button>
            <button
              onClick={() => setActiveTab('configuracoes')}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === 'configuracoes'
                  ? 'text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Target className="h-5 w-5 mb-1" />
              <span className="text-xs">Config</span>
            </button>
            <button
              onClick={() => setShowGerenciadorCategorias(true)}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Tag className="h-5 w-5 mb-1" />
              <span className="text-xs">Categorias</span>
            </button>
            <button
              onClick={() => setShowGerenciadorContatos(true)}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <User className="h-5 w-5 mb-1" />
              <span className="text-xs">Contatos</span>
            </button>

            <button
              onClick={() => setShowModalNovoMes(true)}
              className="flex flex-col items-center py-2 px-3 rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <Plus className="h-5 w-5 mb-1" />
              <span className="text-xs">Novo</span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Modal de Transação */}
      <ModalTransacao
        isOpen={showModalTransacao}
        onClose={() => setShowModalTransacao(false)}
        onSuccess={() => {
          carregarDados() // Recarregar dados após nova transação
        }}
        mesSelecionado={selectedMonth?.mes}
      />

      {/* Modal de Novo Mês */}
      <ModalNovoMes
        isOpen={showModalNovoMes}
        onClose={() => {
          setShowModalNovoMes(false)
          setEditingMonth(null) // Limpa o mês em edição ao fechar
        }}
        onSuccess={() => {
          carregarDados() // Recarregar dados após novo mês
          setEditingMonth(null) // Limpa o mês em edição
        }}
        editingData={editingMonth}
      />

      {/* Modal de Gerenciador de Categorias */}
      <GerenciadorCategorias
        isOpen={showGerenciadorCategorias}
        onClose={() => setShowGerenciadorCategorias(false)}
        onSuccess={() => {
          carregarDados() // Recarregar dados após alterações nas categorias
        }}
      />

      {/* Modal de Gerenciador de Contatos */}
      <GerenciadorContatos
        isOpen={showGerenciadorContatos}
        onClose={() => setShowGerenciadorContatos(false)}
        onSuccess={() => {
          carregarDados() // Recarregar dados após alterações nos contatos
        }}
      />

    </div>
  )
}
