import type { GastosMensais, Configuracoes } from '../types/types'

export const mockGastos: GastosMensais[] = [
  {
    id: 1,
    mes: 'Janeiro 2024',
    salarioLiquido: 5000,
    cartaoCredito: 1200,
    contasFixas: 800,
    hashish: 200,
    mercado: 600,
    gasolina: 300,
    flash: 700,
    metaEconomia: 1000,
    outros: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    mes: 'Fevereiro 2024',
    salarioLiquido: 5000,
    cartaoCredito: 1100,
    contasFixas: 800,
    hashish: 180,
    mercado: 550,
    gasolina: 280,
    flash: 750,
    metaEconomia: 1200,
    outros: 0,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 3,
    mes: 'Março 2024',
    salarioLiquido: 5200,
    cartaoCredito: 1300,
    contasFixas: 800,
    hashish: 220,
    mercado: 650,
    gasolina: 320,
    flash: 800,
    metaEconomia: 1100,
    outros: 0,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z'
  },
  {
    id: 4,
    mes: 'Abril 2024',
    salarioLiquido: 5200,
    cartaoCredito: 1000,
    contasFixas: 800,
    hashish: 150,
    mercado: 500,
    gasolina: 250,
    flash: 900,
    metaEconomia: 1500,
    outros: 0,
    createdAt: '2024-04-01T00:00:00Z',
    updatedAt: '2024-04-01T00:00:00Z'
  }
]

export const mockConfig: Configuracoes = {
  id: 1,
  user_id: 'mock-user-id',
  meta_reserva: 12000,
  saldo_inicial: 2000,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
} 