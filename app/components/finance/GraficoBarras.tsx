'use client'
import { motion } from 'framer-motion'
import { GraficoGastos } from '../../types/types'

interface Props {
  data: GraficoGastos[]
  title?: string
}

export default function GraficoBarras({ data, title = 'Gastos por Categoria' }: Props) {
  const maxValue = Math.max(...data.map(item => item.valor))

  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-sm">
            <span className="font-medium text-gray-700">{item.categoria}</span>
            <span className="text-gray-600">
              R$ {item.valor.toLocaleString('pt-BR')} ({item.porcentagem.toFixed(1)}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.valor / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              className="bg-gray-900 h-3 rounded-full"
            />
          </div>
        </motion.div>
      ))}
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="pt-4 border-t border-gray-200"
      >
        <div className="flex justify-between text-sm font-medium">
          <span className="text-gray-700">Total de Gastos:</span>
          <span className="text-gray-900">
            R$ {data.reduce((acc, item) => acc + item.valor, 0).toLocaleString('pt-BR')}
          </span>
        </div>
      </motion.div>
    </div>
  )
} 