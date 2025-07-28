'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../lib/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Tag, Plus, User, Calendar, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react'
import { Transacao, Categoria, Contato } from '../types/types'
import { supabase } from '../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingTransaction?: Transacao | null
  mesSelecionado?: string
}

export default function ModalTransacao({ isOpen, onClose, onSuccess, editingTransaction, mesSelecionado }: Props) {
  const [formData, setFormData] = useState<Partial<Transacao>>({
    data: new Date().toISOString().split('T')[0],
    valor: 0,
    tipo: 'saida',
    categoria_id: undefined,
    contato_id: undefined,
    descricao: ''
  })
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(false)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState({ nome: '', tipo: 'saida' as 'entrada' | 'saida' })
  const toast = useToast()

  // Função para normalizar a formatação do mês
  const normalizarMes = (data: string): string => {
    const dataObj = new Date(data)
    return dataObj.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
  }

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        data: editingTransaction.data,
        valor: editingTransaction.valor,
        tipo: editingTransaction.tipo,
        categoria_id: editingTransaction.categoria_id,
        contato_id: editingTransaction.contato_id,
        descricao: editingTransaction.descricao
      })
    }
  }, [editingTransaction])

  useEffect(() => {
    if (isOpen) {
      carregarCategorias()
      carregarContatos()
    }
  }, [isOpen])

  const carregarCategorias = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: categoriasData } = await supabase
          .from('categorias')
          .select('*')
          .eq('user_id', user.id)
          .order('nome')
        if (categoriasData) setCategorias(categoriasData)
      } else {
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        setCategorias(categoriasLocal)
      }
    } catch (error) {}
  }

  const carregarContatos = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: contatosData } = await supabase
          .from('contatos')
          .select('*')
          .eq('user_id', user.id)
          .order('nome')
        if (contatosData) setContatos(contatosData)
      } else {
        const contatosLocal = JSON.parse(localStorage.getItem('contatos') || '[]')
        setContatos(contatosLocal)
      }
    } catch (error) {}
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const transacaoData = {
          user_id: user.id,
          data: formData.data,
          valor: formData.valor,
          tipo: formData.tipo,
          categoria_id: formData.categoria_id,
          contato_id: formData.contato_id,
          descricao: formData.descricao
        }
        
        // Se for uma transação de entrada, adicionar automaticamente ao salário do mês
        if (formData.tipo === 'entrada' && formData.valor > 0) {
          // Usar o mês selecionado se disponível, senão usar a data da transação
          const mesTransacao = mesSelecionado || normalizarMes(formData.data)
          
          // Função para atualizar apenas o salário sem afetar outros dados
          const atualizarSalario = async () => {
            // Buscar resumo mensal do mês da transação (usando toLowerCase para comparação)
            const { data: resumoData } = await supabase
              .from('resumo_mensal')
              .select('*')
              .eq('user_id', user.id)
              .ilike('mes', mesTransacao.toLowerCase())
              .single()
            
            if (resumoData) {
              // Atualizar apenas o salário líquido, mantendo os outros dados
              const novoSalario = (resumoData.salario_liquido || 0) + formData.valor
              await supabase
                .from('resumo_mensal')
                .update({ 
                  salario_liquido: novoSalario,
                  updated_at: new Date().toISOString()
                })
                .eq('id', resumoData.id)
              return true
            } else {
              // Se não encontrou resumo exato, buscar por correspondência parcial
              const mesAno = mesTransacao.toLowerCase().split(' ')
              const { data: resumosExistentes } = await supabase
                .from('resumo_mensal')
                .select('*')
                .eq('user_id', user.id)
                .ilike('mes', `%${mesAno[0]}%${mesAno[1]}%`)
              
              if (resumosExistentes && resumosExistentes.length > 0) {
                // Atualizar o primeiro resumo encontrado
                const resumoExistente = resumosExistentes[0]
                const novoSalario = (resumoExistente.salario_liquido || 0) + formData.valor
                await supabase
                  .from('resumo_mensal')
                  .update({ 
                    salario_liquido: novoSalario,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', resumoExistente.id)
                return true
              }
            }
            return false
          }
          
          // Tentar atualizar salário existente
          const atualizou = await atualizarSalario()
          
          // Só criar novo se não conseguiu atualizar nenhum existente
          if (!atualizou) {
            await supabase
              .from('resumo_mensal')
              .insert([{
                user_id: user.id,
                mes: mesTransacao,
                salario_liquido: formData.valor,
                cartao_credito: null,
                contas_fixas: null,
                hashish: null,
                mercado: null,
                gasolina: null,
                flash: null,
                outros: null,
                meta_economia: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }])
          }
        }
        
        if (editingTransaction && editingTransaction.id) {
          const { error } = await supabase
            .from('transacoes')
            .update(transacaoData)
            .eq('id', editingTransaction.id)
          if (error) throw error
        } else {
          const { error } = await supabase
            .from('transacoes')
            .insert([transacaoData])
          if (error) throw error
        }
      } else {
        // Se for uma transação de entrada, adicionar automaticamente ao salário do mês (localStorage)
        if (formData.tipo === 'entrada' && formData.valor > 0) {
          // Usar o mês selecionado se disponível, senão usar a data da transação
          const mesTransacao = mesSelecionado || normalizarMes(formData.data)
          
          // Buscar resumo mensal do mês da transação no localStorage
          const resumos = JSON.parse(localStorage.getItem('resumo_mensal') || '[]')
          
          // Buscar por correspondência exata primeiro (usando toLowerCase)
          let resumoIndex = resumos.findIndex((r: any) => r.mes.toLowerCase() === mesTransacao.toLowerCase())
          
          // Se não encontrar, buscar por correspondência parcial (mês e ano)
          if (resumoIndex === -1) {
            const mesAno = mesTransacao.toLowerCase().split(' ')
            resumoIndex = resumos.findIndex((r: any) => {
              const rMesAno = r.mes.toLowerCase().split(' ')
              return rMesAno[0] === mesAno[0] && rMesAno[1] === mesAno[1]
            })
          }
          
          if (resumoIndex !== -1) {
            // Atualizar apenas o salário líquido, mantendo os outros dados
            resumos[resumoIndex].salario_liquido = (resumos[resumoIndex].salario_liquido || 0) + formData.valor
            resumos[resumoIndex].updated_at = new Date().toISOString()
            localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
          } else {
            // Só criar novo se realmente não existir nenhum resumo para o mês
            const novoResumo = {
              id: Date.now(),
              user_id: 'local',
              mes: mesTransacao,
              salario_liquido: formData.valor,
              cartao_credito: null,
              contas_fixas: null,
              hashish: null,
              mercado: null,
              gasolina: null,
              flash: null,
              outros: null,
              meta_economia: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
            resumos.unshift(novoResumo)
            localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
          }
        }
        
        const transacoes = JSON.parse(localStorage.getItem('transacoes') || '[]')
        if (editingTransaction && editingTransaction.id) {
          const index = transacoes.findIndex((t: any) => t.id === editingTransaction.id)
          if (index !== -1) {
            transacoes[index] = {
              ...formData,
              id: editingTransaction.id,
              user_id: 'local',
              created_at: new Date().toISOString()
            }
          }
        } else {
          const novaTransacao = {
            ...formData,
            id: Date.now().toString(),
            user_id: 'local',
            created_at: new Date().toISOString()
          }
          transacoes.unshift(novaTransacao)
        }
        localStorage.setItem('transacoes', JSON.stringify(transacoes))
      }
      setFormData({
        data: new Date().toISOString().split('T')[0],
        valor: 0,
        tipo: 'saida',
        categoria_id: undefined,
        contato_id: undefined,
        descricao: ''
      })
      // Mostrar mensagem de sucesso
      let mensagem = ''
      if (editingTransaction && editingTransaction.id) {
        mensagem = 'Transação atualizada com sucesso!'
      } else {
        mensagem = 'Transação adicionada com sucesso!'
        if (formData.tipo === 'entrada' && formData.valor > 0) {
          const mesTransacao = mesSelecionado || normalizarMes(formData.data)
          mensagem += `\n\n💰 Valor de R$ ${formData.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} adicionado automaticamente ao salário de ${mesTransacao}!`
        }
      }
      toast.success(mensagem)
      
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      toast.error('Erro ao salvar transação')
    } finally {
      setLoading(false)
    }
  }

  const adicionarCategoria = async () => {
    if (!novaCategoria.nome.trim()) {
      toast.error('Por favor, insira um nome para a categoria')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('categorias')
          .insert([{ user_id: user.id, nome: novaCategoria.nome, tipo: novaCategoria.tipo }])
        if (error) throw error
      } else {
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        const novaCategoriaLocal = {
          ...novaCategoria,
          id: Date.now().toString(),
          user_id: 'local',
          created_at: new Date().toISOString()
        }
        categoriasLocal.push(novaCategoriaLocal)
        localStorage.setItem('categorias', JSON.stringify(categoriasLocal))
      }
      setNovaCategoria({ nome: '', tipo: 'saida' })
      setShowNovaCategoria(false)
      carregarCategorias()
    } catch (error) {
      toast.error('Erro ao adicionar categoria')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>
              <p className="text-sm text-gray-500">{mesSelecionado && `Mês: ${mesSelecionado}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tipo de Transação */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, tipo: 'entrada' }))} className={`p-3 rounded-lg border-2 transition-colors text-left ${formData.tipo === 'entrada' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="font-medium">Entrada</span>
                  </div>
                </button>
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, tipo: 'saida' }))} className={`p-3 rounded-lg border-2 transition-colors text-left ${formData.tipo === 'saida' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="font-medium">Saída</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Data *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="date" value={formData.data} onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" required />
              </div>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Valor *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input type="number" step="0.01" min="0" value={formData.valor} onChange={(e) => setFormData(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0,00" required />
              </div>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {categorias
                  .filter(categoria => categoria.tipo === formData.tipo)
                  .map((categoria) => (
                    <button key={categoria.id} type="button" onClick={() => setFormData(prev => ({ ...prev, categoria_id: Number(categoria.id) }))} className={`p-3 rounded-lg border-2 transition-colors text-left ${formData.categoria_id === Number(categoria.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <div className="flex items-center space-x-2">
                        <Tag className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">{categoria.nome}</span>
                      </div>
                    </button>
                  ))}
              </div>
              <button type="button" onClick={() => setShowNovaCategoria(true)} className="mt-2 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700">
                <Plus className="h-4 w-4" />
                <span>Adicionar nova categoria</span>
              </button>
            </div>

            {/* Contato */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contato</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <select className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.contato_id || ''} onChange={e => setFormData(prev => ({ ...prev, contato_id: e.target.value ? Number(e.target.value) : undefined }))}>
                  <option value="">Selecione um contato</option>
                  {contatos.map(contato => (
                    <option key={contato.id} value={contato.id}>{contato.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <textarea value={formData.descricao} onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))} className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Descrição da transação (opcional)" />
              </div>
            </div>

            {/* Botões */}
            <div className="flex space-x-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
              <button type="submit" disabled={loading || !formData.data || !formData.valor || !formData.tipo} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">{loading ? (<div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>) : (<><Save className="h-5 w-5 mr-2" />{editingTransaction ? 'Atualizar' : 'Salvar'}</>)}</button>
            </div>
          </form>

          {/* Modal para nova categoria */}
          <AnimatePresence>
            {showNovaCategoria && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-lg font-semibold mb-4">Nova Categoria</h3>
                  <div className="space-y-4">
                    <input type="text" placeholder="Nome da categoria" value={novaCategoria.nome} onChange={e => setNovaCategoria(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setNovaCategoria(prev => ({ ...prev, tipo: 'entrada' }))} className={`p-3 rounded-lg border-2 transition-colors text-left ${novaCategoria.tipo === 'entrada' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <span className="font-medium">Entrada</span>
                        </div>
                      </button>
                      <button type="button" onClick={() => setNovaCategoria(prev => ({ ...prev, tipo: 'saida' }))} className={`p-3 rounded-lg border-2 transition-colors text-left ${novaCategoria.tipo === 'saida' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                          <span className="font-medium">Saída</span>
                        </div>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button type="button" onClick={adicionarCategoria} disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{loading ? 'Salvando...' : 'Adicionar'}</button>
                      <button type="button" onClick={() => setShowNovaCategoria(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancelar</button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
} 