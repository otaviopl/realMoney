'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Save, Tag, TrendingUp, TrendingDown } from 'lucide-react'
import { Categoria } from '../../types/types'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingCategoria?: Categoria | null
}

export default function ModalCategoria({ isOpen, onClose, onSuccess, editingCategoria }: Props) {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'saida' as 'entrada' | 'saida',
    unidade: '',
    preco_unitario: '',
    icone: '',
    cor: '#3B82F6'
  })
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (editingCategoria) {
      setFormData({
        nome: editingCategoria.nome || '',
        tipo: editingCategoria.tipo || 'saida',
        unidade: editingCategoria.unidade || '',
        preco_unitario: editingCategoria.preco_unitario?.toString() || '',
        icone: editingCategoria.icone || '',
        cor: editingCategoria.cor || '#3B82F6'
      })
    } else {
      setFormData({
        nome: '',
        tipo: 'saida',
        unidade: '',
        preco_unitario: '',
        icone: '',
        cor: '#3B82F6'
      })
    }
  }, [editingCategoria, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('Nome da categoria é obrigatório')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Usuário não autenticado')
        return
      }

      const categoriaData = {
        user_id: user.id,
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        unidade: formData.unidade.trim() || null,
        preco_unitario: formData.preco_unitario ? parseFloat(formData.preco_unitario) : null,
        icone: formData.icone.trim() || null,
        cor: formData.cor
      }

      if (editingCategoria?.id) {
        // Atualizar categoria existente
        const { error } = await supabase
          .from('categorias')
          .update(categoriaData)
          .eq('id', editingCategoria.id)
        
        if (error) throw error
        toast.success('Categoria atualizada com sucesso!')
      } else {
        // Criar nova categoria
        const { error } = await supabase
          .from('categorias')
          .insert([categoriaData])
        
        if (error) throw error
        toast.success('Categoria criada com sucesso!')
      }

      if (onSuccess) onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao salvar categoria:', error)
      toast.error(error.message || 'Erro ao salvar categoria')
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
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Tag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {editingCategoria ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {editingCategoria ? 'Atualize os dados da categoria' : 'Adicione uma nova categoria'}
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
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Alimentação, Transporte, Salário..."
              required
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'entrada' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'entrada'
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-green-300'
                }`}
              >
                <TrendingUp className="h-5 w-5" />
                <span>Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tipo: 'saida' })}
                className={`flex items-center justify-center space-x-2 p-3 rounded-lg border-2 transition-colors ${
                  formData.tipo === 'saida'
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                    : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-red-300'
                }`}
              >
                <TrendingDown className="h-5 w-5" />
                <span>Saída</span>
              </button>
            </div>
          </div>

          {/* Unidade (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Unidade (Opcional)
            </label>
            <input
              type="text"
              value={formData.unidade}
              onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: kg, litros, unidades..."
            />
          </div>

          {/* Preço Unitário (Opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preço Unitário (Opcional)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
              <input
                type="number"
                step="0.01"
                value={formData.preco_unitario}
                onChange={(e) => setFormData({ ...formData, preco_unitario: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor da Categoria
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={formData.cor}
                onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="#3B82F6"
              />
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
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : editingCategoria ? 'Atualizar' : 'Criar'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}