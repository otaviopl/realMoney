import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Edit, Trash2, Save, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { Categoria } from '../../types/types'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function GerenciadorCategorias({ isOpen, onClose, onSuccess }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'saida' as 'entrada' | 'saida'
  })
  const toast = useToast()
  const getToken = async () => (await supabase.auth.getSession()).data.session?.access_token || ''

  useEffect(() => { if (isOpen) carregarCategorias() }, [isOpen])

  const carregarCategorias = async () => {
    setLoading(true)
    try {
      const token = await getToken()
      if (token) {
        const res = await fetch('/api/categories', {
          headers: { 'sb-access-token': token }
        })
        const categoriasData = await res.json()
        setCategorias(categoriasData || [])
      } else {
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        setCategorias(categoriasLocal)
      }
    } catch (error) {
      setCategorias([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const token = await getToken()
      if (token) {
        const categoriaData = {
          nome: formData.nome,
          tipo: formData.tipo
        }
        const url = editingCategoria && editingCategoria.id
          ? `/api/categories/${editingCategoria.id}`
          : '/api/categories'
        const method = editingCategoria && editingCategoria.id ? 'PUT' : 'POST'
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'sb-access-token': token
          },
          body: JSON.stringify(categoriaData)
        })
        if (!res.ok) throw new Error('Erro ao salvar')
      } else {
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        if (editingCategoria && editingCategoria.id) {
          const index = categoriasLocal.findIndex((c: Categoria) => c.id === editingCategoria.id)
          if (index !== -1) {
            categoriasLocal[index] = { ...formData, id: editingCategoria.id, user_id: 'local', created_at: new Date().toISOString() }
          }
        } else {
          const novaCategoria = { ...formData, id: Date.now(), user_id: 'local', created_at: new Date().toISOString() }
          categoriasLocal.push(novaCategoria)
        }
        localStorage.setItem('categorias', JSON.stringify(categoriasLocal))
      }
      setFormData({ nome: '', tipo: 'saida' })
      setEditingCategoria(null)
      setShowForm(false)
      carregarCategorias()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Erro ao salvar categoria')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (categoria: Categoria) => {
    setFormData({ nome: categoria.nome, tipo: categoria.tipo })
    setEditingCategoria(categoria)
    setShowForm(true)
  }

  const handleDelete = async (categoria: Categoria) => {
    if (!confirm(`Tem certeza que deseja deletar a categoria "${categoria.nome}"?`)) return
    setLoading(true)
    try {
      const token = await getToken()
      if (token) {
        const res = await fetch(`/api/categories/${categoria.id}`, {
          method: 'DELETE',
          headers: { 'sb-access-token': token }
        })
        if (!res.ok) throw new Error('Erro ao deletar')
      } else {
        const categoriasLocal = JSON.parse(localStorage.getItem('categorias') || '[]')
        const categoriasFiltradas = categoriasLocal.filter((c: Categoria) => c.id !== categoria.id)
        localStorage.setItem('categorias', JSON.stringify(categoriasFiltradas))
      }
      carregarCategorias()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Erro ao deletar categoria')
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
              <Tag className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Categorias</h2>
              <p className="text-sm text-gray-500">Organize suas categorias</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        <div className="flex h-[calc(90vh-120px)]">
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Categorias</h3>
              <button onClick={() => { setShowForm(true); setEditingCategoria(null); setFormData({ nome: '', tipo: 'saida' }) }} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />
                <span>Nova Categoria</span>
              </button>
            </div>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Carregando categorias...</p>
              </div>
            ) : categorias.length === 0 ? (
              <div className="text-center py-8">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma categoria cadastrada</p>
                <p className="text-sm text-gray-400">Clique em "Nova Categoria" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {categorias.map((categoria) => (
                  <motion.div key={categoria.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${categoria.tipo === 'entrada' ? 'bg-green-100' : 'bg-red-100'}`}>
                          {categoria.tipo === 'entrada' ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{categoria.nome}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              categoria.tipo === 'entrada'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleEdit(categoria)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Editar categoria">
                          <Edit className="h-4 w-4 text-gray-500" />
                        </button>
                        <button onClick={() => handleDelete(categoria)} className="p-2 hover:bg-red-100 rounded-lg transition-colors" title="Deletar categoria">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ x: 300, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 300, opacity: 0 }} className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">{editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                  <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome *</label>
                    <input type="text" value={formData.nome} onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nome da categoria" required />
                  </div>
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
                  <div className="flex space-x-3">
                    <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading || !formData.nome} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center">{loading ? (<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>) : (<><Save className="h-4 w-4 mr-2" />{editingCategoria ? 'Atualizar' : 'Criar'}</>)}</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
} 