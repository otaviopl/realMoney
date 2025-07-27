'use client'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  Target, 
  Clock, 
  DollarSign,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { Insight as InsightType } from '../types/types'

interface Props {
  insight: InsightType
}

export default function Insight({ insight }: Props) {
  const getStatusIcon = () => {
    if (insight.mesesParaMeta === 0) {
      return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50' }
    } else if (insight.mesesParaMeta <= 6) {
      return { icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' }
    } else {
      return { icon: AlertCircle, color: 'text-yellow-500', bg: 'bg-yellow-50' }
    }
  }

  const status = getStatusIcon()

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Status Principal */}
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${status.bg}`}>
          <status.icon className={`h-6 w-6 ${status.color}`} />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {insight.mesesParaMeta === 0 ? 'Meta Atingida!' : 'Progresso da Meta'}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {insight.mensagem}
          </p>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Valor Atual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Valor Atual</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {insight.valorAtual.toLocaleString('pt-BR')}
          </p>
        </motion.div>

        {/* Meta */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Target className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Meta</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            R$ {insight.meta.toLocaleString('pt-BR')}
          </p>
        </motion.div>

        {/* Tempo Restante */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-50 rounded-lg p-4"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">
              {insight.mesesParaMeta === 0 ? 'Concluído' : 'Meses Restantes'}
            </span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {insight.mesesParaMeta === 0 ? '✓' : insight.mesesParaMeta}
          </p>
        </motion.div>
      </div>

      {/* Barra de Progresso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progresso</span>
          <span className="text-gray-900 font-medium">
            {Math.round((insight.valorAtual / insight.meta) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((insight.valorAtual / insight.meta) * 100, 100)}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className={`h-3 rounded-full ${
              insight.valorAtual >= insight.meta 
                ? 'bg-green-500' 
                : insight.valorAtual >= insight.meta * 0.7 
                ? 'bg-blue-500' 
                : 'bg-yellow-500'
            }`}
          />
        </div>
      </div>

      {/* Dicas */}
      {insight.mesesParaMeta > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Dica para acelerar</h4>
              <p className="text-sm text-blue-700">
                {insight.mesesParaMeta > 12 
                  ? 'Considere aumentar sua economia mensal ou revisar gastos para atingir a meta mais rapidamente.'
                  : 'Você está no caminho certo! Mantenha o foco para atingir sua meta.'
                }
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
} 