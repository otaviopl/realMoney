import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Função utilitária para formatar mês de forma consistente
export const formatarMes = (data: string | Date): string => {
  const date = typeof data === 'string' ? new Date(data) : data
  const mes = date.toLocaleDateString('pt-BR', { month: 'long' })
  const ano = date.getFullYear()
  
  // Capitalizar primeira letra do mês
  return mes.charAt(0).toUpperCase() + mes.slice(1) + ' ' + ano
}

// Função para obter mês a partir de uma data
export const obterMesDaData = (data: string | Date): string => {
  return formatarMes(data)
}
