import { Transacao, ResumoMensal, Categoria } from '../types/types'

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

  // Calcular totais por categoria
  const totaisPorCategoria: { [key: string]: number } = {}
  
  transacoesDoMes.forEach(transacao => {
    if (transacao.categoria_id) {
      const categoria = categorias.find(cat => cat.id === transacao.categoria_id)
      if (categoria) {
        const nomeCategoria = categoria.nome.toLowerCase()
        totaisPorCategoria[nomeCategoria] = (totaisPorCategoria[nomeCategoria] || 0) + Number(transacao.valor)
      }
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