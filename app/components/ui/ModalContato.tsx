'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion } from 'framer-motion'
import { X, Save, User, ArrowUp, ArrowDown } from 'lucide-react'
import { Contato } from '../../types/types'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingContato?: Contato | null
}

export default function ModalContato({ isOpen, onClose, onSuccess, editingContato }: Props) {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: '' as 'pagador' | 'recebedor' | ''
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (editingContato) {
      setFormData({
        nome: editingContato.nome || '',
        tipo: editingContato.tipo || ''
      })
    } else {
      setFormData({
        nome: '',
        tipo: ''
      })
    }
  }, [editingContato, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('Nome do contato é obrigatório')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      const contatoData = {
        user_id: user.id,
        nome: formData.nome.trim(),
        tipo: formData.tipo || null
      }

      if (editingContato?.id) {
        // Atualizar contato existente
        const { error } = await supabase
          .from('contatos')
          .update(contatoData)
          .eq('id', editingContato.id)
        
        if (error) throw error
        toast.success('Contato atualizado com sucesso!')
      } else {
        // Criar novo contato
        const { error } = await supabase
          .from('contatos')
          .insert([contatoData])
        
        if (error) throw error
        toast.success('Contato criado com sucesso!')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar contato:', error)
      toast.error(error.message || 'Erro ao salvar contato')
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
        className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingContato ? 'Editar Contato' : 'Novo Contato'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingContato ? 'Atualize os dados do contato' : 'Adicione um novo contato'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome do Contato *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Ex: João Silva, Empresa XYZ..."
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Contato (Opcional)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'recebedor' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'recebedor'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-300'
                }`}
              >
                <ArrowUp className="h-5 w-5" />
                <span>Recebedor</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'pagador' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'pagador'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300'
                }`}
              >
                <ArrowDown className="h-5 w-5" />
                <span>Pagador</span>
              </button>
            </div>
            
            {/* Botão para limpar seleção */}
            {formData.tipo && (
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: '' })}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                Limpar seleção
              </button>
            )}
          </div>

          {/* Explicação dos tipos */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Tipos de Contato</h4>
            <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              <p><strong>Recebedor:</strong> Pessoa ou empresa que você recebe dinheiro (cliente, empregador, etc.)</p>
              <p><strong>Pagador:</strong> Pessoa ou empresa para quem você paga (fornecedor, prestador, etc.)</p>
              <p><strong>Sem tipo:</strong> Contato genérico que pode ser usado para qualquer tipo de transação</p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : editingContato ? 'Atualizar' : 'Criar'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}