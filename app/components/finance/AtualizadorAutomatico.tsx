import { useState } from 'react'
import { useToast } from '../../lib/useToast'
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { calcularResumoMensal } from '../../lib/calculoAutomatico'
import { Transacao, ResumoMensal, Categoria } from '../../types/types'

interface Props {
  onSuccess?: () => void
  className?: string
}

export default function AtualizadorAutomatico({ onSuccess, className = '' }: Props) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const toast = useToast()

  const atualizarResumosAutomaticamente = async () => {
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      // Carregar dados necessários
      const [resumosResponse, transacoesResponse, categoriasResponse] = await Promise.all([
        supabase.from('resumo_mensal').select('*').eq('user_id', user.id),
        supabase.from('transacoes').select('*').eq('user_id', user.id),
        supabase.from('categorias').select('*').eq('user_id', user.id)
      ])

      if (resumosResponse.error) throw resumosResponse.error
      if (transacoesResponse.error) throw transacoesResponse.error
      if (categoriasResponse.error) throw categoriasResponse.error

      const resumos = resumosResponse.data || []
      const transacoes = transacoesResponse.data || []
      const categorias = categoriasResponse.data || []

      let resumosAtualizados = 0
      let erros = 0

      // Atualizar cada resumo
      for (const resumo of resumos) {
        try {
          const resumoCalculado = calcularResumoMensal(transacoes, categorias, resumo.mes)
          
          // Verificar se há diferenças significativas
          const camposParaAtualizar = [
            'salario_liquido',
            'cartao_credito',
            'contas_fixas',
            'hashish',
            'mercado',
            'gasolina',
            'flash',
            'outros'
          ]

          let precisaAtualizar = false
          const dadosAtualizados: any = {}

          camposParaAtualizar.forEach(campo => {
            const valorAtual = resumo[campo] || 0
            const valorCalculado = resumoCalculado[campo as keyof typeof resumoCalculado] || 0
            
            if (Math.abs(Number(valorAtual) - Number(valorCalculado)) > 0.01) {
              dadosAtualizados[campo] = valorCalculado
              precisaAtualizar = true
            }
          })

          if (precisaAtualizar) {
            const { error } = await supabase
              .from('resumo_mensal')
              .update(dadosAtualizados)
              .eq('id', resumo.id)
            
            if (error) {
              toast.error(`Erro ao atualizar resumo ${resumo.mes}`)
              erros++
            } else {
              resumosAtualizados++
            }
          }
        } catch (error) {
          toast.error(`Erro ao processar resumo ${resumo.mes}`)
          erros++
        }
      }

      // Definir mensagem de resultado
      if (erros === 0 && resumosAtualizados > 0) {
        setStatus('success')
        setMessage(`${resumosAtualizados} resumo(s) atualizado(s) automaticamente!`)
      } else if (resumosAtualizados === 0) {
        setStatus('success')
        setMessage('Todos os resumos estão atualizados!')
      } else {
        setStatus('error')
        setMessage(`${resumosAtualizados} atualizado(s), ${erros} erro(s)`)
      }

      if (onSuccess) onSuccess()

      } catch (error) {
        toast.error('Erro ao atualizar resumos')
        setStatus('error')
        setMessage('Erro ao atualizar resumos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={atualizarResumosAutomaticamente}
        disabled={loading}
        className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Atualizar resumos automaticamente baseado nas transações"
      >
        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        <span className="text-sm">Atualizar</span>
      </button>
      
      {status !== 'idle' && (
        <div className={`flex items-center space-x-1 text-sm ${
          status === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          {status === 'success' ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span>{message}</span>
        </div>
      )}
    </div>
  )
} 