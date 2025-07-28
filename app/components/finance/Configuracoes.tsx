'use client'
import { useState, useEffect } from 'react'
import { useToast } from '../../lib/useToast'
import { motion } from 'framer-motion'
import { 
  Save, 
  Target, 
  DollarSign, 
  Settings,
  CheckCircle,
  AlertCircle,
  HelpCircle
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import type { Configuracoes } from '../../types/types'
import { AnimatePresence } from 'framer-motion'

export default function Configuracoes() {
  const [config, setConfig] = useState<Partial<Configuracoes>>({
    meta_reserva: 12000,
    saldo_inicial: 0,
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const toast = useToast()

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const carregarConfiguracoes = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('configuracoes')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        // Mapear snake_case para snake_case
        setConfig({
          id: data.id,
          meta_reserva: data.meta_reserva,
          saldo_inicial: data.saldo_inicial,
          user_id: data.user_id,
        })
      }
    } catch (error) {
      toast.error('Erro ao carregar configurações')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Usuário não autenticado')

      // Mapear snake_case para snake_case
      const configData = {
        user_id: user.id,
        meta_reserva: config.meta_reserva,
        saldo_inicial: config.saldo_inicial,
      }

      const { error } = await supabase
        .from('configuracoes')
        .upsert([configData])

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Configuracoes, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value : Number(value)
    }))
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (loading) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-3 bg-gray-100 rounded-lg">
            <Settings className="h-6 w-6 text-gray-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configurações</h2>
            <p className="text-gray-500">Configure suas metas e preferências financeiras</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Meta de Reserva */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Target className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Meta de Reserva</h3>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Usado para calcular previsão de tempo
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor da Meta (R$)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                                  value={config.meta_reserva}
                onChange={(e) => handleChange('meta_reserva', e.target.value)}
                  placeholder="12000"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Este é o valor que você quer acumular como reserva de emergência
              </p>
            </div>
          </div>

          {/* Saldo Inicial */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Saldo Inicial</h3>
              <div className="group relative">
                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Adicionado ao cálculo de evolução
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo Atual (R$)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <DollarSign className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent transition-colors"
                  type="number"
                                  value={config.saldo_inicial}
                onChange={(e) => handleChange('saldo_inicial', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Saldo atual que você já possui (será usado como ponto de partida)
              </p>
            </div>
          </div>

          {/* Status de Salvamento */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700 font-medium">Configurações salvas com sucesso!</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botões */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </button>
          </div>
        </form>

        {/* Informações Adicionais */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Como funciona?</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• A <strong>Meta de Reserva</strong> é o valor que você quer acumular como segurança</li>
                <li>• O <strong>Saldo Inicial</strong> é o valor que você já possui atualmente</li>
                <li>• O sistema calculará automaticamente quanto tempo levará para atingir sua meta</li>
                <li>• Você pode ajustar essas configurações a qualquer momento</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
} 