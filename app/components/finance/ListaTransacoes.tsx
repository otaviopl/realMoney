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
import { useTransactions } from '../../hooks/useTransactions'
import { useCategories } from '../../hooks/useCategories'
import { useContacts } from '../../hooks/useContacts'

export default function ListaTransacoes() {
  const { transactions, isLoading: isLoadingTransactions, error: errorTransactions } = useTransactions();
  const { categories, isLoading: isLoadingCategories, error: errorCategories } = useCategories();
  const { contacts, isLoading: isLoadingContacts, error: errorContacts } = useContacts();

  if (isLoadingTransactions || isLoadingCategories || isLoadingContacts) {
    return <div>Carregando...</div>;
  }

  if (errorTransactions || errorCategories || errorContacts) {
    return <div>Erro ao carregar os dados</div>;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Nenhuma transação registrada neste mês</p>
      </div>
    )
  }

  const getCategoriaNome = (categoriaId: number | undefined) => {
    if (!categoriaId) return 'Sem categoria';
    const categoria = categories?.find(c => c.id === categoriaId)
    return categoria ? categoria.nome : 'Categoria não encontrada'
  }

  const getContatoNome = (contatoId: number | undefined) => {
    if (!contatoId) return null;
    const contato = contacts?.find(c => c.id === contatoId)
    return contato ? contato.nome : 'Contato não encontrado'
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
      {transactions.map((transacao) => (
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
                    <span>{getCategoriaNome(transacao.categoria_id)}</span>
                  </div>
                  
                  {transacao.contato_id && (
                    <div className="flex items-center space-x-1">
                      <User className="h-3 w-3" />
                      <span>{getContatoNome(transacao.contato_id)}</span>
                    </div>
                  )}
                </div>
                
                {transacao.descricao && (
                  <div className="flex items-start space-x-1 mt-2 text-sm text-gray-600">
                    <MessageSquare className="h-3 w-3 mt-0.5" />
                    <span>{transacao.descricao}</span>
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