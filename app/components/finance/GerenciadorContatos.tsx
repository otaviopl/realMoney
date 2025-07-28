import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion } from 'framer-motion'
import { X, Save, User, ArrowUp, ArrowDown, Edit, Trash2, Plus } from 'lucide-react'
import { Contato } from '../../types/types'
import { supabase } from '../../lib/supabaseClient'

const getToken = async () =>
  (await supabase.auth.getSession()).data.session?.access_token || ''

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function GerenciadorContatos({ isOpen, onClose, onSuccess }: Props) {
  const [contatos, setContatos] = useState<Contato[]>([])
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '' as 'pagador' | 'recebedor' | ''
  })
  const toast = useToast()

  useEffect(() => {
    if (isOpen) {
      carregarContatos()
    }
  }, [isOpen])

  const carregarContatos = async () => {
    try {
      const token = await getToken()
      if (token) {
        const res = await fetch('/api/contacts', {
          headers: { 'sb-access-token': token }
        })
        const data = await res.json()
        setContatos(data || [])
      } else {
        const contatosLocal = JSON.parse(localStorage.getItem('contatos') || '[]')
        setContatos(contatosLocal)
      }
    } catch (error) {
      toast.error('Erro ao carregar contatos')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) return

    setLoading(true)
    try {
      const token = await getToken()
      if (token) {
        const contatoData = {
          nome: formData.nome,
          tipo: formData.tipo || null
        }
        const url = editingId ? `/api/contacts/${editingId}` : '/api/contacts'
        const method = editingId ? 'PUT' : 'POST'
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'sb-access-token': token
          },
          body: JSON.stringify(contatoData)
        })
        if (!res.ok) throw new Error('Erro ao salvar')
      } else {
        const contatosLocal = JSON.parse(localStorage.getItem('contatos') || '[]')
        if (editingId) {
          const index = contatosLocal.findIndex((c: any) => c.id === editingId)
          if (index !== -1) {
            contatosLocal[index] = {
              ...formData,
              id: editingId,
              user_id: 'local',
              created_at: new Date().toISOString()
            }
          }
        } else {
          const novoContato = {
            ...formData,
            id: Date.now(),
            user_id: 'local',
            created_at: new Date().toISOString()
          }
          contatosLocal.push(novoContato)
        }
        localStorage.setItem('contatos', JSON.stringify(contatosLocal))
      }

      setFormData({ nome: '', tipo: '' })
      setEditingId(null)
      await carregarContatos()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Erro ao salvar contato')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (contato: Contato) => {
    setFormData({ nome: contato.nome, tipo: contato.tipo || '' })
    setEditingId(contato.id || null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return

    setLoading(true)
    try {
      const token = await getToken()
      if (token) {
        const res = await fetch(`/api/contacts/${id}`, {
          method: 'DELETE',
          headers: { 'sb-access-token': token }
        })
        if (!res.ok) throw new Error('Erro ao excluir')
      } else {
        const contatosLocal = JSON.parse(localStorage.getItem('contatos') || '[]')
        const contatosFiltrados = contatosLocal.filter((c: any) => c.id !== id)
        localStorage.setItem('contatos', JSON.stringify(contatosFiltrados))
      }

      await carregarContatos()
      if (onSuccess) onSuccess()
    } catch (error) {
      toast.error('Erro ao excluir contato')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Gerenciar Contatos
              </h2>
              <p className="text-sm text-gray-500">Adicione e gerencie seus contatos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Contato *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nome do contato"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo (Opcional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo: '' }))}
                  className={`p-2 rounded-lg border-2 transition-colors text-center ${
                    formData.tipo === '' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-4 w-4 mx-auto mb-1 text-gray-600" />
                  <span className="text-xs">Geral</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo: 'pagador' }))}
                  className={`p-2 rounded-lg border-2 transition-colors text-center ${
                    formData.tipo === 'pagador' 
                      ? 'border-red-500 bg-red-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ArrowDown className="h-4 w-4 mx-auto mb-1 text-red-600" />
                  <span className="text-xs">Pagador</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo: 'recebedor' }))}
                  className={`p-2 rounded-lg border-2 transition-colors text-center ${
                    formData.tipo === 'recebedor' 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <ArrowUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
                  <span className="text-xs">Recebedor</span>
                </button>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading || !formData.nome.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingId ? 'Atualizar' : 'Adicionar'}
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ nome: '', tipo: '' })
                    setEditingId(null)
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>

          {/* Lista de Contatos */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium text-gray-900">Contatos ({contatos.length})</h3>
            {contatos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>Nenhum contato cadastrado</p>
                <p className="text-sm">Adicione seu primeiro contato acima</p>
              </div>
            ) : (
              <div className="space-y-2">
                {contatos.map((contato) => (
                  <div
                    key={contato.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        contato.tipo === 'pagador' ? 'bg-red-100' : 
                        contato.tipo === 'recebedor' ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {contato.tipo === 'pagador' ? (
                          <ArrowDown className="h-5 w-5 text-red-600" />
                        ) : contato.tipo === 'recebedor' ? (
                          <ArrowUp className="h-5 w-5 text-green-600" />
                        ) : (
                          <User className="h-5 w-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{contato.nome}</h4>
                        {contato.tipo && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            contato.tipo === 'pagador'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {contato.tipo === 'pagador' ? 'Pagador' : 'Recebedor'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(contato)}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Editar"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(contato.id!)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 