'use client'
import { motion } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb, 
  ArrowUp, 
  ArrowDown, 
  DollarSign,
  PieChart,
  Calendar,
  Zap
} from 'lucide-react'
import { InsightAvancado as InsightAvancadoType, GastosMensais, Transacao } from '../../types/types'

interface Props {
  insight: InsightAvancadoType
  gastosMensais: GastosMensais[]
  transacoes?: Transacao[]
}

export default function InsightAvancado({ insight, gastosMensais, transacoes = [] }: Props) {
  const { alertas, recomendacoes, previsoes } = insight

  const getAlertIcon = (tipo: 'sucesso' | 'atencao' | 'perigo') => {
    switch (tipo) {
      case 'sucesso':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' }
      case 'atencao':
        return { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' }
      case 'perigo':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' }
    }
  }

  const getImpactColor = (impacto: 'alto' | 'medio' | 'baixo') => {
    switch (impacto) {
      case 'alto':
        return 'bg-red-100 text-red-800'
      case 'medio':
        return 'bg-yellow-100 text-yellow-800'
      case 'baixo':
        return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Alertas Principais */}
      {alertas.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            Alertas Importantes
          </h4>
          {alertas.map((alerta, index) => {
            const config = getAlertIcon(alerta.tipo)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${config.bg} ${config.border}`}
              >
                <div className="flex items-start space-x-3">
                  <config.icon className={`h-5 w-5 ${config.color} mt-0.5`} />
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{alerta.titulo}</h5>
                    <p className="text-sm text-gray-600 mt-1">{alerta.descricao}</p>
                    {alerta.acao && (
                      <p className="text-sm font-medium text-gray-700 mt-2">
                        💡 {alerta.acao}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      {/* Grid de Métricas Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Previsão Saldo Próximo Mês */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-600">Previsão Próximo Mês</h5>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              R$ {previsoes.saldoProximoMes.toLocaleString('pt-BR')}
            </span>
            {previsoes.saldoProximoMes > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Meta Realizável */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-600">Meta Realizável</h5>
            <Target className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-lg font-bold ${previsoes.metaRealizavel ? 'text-green-600' : 'text-red-600'}`}>
              {previsoes.metaRealizavel ? 'Sim' : 'Não'}
            </span>
            {previsoes.metaRealizavel ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-500" />
            )}
          </div>
        </div>

        {/* Meses para Reserva */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h5 className="text-sm font-medium text-gray-600">Meses para Reserva</h5>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              {previsoes.mesesParaReserva} meses
            </span>
            <Calendar className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </motion.div>

      {/* Recomendações */}
      {recomendacoes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
            <Lightbulb className="h-5 w-5 mr-2 text-blue-500" />
            Recomendações Personalizadas
          </h4>
          <div className="space-y-3">
            {recomendacoes.map((recomendacao, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h5 className="font-medium text-gray-900">{recomendacao.titulo}</h5>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(recomendacao.impacto)}`}>
                        {recomendacao.impacto === 'alto' ? 'Alto Impacto' : 
                         recomendacao.impacto === 'medio' ? 'Médio Impacto' : 'Baixo Impacto'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{recomendacao.descricao}</p>
                  </div>
                  {recomendacao.impacto === 'alto' && (
                    <ArrowUp className="h-5 w-5 text-red-500 ml-2" />
                  )}
                  {recomendacao.impacto === 'medio' && (
                    <ArrowUp className="h-5 w-5 text-yellow-500 ml-2" />
                  )}
                  {recomendacao.impacto === 'baixo' && (
                    <ArrowUp className="h-5 w-5 text-green-500 ml-2" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Análise de Tendências */}
      {gastosMensais.length >= 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-lg"
        >
          <h4 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <PieChart className="h-5 w-5 mr-2 text-purple-500" />
            Análise de Tendências
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tendência de Sobra */}
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Evolução da Sobra</h5>
              <div className="flex items-center space-x-2">
                {(() => {
                  const ultimosMeses = gastosMensais.slice(0, 3)
                  const sobras = ultimosMeses.map(mes => 
                    mes.salarioLiquido + mes.flash - (mes.cartaoCredito + mes.contasFixas + mes.hashish * 95 + mes.mercado + mes.gasolina)
                  )
                  
                  if (sobras.length < 2) return <span className="text-gray-500">Dados insuficientes</span>
                  
                  const tendencia = sobras[0] > sobras[1] ? 'crescente' : 
                                   sobras[0] < sobras[1] ? 'decrescente' : 'estavel'
                  
                  return (
                    <>
                      <span className={`text-sm font-medium ${
                        tendencia === 'crescente' ? 'text-green-600' : 
                        tendencia === 'decrescente' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {tendencia === 'crescente' ? 'Crescente' : 
                         tendencia === 'decrescente' ? 'Decrescente' : 'Estável'}
                      </span>
                      {tendencia === 'crescente' && <TrendingUp className="h-4 w-4 text-green-500" />}
                      {tendencia === 'decrescente' && <TrendingDown className="h-4 w-4 text-red-500" />}
                      {tendencia === 'estavel' && <div className="h-4 w-4 bg-gray-400 rounded-full" />}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Gasto Médio */}
            <div className="bg-white p-4 rounded-lg">
              <h5 className="font-medium text-gray-700 mb-2">Gasto Médio Mensal</h5>
              <div className="flex items-center space-x-2">
                {(() => {
                  const gastoMedio = gastosMensais.reduce((acc, mes) => 
                    acc + (mes.cartaoCredito + mes.contasFixas + mes.hashish * 95 + mes.mercado + mes.gasolina), 0
                  ) / gastosMensais.length
                  
                  return (
                    <>
                      <span className="text-sm font-medium text-gray-900">
                        R$ {gastoMedio.toLocaleString('pt-BR')}
                      </span>
                      <DollarSign className="h-4 w-4 text-gray-400" />
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
} 