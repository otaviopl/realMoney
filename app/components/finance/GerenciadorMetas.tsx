'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  AlertTriangle, 
  DollarSign, 
  Percent, 
  Calendar,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Meta, Categoria } from '../../types/types'

interface Props {
  onClose?: () => void
  onSuccess?: () => void
}

export default function GerenciadorMetas({ onClose, onSuccess }: Props) {
  const [metas, setMetas] = useState<Meta[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null)
  const [formData, setFormData] = useState<Partial<Meta>>({
    nome: '',
    tipo: 'valor_fixo',
    valor: 0,
    periodo: 'mensal',
    ativa: true,
    alertaEm: 80
  })
  const toast = useToast()

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Carregar metas do Supabase
        const { data: metasData } = await supabase
          .from('metas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (metasData) {
          setMetas(metasData.map(m => ({
            id: m.id,
            nome: m.nome,
            tipo: m.tipo,
            valor: m.valor,
            categoriaId: m.categoria_id,
            periodo: m.periodo,
            ativa: m.ativa,
            alertaEm: m.alerta_em,
            createdAt: m.created_at,
            userId: m.user_id
          })))
        }

        // Carregar categorias
        const { data: categoriasData } = await supabase
          .from('categorias')
          .select('*')
          .eq('user_id', user.id)

        if (categoriasData) {
          setCategorias(categoriasData)
        }
      } else {
        // Carregar dados locais
        const metasLocal = JSON.parse(localStorage.getItem('metas') || '[]')
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        setMetas(metasLocal)
        setCategorias(categoriasLocal)
      }
    } catch (error) {
      toast.error('Erro ao carregar metas')
      // Fallback para dados locais
      const metasLocal = JSON.parse(localStorage.getItem('metas') || '[]')
      const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
      setMetas(metasLocal)
      setCategorias(categoriasLocal)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const metaData = {
          user_id: user.id,
          nome: formData.nome,
          tipo: formData.tipo,
          valor: formData.valor,
          categoria_id: formData.categoriaId || null,
          periodo: formData.periodo,
          ativa: formData.ativa,
          alerta_em: formData.alertaEm
        }

        if (editingMeta && editingMeta.id) {
          const { error } = await supabase
            .from('metas')
            .update(metaData)
            .eq('id', editingMeta.id)

          if (error) throw error
        } else {
          const { error } = await supabase
            .from('metas')
            .insert([metaData])

          if (error) throw error
        }
      } else {
        // Salvar localmente
        const metasLocal = JSON.parse(localStorage.getItem('metas') || '[]')
        
        if (editingMeta && editingMeta.id) {
          const index = metasLocal.findIndex((m: Meta) => m.id === editingMeta.id)
          if (index !== -1) {
            metasLocal[index] = {
              ...formData,
              id: editingMeta.id,
              updatedAt: new Date().toISOString()
            }
          }
        } else {
          const novaMeta = {
            ...formData,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          metasLocal.push(novaMeta)
        }
        
        localStorage.setItem('metas', JSON.stringify(metasLocal))
      }

      // Reset form
      setFormData({
        nome: '',
        tipo: 'valor_fixo',
        valor: 0,
        periodo: 'mensal',
        ativa: true,
        alertaEm: 80
      })
      setEditingMeta(null)
      setShowForm(false)
      carregarDados()
      
      if (onSuccess) onSuccess()
      
    } catch (error) {
      toast.error('Erro ao salvar meta')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (meta: Meta) => {
    setFormData({
      nome: meta.nome,
      tipo: meta.tipo,
      valor: meta.valor,
      categoriaId: meta.categoriaId,
      periodo: meta.periodo,
      ativa: meta.ativa,
      alertaEm: meta.alertaEm
    })
    setEditingMeta(meta)
    setShowForm(true)
  }

  const handleDelete = async (meta: Meta) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('metas')
          .delete()
          .eq('id', meta.id)

        if (error) throw error
      } else {
        const metasLocal = JSON.parse(localStorage.getItem('metas') || '[]')
        const novasMetas = metasLocal.filter((m: Meta) => m.id !== meta.id)
        localStorage.setItem('metas', JSON.stringify(novasMetas))
      }

      carregarDados()
      
    } catch (error) {
      toast.error('Erro ao excluir meta')
    }
  }

  const toggleMeta = async (meta: Meta) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { error } = await supabase
          .from('metas')
          .update({ ativa: !meta.ativa })
          .eq('id', meta.id)

        if (error) throw error
      } else {
        const metasLocal = JSON.parse(localStorage.getItem('metas') || '[]')
        const index = metasLocal.findIndex((m: Meta) => m.id === meta.id)
        if (index !== -1) {
          metasLocal[index].ativa = !meta.ativa
          localStorage.setItem('metas', JSON.stringify(metasLocal))
        }
      }

      carregarDados()
      
    } catch (error) {
      toast.error('Erro ao atualizar meta')
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'valor_fixo':
        return DollarSign
      case 'porcentagem_salario':
        return Percent
      case 'limite_categoria':
        return AlertTriangle
      default:
        return Target
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Target className="h-6 w-6 text-gray-400" />
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Metas</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Metas */}
      <div className="space-y-4 mb-6">
        {metas.map((meta) => {
          const TipoIcon = getTipoIcon(meta.tipo)
          const categoria = categorias.find(c => c.id === meta.categoriaId)
          
          return (
            <motion.div
              key={meta.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-xl border-2 p-4 transition-all ${
                meta.ativa ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-lg ${meta.ativa ? 'bg-gray-100' : 'bg-gray-200'}`}>
                    <TipoIcon className={`h-5 w-5 ${meta.ativa ? 'text-gray-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className={`font-medium ${meta.ativa ? 'text-gray-900' : 'text-gray-500'}`}>
                      {meta.nome}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span>
                        {meta.tipo === 'valor_fixo' && `R$ ${meta.valor.toLocaleString('pt-BR')}`}
                        {meta.tipo === 'porcentagem_salario' && `${meta.valor}% do salário`}
                        {meta.tipo === 'limite_categoria' && `Limite: R$ ${meta.valor.toLocaleString('pt-BR')}`}
                      </span>
                      <span>•</span>
                      <span>{meta.periodo === 'mensal' ? 'Mensal' : 'Anual'}</span>
                      {categoria && (
                        <>
                          <span>•</span>
                          <span className="flex items-center space-x-1">
                            <span>{categoria.icone}</span>
                            <span>{categoria.nome}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMeta(meta)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      meta.ativa 
                        ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {meta.ativa ? 'Ativa' : 'Inativa'}
                  </button>
                  <button
                    onClick={() => handleEdit(meta)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(meta)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {metas.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">Nenhuma meta configurada</p>
            <p className="text-sm text-gray-400">Crie suas primeiras metas para acompanhar seus objetivos financeiros</p>
          </div>
        )}
      </div>

      {/* Formulário Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingMeta ? 'Editar Meta' : 'Nova Meta'}
                  </h3>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Nome da Meta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Meta
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Economia para viagem"
                      required
                    />
                  </div>

                  {/* Tipo de Meta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Meta
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                    >
                      <option value="valor_fixo">Valor Fixo</option>
                      <option value="porcentagem_salario">% do Salário</option>
                      <option value="limite_categoria">Limite por Categoria</option>
                    </select>
                  </div>

                  {/* Valor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {formData.tipo === 'porcentagem_salario' ? 'Porcentagem (%)' : 'Valor (R$)'}
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      type="number"
                      step={formData.tipo === 'porcentagem_salario' ? '1' : '0.01'}
                      value={formData.valor}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor: Number(e.target.value) }))}
                      required
                    />
                  </div>

                  {/* Categoria (apenas para limite_categoria) */}
                  {formData.tipo === 'limite_categoria' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Categoria
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        value={formData.categoriaId || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoriaId: e.target.value }))}
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categorias.map(categoria => (
                          <option key={categoria.id} value={categoria.id}>
                            {categoria.icone} {categoria.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Período */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Período
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      value={formData.periodo}
                      onChange={(e) => setFormData(prev => ({ ...prev, periodo: e.target.value as any }))}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="anual">Anual</option>
                    </select>
                  </div>

                  {/* Alerta em */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alertar quando atingir (%)
                    </label>
                    <input
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.alertaEm}
                      onChange={(e) => setFormData(prev => ({ ...prev, alertaEm: Number(e.target.value) }))}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'Salvando...' : (editingMeta ? 'Atualizar' : 'Criar')}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 