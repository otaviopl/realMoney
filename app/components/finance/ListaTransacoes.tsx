'use client'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  User, 
  MessageSquare,
  DollarSign
} from 'lucide-react'
import { Transacao } from '../../types/types'

interface Props {
  transacoes: Transacao[]
  categorias: any[]
}

export default function ListaTransacoes({ transacoes, categorias }: Props) {
  if (!transacoes || transacoes.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma transação registrada neste mês</p>
      </div>
    )
  }

  const getCategoriaNome = (categoriaId: string) => {
    const categoria = categorias.find(c => c.id === categoriaId)
    return categoria ? categoria.nome : 'Categoria não encontrada'
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarValor = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <div className="space-y-3">
      {transacoes.map((transacao) => (
        <motion.div
          key={transacao.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border ${
            transacao.tipo === 'entrada' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                transacao.tipo === 'entrada' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {transacao.tipo === 'entrada' ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-gray-900">
                    {formatarValor(transacao.valor)}
                  </span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    transacao.tipo === 'entrada' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatarData(transacao.data)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3" />
                    <span>{getCategoriaNome(transacao.categoriaId)}</span>
                  </div>
                  
                  {transacao.pessoaEnvolvida && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{transacao.pessoaEnvolvida}</span>
                    </div>
                  )}
                </div>
                
                {transacao.observacoes && (
                  <div className="flex items-start space-x-1 mt-2 text-sm text-gray-600">
                    <MessageSquare className="h-3 w-3 mt-0.5" />
                    <span>{transacao.observacoes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 