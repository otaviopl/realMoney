'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Save, 
  DollarSign, 
  CreditCard, 
  Home, 
  ShoppingCart, 
  Fuel, 
  Gift, 
  Target,
  Calendar,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { GastosMensais } from '../types/types'

interface Props {
  onBack?: () => void
}

export default function Formulario({ onBack }: Props) {
  const [formData, setFormData] = useState<Partial<GastosMensais>>({
    mes: '',
    salarioLiquido: 0,
    cartaoCredito: 0,
    contasFixas: 0,
    hashish: 0,
    mercado: 0,
    gasolina: 0,
    flash: 0,
    metaEconomia: 0,
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (field: keyof GastosMensais, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Tentar salvar no Supabase primeiro
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Usuário logado no Supabase - salvar na nuvem
        // Mapear camelCase para snake_case para o Supabase
        const supabaseData = {
          user_id: user.id,
          mes: formData.mes,
          salario_liquido: formData.salarioLiquido,
          cartao_credito: formData.cartaoCredito,
          contas_fixas: formData.contasFixas,
          hashish: formData.hashish,
          mercado: formData.mercado,
          gasolina: formData.gasolina,
          flash: formData.flash,
          meta_economia: formData.metaEconomia,
        }

        const { error } = await supabase
          .from('gastos_mensais')
          .insert([supabaseData])

        if (error) throw error
        alert('Dados salvos na nuvem com sucesso!')
      } else {
        // Usuário não logado - salvar localmente
        const gastos = JSON.parse(localStorage.getItem('gastos') || '[]')
        const newGasto = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        gastos.unshift(newGasto)
        localStorage.setItem('gastos', JSON.stringify(gastos))
        alert('Dados salvos localmente!')
      }
      
    } catch (error) {
      console.error('Erro ao salvar:', error)
      
      // Fallback para localStorage
      try {
        const gastos = JSON.parse(localStorage.getItem('gastos') || '[]')
        const newGasto = {
          ...formData,
          id: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        gastos.unshift(newGasto)
        localStorage.setItem('gastos', JSON.stringify(gastos))
        alert('Dados salvos localmente (fallback)!')
      } catch (localError) {
        alert('Erro ao salvar dados')
        console.error('Erro no fallback:', localError)
      }
    } finally {
      // Limpar formulário
      setFormData({
        mes: '',
        salarioLiquido: 0,
        cartaoCredito: 0,
        contasFixas: 0,
        hashish: 0,
        mercado: 0,
        gasolina: 0,
        flash: 0,
        metaEconomia: 0,
      })
      setLoading(false)
      if (onBack) onBack()
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
          )}
          <h1 className="text-3xl font-bold text-gray-900">Novo Mês</h1>
        </div>
      </motion.div>

      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-gray-400" />
              Informações Básicas
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mês
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  value={formData.mes}
                  onChange={(e) => handleChange('mes', e.target.value)}
                  placeholder="Ex: Janeiro 2024"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1 text-gray-400" />
                  Salário Líquido
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.salarioLiquido}
                  onChange={(e) => handleChange('salarioLiquido', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Gastos Principais */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-gray-400" />
              Gastos Principais
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CreditCard className="h-4 w-4 mr-1 text-gray-400" />
                  Cartão de Crédito
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.cartaoCredito}
                  onChange={(e) => handleChange('cartaoCredito', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Home className="h-4 w-4 mr-1 text-gray-400" />
                  Contas Fixas
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.contasFixas}
                  onChange={(e) => handleChange('contasFixas', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hashish (gramas)
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.hashish}
                  onChange={(e) => handleChange('hashish', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <ShoppingCart className="h-4 w-4 mr-1 text-gray-400" />
                  Mercado
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.mercado}
                  onChange={(e) => handleChange('mercado', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Fuel className="h-4 w-4 mr-1 text-gray-400" />
                  Gasolina
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.gasolina}
                  onChange={(e) => handleChange('gasolina', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Gift className="h-4 w-4 mr-1 text-gray-400" />
                  Flash Recebido
                </label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                  value={formData.flash}
                  onChange={(e) => handleChange('flash', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
            </div>
          </div>

          {/* Meta de Economia */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="h-5 w-5 mr-2 text-gray-400" />
              Meta de Economia
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Target className="h-4 w-4 mr-1 text-gray-400" />
                Meta de Economia Mensal
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                type="number"
                value={formData.metaEconomia}
                onChange={(e) => handleChange('metaEconomia', e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
