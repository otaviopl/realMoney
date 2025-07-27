export interface GastosMensais {
  id?: number
  mes: string
  salarioLiquido: number
  cartaoCredito: number
  contasFixas: number
  diversao: number
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
