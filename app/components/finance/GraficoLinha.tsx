'use client'
import { motion } from 'framer-motion'
import { GraficoEvolucao } from '../../types/types'

interface Props {
  data: GraficoEvolucao[]
  title?: string
}

export default function GraficoLinha({ data, title = 'Evolução da Sobra' }: Props) {
  if (data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>Nenhum dado disponível</p>
      </div>
    )
  }

  const maxValue = Math.max(...data.map(item => item.acumulado))
  const minValue = Math.min(...data.map(item => item.acumulado))

  return (
    <div className="space-y-4">
      <div className="relative h-64">
        <svg className="w-full h-full" viewBox={`0 0 ${data.length * 100} 200`}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, i) => (
            <motion.line
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              x1="0"
              y1={200 - (percent * 2)}
              x2={data.length * 100}
              y2={200 - (percent * 2)}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          ))}
          
          {/* Data points and lines */}
          {data.map((item, index) => {
            const x = index * 100 + 50
            const y = 200 - ((item.acumulado - minValue) / (maxValue - minValue)) * 180
            
            return (
              <g key={index}>
                {/* Line to next point */}
                {index < data.length - 1 && (
                  <motion.line
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1, delay: index * 0.2 }}
                    x1={x}
                    y1={y}
                    x2={(index + 1) * 100 + 50}
                    y2={200 - ((data[index + 1].acumulado - minValue) / (maxValue - minValue)) * 180}
                    stroke="#1f2937"
                    strokeWidth="2"
                  />
                )}
                
                {/* Data point */}
                <motion.circle
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.2 + 0.5 }}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#1f2937"
                />
                
                {/* Value label */}
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.7 }}
                  x={x}
                  y={y - 10}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  R$ {item.acumulado.toLocaleString('pt-BR')}
                </motion.text>
                
                {/* Month label */}
                <motion.text
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.2 + 0.7 }}
                  x={x}
                  y="220"
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {item.mes}
                </motion.text>
              </g>
            )
          })}
        </svg>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="grid grid-cols-2 gap-4 text-sm"
      >
        <div>
          <span className="text-gray-600">Maior acumulado:</span>
          <div className="font-medium text-gray-900">
            R$ {maxValue.toLocaleString('pt-BR')}
          </div>
        </div>
        <div>
          <span className="text-gray-600">Menor acumulado:</span>
          <div className="font-medium text-gray-900">
            R$ {minValue.toLocaleString('pt-BR')}
          </div>
        </div>
      </motion.div>
    </div>
  )
} 