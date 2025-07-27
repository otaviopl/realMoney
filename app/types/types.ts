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
  createdAt?: string
  updatedAt?: string
}

export interface Configuracoes {
  id?: number
  metaReserva: number
  saldoInicial: number
  userId: string
}

export interface Insight {
  mesesParaMeta: number
  valorAtual: number
  meta: number
  mensagem: string
}

export interface GraficoGastos {
  categoria: string
  valor: number
  porcentagem: number
}

export interface GraficoEvolucao {
  mes: string
  sobra: number
  acumulado: number
}
