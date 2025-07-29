'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Plus, 
  Edit3, 
  Trash2, 
  Save,
  DollarSign,
  Calendar,
  Tag,
  Hash
} from 'lucide-react'
import { useToast } from '../../lib/useToast'
import { supabase } from '../../lib/supabaseClient'
import type { GastoMensal, Categoria } from '../../types/types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  mesSelecionado?: string
}

export default function GerenciadorGastos({ isOpen, onClose, onSuccess, mesSelecionado }: Props) {
  const [gastos, setGastos] = useState<GastoMensal[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingGasto, setEditingGasto] = useState<GastoMensal | null>(null)
  const [formData, setFormData] = useState<Partial<GastoMensal>>({
    mes: mesSelecionado || '',
    categoria_id: 0,
    quantidade: 0,
    valor_unitario: 0,
    valor_total: 0
  })
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      carregarDados()
    }
  }, [isOpen])

  useEffect(() => {
    if (mesSelecionado) {
      setFormData(prev => ({ ...prev, mes: mesSelecionado }))
    }
  }, [mesSelecionado])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Carregar gastos mensais
        const { data: gastosData } = await supabase
          .from('gastos_mensais')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        // Carregar categorias
        const { data: categoriasData } = await supabase
          .from('categorias')
          .select('*')
          .eq('user_id', user.id)
          .order('nome')

        setGastos(gastosData || [])
        setCategorias(categoriasData || [])
      } else {
        // Dados locais
        const gastosLocal = JSON.parse(localStorage.getItem('gastos_mensais') || '[]')
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        setGastos(gastosLocal)
        setCategorias(categoriasLocal)
      }
    } catch (error) {
      toast.error('Erro ao carregar dados')
      setGastos([])
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoria_id || formData.quantidade <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Calcular valor total se não foi informado
      const valorTotal = formData.valor_total || (formData.quantidade * (formData.valor_unitario || 0))
      
      const gastoData = {
        ...formData,
        valor_total: valorTotal,
        user_id: user?.id || 'local'
      }

      if (user) {
        if (editingGasto) {
          // Atualizar
          await supabase
            .from('gastos_mensais')
            .update(gastoData)
            .eq('id', editingGasto.id)
        } else {
          // Criar
          await supabase
            .from('gastos_mensais')
            .insert([gastoData])
        }
      } else {
        // Dados locais
        const gastosLocal = JSON.parse(localStorage.getItem('gastos_mensais') || '[]')
        
        if (editingGasto) {
          const index = gastosLocal.findIndex((g: GastoMensal) => g.id === editingGasto.id)
          if (index !== -1) {
            gastosLocal[index] = { ...gastoData, id: editingGasto.id, updated_at: new Date().toISOString() }
          }
        } else {
          const novoGasto = {
            ...gastoData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          gastosLocal.push(novoGasto)
        }
        
        localStorage.setItem('gastos_mensais', JSON.stringify(gastosLocal))
      }

      toast.success(editingGasto ? 'Gasto atualizado!' : 'Gasto criado!')
      setShowForm(false)
      setEditingGasto(null)
      setFormData({
        mes: mesSelecionado || '',
        categoria_id: 0,
        quantidade: 0,
        valor_unitario: 0,
        valor_total: 0
      })
      carregarDados()
      onSuccess()
    } catch (error) {
      toast.error('Erro ao salvar gasto')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (gasto: GastoMensal) => {
    setEditingGasto(gasto)
    setFormData(gasto)
    setShowForm(true)
  }

  const handleDelete = async (gasto: GastoMensal) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('gastos_mensais')
          .delete()
          .eq('id', gasto.id)
      } else {
        const gastosLocal = JSON.parse(localStorage.getItem('gastos_mensais') || '[]')
        const gastosFiltrados = gastosLocal.filter((g: GastoMensal) => g.id !== gasto.id)
        localStorage.setItem('gastos_mensais', JSON.stringify(gastosFiltrados))
      }

      toast.success('Gasto excluído!')
      carregarDados()
      onSuccess()
    } catch (error) {
      toast.error('Erro ao excluir gasto')
    } finally {
      setLoading(false)
    }
  }

  const getCategoriaInfo = (categoriaId: number) => {
    const categoria = categorias.find(c => c.id === categoriaId)
    return categoria || { nome: 'Categoria não encontrada', unidade: 'unidade', preco_unitario: 0 }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gastos Mensais</h2>
              <p className="text-sm text-gray-500">Gerencie suas categorias de gastos mensais</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {!showForm ? (
              <div className="space-y-6">
                {/* Actions */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Gastos Cadastrados</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Gasto
                  </button>
                </div>

                {/* Lista de Gastos */}
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Carregando gastos...</p>
                  </div>
                ) : gastos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DollarSign className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 mb-4">Nenhum gasto cadastrado</p>
                    <button
                      onClick={() => setShowForm(true)}
                      className="text-gray-900 underline"
                    >
                      Criar primeiro gasto
                    </button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {gastos.map((gasto) => {
                      const categoria = getCategoriaInfo(gasto.categoria_id)
                      return (
                        <motion.div
                          key={gasto.id}
                          layout
                          className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <Tag className="h-4 w-4 text-gray-600" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">{categoria.nome}</h4>
                                  <p className="text-sm text-gray-500">{gasto.mes}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">Quantidade:</span>
                                  <p className="font-medium">{gasto.quantidade} {categoria.unidade || 'unidades'}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Valor Unitário:</span>
                                  <p className="font-medium">R$ {(gasto.valor_unitario || 0).toLocaleString('pt-BR')}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Total:</span>
                                  <p className="font-medium text-green-600">R$ {(gasto.valor_total || 0).toLocaleString('pt-BR')}</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              <button
                                onClick={() => handleEdit(gasto)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              >
                                <Edit3 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(gasto)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* Form */
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingGasto ? 'Editar Gasto' : 'Novo Gasto'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingGasto(null)
                      setFormData({
                        mes: mesSelecionado || '',
                        categoria_id: 0,
                        quantidade: 0,
                        valor_unitario: 0,
                        valor_total: 0
                      })
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Calendar className="h-4 w-4 inline mr-1" />
                        Mês
                      </label>
                      <input
                        type="text"
                        value={formData.mes}
                        onChange={(e) => setFormData({...formData, mes: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="Ex: Janeiro 2024"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Tag className="h-4 w-4 inline mr-1" />
                        Categoria
                      </label>
                      <select
                        value={formData.categoria_id}
                        onChange={(e) => setFormData({...formData, categoria_id: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        required
                      >
                        <option value={0}>Selecione uma categoria</option>
                        {categorias.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.nome} ({categoria.unidade || 'unidade'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Hash className="h-4 w-4 inline mr-1" />
                        Quantidade
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.quantidade}
                        onChange={(e) => setFormData({...formData, quantidade: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Valor Unitário
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor_unitario}
                        onChange={(e) => setFormData({...formData, valor_unitario: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Valor Total (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.valor_total}
                        onChange={(e) => setFormData({...formData, valor_total: Number(e.target.value)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                        placeholder="Calculado automaticamente se vazio"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingGasto(null)
                        setFormData({
                          mes: mesSelecionado || '',
                          categoria_id: 0,
                          quantidade: 0,
                          valor_unitario: 0,
                          valor_total: 0
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}