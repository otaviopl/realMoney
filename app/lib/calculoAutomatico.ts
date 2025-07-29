import { Transacao, ResumoMensal, Categoria } from '../types/types'

// Interface para representar gastos mensais da tabela gastos_mensais
export interface GastoMensal {
  id?: number
  user_id: string
  mes: string
  categoria_id: number
  quantidade: number
  valor_unitario?: number
  valor_total?: number
  created_at?: string
  updated_at?: string
}

// Nova função para calcular saldo seguindo a fórmula: (entradas) - (saidas) - (salario - despesas dos forms)
export const calcularSaldoComNovaFormula = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  mes?: string
): number => {
  // Filtrar transações do mês se especificado
  let transacoesFiltradas = transacoes
  if (mes) {
    transacoesFiltradas = transacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data)
      const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      return mesTransacao.toLowerCase() === mes.toLowerCase()
    })
  }

  // Calcular total de entradas
  const totalEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada')
    .reduce((total, t) => total + Number(t.valor), 0)

  // Calcular total de saídas
  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === 'saida')
    .reduce((total, t) => total + Number(t.valor), 0)

  // Filtrar gastos mensais do mês se especificado
  let gastosMensaisFiltrados = gastosMensais
  if (mes) {
    gastosMensaisFiltrados = gastosMensais.filter(gasto => 
      gasto.mes.toLowerCase() === mes.toLowerCase()
    )
  }

  // Calcular total de despesas dos forms (gastos mensais)
  const totalDespesasForms = gastosMensaisFiltrados.reduce((total, gasto) => {
    return total + (gasto.valor_total || (gasto.quantidade * (gasto.valor_unitario || 0)))
  }, 0)

  // Calcular salário total do mês das transações de entrada
  const salarioTransacoes = transacoesFiltradas
    .filter(t => t.tipo === 'entrada')
    .reduce((total, t) => total + Number(t.valor), 0)

  // Aplicar a fórmula: (entradas) - (saidas) - (salario - despesas dos forms)
  return totalEntradas - totalSaidas - (salarioTransacoes - totalDespesasForms)
}

// Função para obter resumo detalhado seguindo a nova fórmula
export const obterResumoDetalhado = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  mes?: string
) => {
  // Filtrar transações do mês se especificado
  let transacoesFiltradas = transacoes
  if (mes) {
    transacoesFiltradas = transacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data)
      const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
      return mesTransacao.toLowerCase() === mes.toLowerCase()
    })
  }

  // Calcular totais das transações
  const totalEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada')
    .reduce((total, t) => total + Number(t.valor), 0)

  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === 'saida')
    .reduce((total, t) => total + Number(t.valor), 0)

  // Filtrar e calcular gastos mensais
  let gastosMensaisFiltrados = gastosMensais
  if (mes) {
    gastosMensaisFiltrados = gastosMensais.filter(gasto => 
      gasto.mes.toLowerCase() === mes.toLowerCase()
    )
  }

  const totalDespesasForms = gastosMensaisFiltrados.reduce((total, gasto) => {
    return total + (gasto.valor_total || (gasto.quantidade * (gasto.valor_unitario || 0)))
  }, 0)

  // Saldo final usando a nova fórmula
  const saldoFinal = calcularSaldoComNovaFormula(transacoes, gastosMensais, mes)

  return {
    totalEntradas,
    totalSaidas,
    totalDespesasForms,
    salarioTransacoes: totalEntradas, // Assumindo que entradas são salários
    saldoFinal,
    detalhesCalculo: {
      formula: '(Entradas) - (Saídas) - (Salário - Despesas dos Forms)',
      entradas: totalEntradas,
      saidas: totalSaidas,
      salario: totalEntradas,
      despesasForms: totalDespesasForms,
      resultado: `${totalEntradas} - ${totalSaidas} - (${totalEntradas} - ${totalDespesasForms}) = ${saldoFinal}`
    }
  }
}

