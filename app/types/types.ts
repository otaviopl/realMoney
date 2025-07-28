// Tipos alinhados ao novo esquema do banco

export interface Configuracoes {
  id?: number
  user_id: string
  meta_reserva: number
  saldo_inicial: number
  created_at?: string
  updated_at?: string
}

export interface Categoria {
  id?: number
  user_id: string
  nome: string
  tipo: 'entrada' | 'saida'
  created_at?: string
}

export interface Contato {
  id?: number
  user_id: string
  nome: string
  tipo?: 'pagador' | 'recebedor'
  created_at?: string
}

export interface Transacao {
  id?: number
  user_id: string
  data: string
  valor: number
  tipo: 'entrada' | 'saida'
  categoria_id?: number
  contato_id?: number
  descricao?: string
  created_at?: string
}

export interface ResumoMensal {
  id?: number
  user_id: string
  mes: string
  salario_liquido?: number
  cartao_credito?: number
  contas_fixas?: number
  hashish?: number
  mercado?: number
  gasolina?: number
  flash?: number
  outros?: number
  meta_economia?: number
  created_at?: string
  updated_at?: string
}

// Interface para compatibilidade com o sistema antigo (camelCase)
export interface GastosMensais {
  id?: number
  mes: string
  salarioLiquido: number
  cartaoCredito: number
  contasFixas: number
  hashish: number
  mercado: number
  gasolina: number
  flash: number
  metaEconomia: number
  outros?: number
  categoria?: string
  transacoes?: Transacao[]
  createdAt?: string
  updatedAt?: string
}

// Tipos para gráficos e insights (mantidos para compatibilidade)
export interface GraficoGastos {
  categoria: string
  valor: number
  cor: string
  porcentagem?: number
}

export interface GraficoEvolucao {
  mes: string
  entrada: number
  saida: number
  saldo: number
  acumulado?: number
  sobra?: number
}

export interface Insight {
  titulo?: string
  descricao?: string
  tipo?: 'positivo' | 'negativo' | 'neutro'
  valor?: number
  porcentagem?: number
  mesesParaMeta?: number
  meta?: number
  valorAtual?: number
  mensagem?: string
}

export interface InsightAvancado {
  titulo: string
  descricao: string
  tipo: 'sucesso' | 'alerta' | 'info'
  metricas: {
    valor: number
    label: string
    cor: string
  }[]
  recomendacoes: string[]
}
