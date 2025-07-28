'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Copy, 
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { GastosMensais } from '../../types/types'

interface Props {
  historico: GastosMensais[]
  onEditar: (item: GastosMensais) => void
  onClonar: (item: GastosMensais) => void
}

export default function Historico({ historico, onEditar, onClonar }: Props) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null)

  const calcularSobra = (item: GastosMensais) => {
    const totalGastos = item.cartaoCredito + item.contasFixas + item.hashish + item.mercado + item.gasolina
    return item.salarioLiquido + item.flash - totalGastos
  }

  const getSobraColor = (sobra: number) => {
    if (sobra >= 0) return 'text-green-600'
    return 'text-red-600'
  }

  const getSobraIcon = (sobra: number) => {
    if (sobra >= 0) return TrendingUp
    return TrendingDown
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  if (historico.length === 0) {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-8"
      >
        <div className="text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum registro encontrado</h3>
          <p className="text-gray-500">Adicione dados de um mês para começar a ver seu histórico.</p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">Histórico de Gastos</h3>
        
        <div className="space-y-4">
          {historico.map((item, index) => {
            const sobra = calcularSobra(item)
            const isExpanded = expandedItem === index
            const SobraIcon = getSobraIcon(sobra)
            
            return (
              <motion.div
                key={item.id || index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-gray-200 rounded-xl overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-gray-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">{item.mes}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Salário: R$ {item.salarioLiquido.toLocaleString('pt-BR')}</span>
                          <span>•</span>
                          <span className={`flex items-center ${getSobraColor(sobra)}`}>
                            <SobraIcon className="h-4 w-4 mr-1" />
                            Sobra: R$ {sobra.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onClonar(item)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Clonar mês"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onEditar(item)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar mês"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setExpandedItem(isExpanded ? null : index)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Cartão</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.cartaoCredito.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Contas</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.contasFixas.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-sm font-medium text-gray-500">Hashish</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              {item.hashish}g
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Mercado</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.mercado.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Gasolina</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.gasolina.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Flash</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.flash.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <DollarSign className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Meta</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-900">
                              R$ {item.metaEconomia.toLocaleString('pt-BR')}
                            </p>
                          </div>
                          
                          <div className="bg-white p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2 mb-2">
                              <SobraIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-500">Sobra</span>
                            </div>
                            <p className={`text-lg font-semibold ${getSobraColor(sobra)}`}>
                              R$ {sobra.toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
} 