'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Save, Calendar, DollarSign, CreditCard, Home, Leaf, ShoppingCart, Fuel, Zap, Target, Plus } from 'lucide-react'
import { ResumoMensal } from '../types/types'
import { supabase } from '../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  editingData?: ResumoMensal | null
}

export default function ModalNovoMes({ isOpen, onClose, onSuccess, editingData }: Props) {
  const [formData, setFormData] = useState<Partial<ResumoMensal>>({
    mes: '',
    salario_liquido: 0,
    cartao_credito: 0,
    contas_fixas: 0,
    hashish: 0,
    mercado: 0,
    gasolina: 0,
    flash: 0,
    outros: 0,
    meta_economia: 0
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editingData) {
      setFormData({
        mes: editingData.mes,
        salario_liquido: editingData.salario_liquido || 0,
        cartao_credito: editingData.cartao_credito || 0,
        contas_fixas: editingData.contas_fixas || 0,
        hashish: editingData.hashish || 0,
        mercado: editingData.mercado || 0,
        gasolina: editingData.gasolina || 0,
        flash: editingData.flash || 0,
        outros: editingData.outros || 0,
        meta_economia: editingData.meta_economia || 0
      })
    } else {
      setFormData({
        mes: '',
        salario_liquido: 0,
        cartao_credito: 0,
        contas_fixas: 0,
        hashish: 0,
        mercado: 0,
        gasolina: 0,
        flash: 0,
        outros: 0,
        meta_economia: 0
      })
    }
  }, [editingData, isOpen])

  const handleChange = (field: keyof ResumoMensal, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Usuário logado - salvar no Supabase
        const supabaseData = {
          user_id: user.id,
          mes: formData.mes,
          salario_liquido: formData.salario_liquido,
          cartao_credito: formData.cartao_credito,
          contas_fixas: formData.contas_fixas,
          hashish: formData.hashish,
          mercado: formData.mercado,
          gasolina: formData.gasolina,
          flash: formData.flash,
          outros: formData.outros,
          meta_economia: formData.meta_economia,
        }

        if (editingData && editingData.id) {
          // Atualizar registro existente
          const { error } = await supabase
            .from('resumo_mensal')
            .update(supabaseData)
            .eq('id', editingData.id)

          if (error) throw error
          alert('Dados atualizados na nuvem com sucesso!')
        } else {
          // Inserir novo registro
          const { error } = await supabase
            .from('resumo_mensal')
            .insert([supabaseData])

          if (error) throw error
          alert('Dados salvos na nuvem com sucesso!')
        }
      } else {
        // Usuário não logado - salvar localmente
        const resumos = JSON.parse(localStorage.getItem('resumo_mensal') || '[]')
        
        if (editingData && editingData.id) {
          // Atualizar registro existente
          const index = resumos.findIndex((r: any) => r.id === editingData.id)
          if (index !== -1) {
            resumos[index] = {
              ...formData,
              id: editingData.id,
              updated_at: new Date().toISOString()
            }
            localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
            alert('Dados atualizados localmente!')
          }
        } else {
          // Inserir novo registro
          const newResumo = {
            ...formData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          resumos.unshift(newResumo)
          localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
          alert('Dados salvos localmente!')
        }
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      
      // Fallback para localStorage
      try {
        const resumos = JSON.parse(localStorage.getItem('resumo_mensal') || '[]')
        
        if (editingData && editingData.id) {
          // Atualizar registro existente
          const index = resumos.findIndex((r: any) => r.id === editingData.id)
          if (index !== -1) {
            resumos[index] = {
              ...formData,
              id: editingData.id,
              updated_at: new Date().toISOString()
            }
            localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
            alert('Dados atualizados localmente (fallback)!')
          }
        } else {
          // Inserir novo registro
          const newResumo = {
            ...formData,
            id: Date.now(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          resumos.unshift(newResumo)
          localStorage.setItem('resumo_mensal', JSON.stringify(resumos))
          alert('Dados salvos localmente (fallback)!')
        }
      } catch (localError) {
        alert('Erro ao salvar dados')
        console.error('Erro no fallback:', localError)
      }
    } finally {
      // Limpar formulário
      setFormData({
        mes: '',
        salario_liquido: 0,
        cartao_credito: 0,
        contas_fixas: 0,
        hashish: 0,
        mercado: 0,
        gasolina: 0,
        flash: 0,
        outros: 0,
        meta_economia: 0
      })
      setLoading(false)
      if (onSuccess) onSuccess()
      onClose()
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
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingData ? 'Editar Resumo Mensal' : 'Novo Resumo Mensal'}
              </h2>
              <p className="text-sm text-gray-500">Configure os gastos e receitas do mês</p>
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Mês */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mês *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.mes}
                  onChange={(e) => handleChange('mes', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Janeiro 2024"
                  required
                />
              </div>
            </div>

            {/* Receitas */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Receitas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Salário Líquido
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salario_liquido}
                      onChange={(e) => handleChange('salario_liquido', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gastos */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Gastos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cartão de Crédito
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cartao_credito}
                      onChange={(e) => handleChange('cartao_credito', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contas Fixas
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.contas_fixas}
                      onChange={(e) => handleChange('contas_fixas', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashish
                  </label>
                  <div className="relative">
                    <Leaf className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.hashish}
                      onChange={(e) => handleChange('hashish', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mercado
                  </label>
                  <div className="relative">
                    <ShoppingCart className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.mercado}
                      onChange={(e) => handleChange('mercado', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gasolina
                  </label>
                  <div className="relative">
                    <Fuel className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.gasolina}
                      onChange={(e) => handleChange('gasolina', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Flash
                  </label>
                  <div className="relative">
                    <Zap className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.flash}
                      onChange={(e) => handleChange('flash', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outros
                  </label>
                  <div className="relative">
                    <Plus className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.outros}
                      onChange={(e) => handleChange('outros', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meta de Economia
                  </label>
                  <div className="relative">
                    <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.meta_economia}
                      onChange={(e) => handleChange('meta_economia', parseFloat(e.target.value) || 0)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !formData.mes}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    {editingData ? 'Atualizar' : 'Salvar'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
} 