// Função para calcular automaticamente os valores do resumo mensal baseado nas transações
export const calcularResumoMensal = (
  transacoes: Transacao[],
  categorias: Categoria[],
  mes: string
): Partial<ResumoMensal> => {
  // Filtrar transações do mês específico
  const transacoesDoMes = transacoes.filter(transacao => {
    const dataTransacao = new Date(transacao.data)
    const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    return mesTransacao.toLowerCase() === mes.toLowerCase()
  })

  // Função auxiliar para deduzir categoria pela descrição
  const deduzirCategoriaPorDescricao = (descricao: string): string | null => {
    const desc = descricao.toLowerCase()
    
    // Palavras-chave para salário/entradas
    if (desc.includes('salario') || desc.includes('salário') || desc.includes('pix recebido') || desc.includes('transferencia recebida')) {
      return 'salario'
    }
    
    // Palavras-chave para mercado/compras
    if (desc.includes('mercado') || desc.includes('supermercado') || desc.includes('atacadao') || desc.includes('carrefour') || desc.includes('extra')) {
      return 'mercado'
    }
    
    // Palavras-chave para gasolina
    if (desc.includes('posto') || desc.includes('gasolina') || desc.includes('combustivel') || desc.includes('petrobras') || desc.includes('shell')) {
      return 'gasolina'
    }
    
    // Se não identificar, considerar como "outros"
    return 'outros'
  }

  // Calcular totais por categoria
  const totaisPorCategoria: { [key: string]: number } = {}
  
  transacoesDoMes.forEach(transacao => {
    let nomeCategoria: string
    
    if (transacao.categoria_id) {
      // Transação com categoria definida
      const categoria = categorias.find(cat => cat.id === transacao.categoria_id)
      if (categoria) {
        nomeCategoria = categoria.nome.toLowerCase()
      } else {
        return // Categoria não encontrada, pular transação
      }
    } else {
      // Transação sem categoria - tentar deduzir pela descrição
      const categoriaDeuzida = deduzirCategoriaPorDescricao(transacao.descricao || '')
      if (categoriaDeuzida) {
        nomeCategoria = categoriaDeuzida
      } else {
        return // Não conseguiu deduzir, pular transação
      }
    }
    
    // Considerar apenas saídas para os cálculos de gastos (exceto salário)
    if (transacao.tipo === 'saida' || nomeCategoria === 'salario') {
      totaisPorCategoria[nomeCategoria] = (totaisPorCategoria[nomeCategoria] || 0) + Number(transacao.valor)
    }
  })

  // Mapear categorias para campos do resumo
  // NÃO inicializar com 0 para evitar zerar dados existentes
  const resumo: Partial<ResumoMensal> = {
    mes: mes
    // Campos serão preenchidos apenas se houver transações correspondentes
  }

  // Mapear categorias específicas
  Object.entries(totaisPorCategoria).forEach(([categoria, valor]) => {
    switch (categoria) {
      case 'salário':
      case 'salario':
        resumo.salario_liquido = valor
        break
      case 'cartão de crédito':
      case 'cartao de credito':
      case 'cartão':
      case 'cartao':
        resumo.cartao_credito = valor
        break
      case 'contas fixas':
      case 'contas':
        resumo.contas_fixas = valor
        break
      case 'hashish':
      case 'hash':
        resumo.hashish = valor
        break
      case 'mercado':
      case 'compras':
        resumo.mercado = valor
        break
      case 'gasolina':
      case 'combustível':
      case 'combustivel':
        resumo.gasolina = valor
        break
      case 'flash':
        resumo.flash = valor
        break
      default:
        resumo.outros = (resumo.outros || 0) + valor
        break
    }
  })

  return resumo
}

// Função para calcular saldo atual baseado em transações
export const calcularSaldoAtual = (transacoes: Transacao[]): number => {
  return transacoes.reduce((saldo, transacao) => {
    if (transacao.tipo === 'entrada') {
      return saldo + Number(transacao.valor)
    } else {
      return saldo - Number(transacao.valor)
    }
  }, 0)
}

// Função para calcular total de entradas do mês
export const calcularTotalEntradas = (transacoes: Transacao[], mes: string): number => {
  const transacoesDoMes = transacoes.filter(transacao => {
    const dataTransacao = new Date(transacao.data)
    const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    return mesTransacao.toLowerCase() === mes.toLowerCase() && transacao.tipo === 'entrada'
  })

  return transacoesDoMes.reduce((total, transacao) => total + Number(transacao.valor), 0)
}

// Função para calcular total de saídas do mês
export const calcularTotalSaidas = (transacoes: Transacao[], mes: string): number => {
  const transacoesDoMes = transacoes.filter(transacao => {
    const dataTransacao = new Date(transacao.data)
    const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    return mesTransacao.toLowerCase() === mes.toLowerCase() && transacao.tipo === 'saida'
  })

  return transacoesDoMes.reduce((total, transacao) => total + Number(transacao.valor), 0)
}

// Função para calcular sobra do mês
export const calcularSobraMensal = (entradas: number, saidas: number): number => {
  return entradas - saidas
}

// Função para verificar se deve atualizar resumo automaticamente
export const deveAtualizarResumoAutomatico = (resumo: ResumoMensal, transacoes: Transacao[], categorias: Categoria[]): boolean => {
  const resumoCalculado = calcularResumoMensal(transacoes, categorias, resumo.mes)
  
  // Comparar valores principais
  const camposParaComparar = [
    'salario_liquido',
    'cartao_credito', 
    'contas_fixas',
    'hashish',
    'mercado',
    'gasolina',
    'flash',
    'outros'
  ]

  return camposParaComparar.some(campo => {
    const valorAtual = resumo[campo as keyof ResumoMensal] || 0
    const valorCalculado = resumoCalculado[campo as keyof ResumoMensal] || 0
    return Math.abs(Number(valorAtual) - Number(valorCalculado)) > 0.01
  })
} 