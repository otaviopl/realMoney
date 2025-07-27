export interface GastosMensais {
  id?: number
  user_id?: string
  mes: string
  salarioLiquido: number
  cartaoCredito: number
  contasFixas: number
  hashishGramas: number
  flash: number
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
