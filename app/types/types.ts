export interface GastosMensais {
  id?: number
  user_id?: string
  mes: string
  salarioLiquido: number
  cartaoCredito: number
  contasFixas: number
  hashishGramas: number
  mercado: number
  gasolina: number
  flashRecebido: number
  metaEconomia: number
}

export interface MetaCarro {
  objetivo: number
  acumulado: number
  prazo: string
}

export interface Simulacao {
  novoSalario: number
  novaParcela: number
  novaMoradia: number
}
