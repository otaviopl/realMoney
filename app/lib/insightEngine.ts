import { GastosMensais, Transacao, InsightAvancado, Configuracoes } from '../types/types'

/**
 * Motor de Insights Inteligentes
 * Gera análises personalizadas baseadas nos dados financeiros do usuário
 */

export function gerarInsightAvancado(
  gastosMensais: GastosMensais[],
  config: Configuracoes | null,
  transacoes: Transacao[] = []
): InsightAvancado {
  const mesAtual = gastosMensais[0]
  const mesesAnteriores = gastosMensais.slice(1, 6) // Últimos 5 meses
  const metaReserva = config?.metaReserva || 12000

  // Calcular sobra do mês atual
  const calcularSobra = (mes: GastosMensais) => {
    const custoHashish = mes.hashish * 95
    const totalGastos = mes.cartaoCredito + mes.contasFixas + custoHashish + mes.mercado + mes.gasolina
    return mes.salarioLiquido + mes.flash - totalGastos
  }

  const sobraAtual = mesAtual ? calcularSobra(mesAtual) : 0
  const sobrasMeses = mesesAnteriores.map(calcularSobra)
  const mediaSobra = sobrasMeses.length > 0 ? sobrasMeses.reduce((a, b) => a + b, 0) / sobrasMeses.length : 0
  
  // Calcular valor acumulado atual
  const valorAtual = gastosMensais.reduce((acc, mes) => acc + calcularSobra(mes), 0)
  
  // Gerar alertas dinâmicos
  const alertas = []
  
  // Alerta: Meta mensal não atingida
  if (mesAtual && sobraAtual < mesAtual.metaEconomia) {
    const diferenca = mesAtual.metaEconomia - sobraAtual
    alertas.push({
      tipo: 'atencao' as const,
      titulo: 'Meta Mensal Não Atingida',
      descricao: `Você ficou R$ ${diferenca.toLocaleString('pt-BR')} abaixo da sua meta de economia este mês.`,
      acao: `Considere revisar os gastos com ${analisarMaiorGasto(mesAtual)} no próximo mês.`
    })
  }

  // Alerta: Gasto com hashish alto
  if (mesAtual && mesAtual.hashish * 95 > sobraAtual * 0.3) {
    alertas.push({
      tipo: 'perigo' as const,
      titulo: 'Gasto com Hashish Elevado',
      descricao: `O gasto com hashish (R$ ${(mesAtual.hashish * 95).toLocaleString('pt-BR')}) representa mais de 30% da sua sobra mensal.`,
      acao: 'Considere reduzir o consumo ou buscar alternativas mais econômicas.'
    })
  }

  // Alerta: Tendência decrescente
  if (sobrasMeses.length >= 2 && sobraAtual < sobrasMeses[0]) {
    alertas.push({
      tipo: 'atencao' as const,
      titulo: 'Tendência de Queda na Sobra',
      descricao: 'Sua sobra mensal está diminuindo em relação ao mês anterior.',
      acao: 'Analise onde os gastos aumentaram e faça ajustes necessários.'
    })
  }

  // Alerta: Próximo da meta de reserva
  if (valorAtual >= metaReserva * 0.8) {
    alertas.push({
      tipo: 'sucesso' as const,
      titulo: 'Quase na Meta!',
      descricao: `Você já atingiu ${((valorAtual / metaReserva) * 100).toFixed(0)}% da sua meta de reserva.`,
      acao: 'Continue com o bom trabalho! Você está no caminho certo.'
    })
  }

  // Gerar recomendações
  const recomendacoes = []

  // Recomendação: Otimizar categoria de maior gasto
  if (mesAtual) {
    const maiorGasto = analisarMaiorGasto(mesAtual)
    recomendacoes.push({
      titulo: `Otimizar Gastos com ${maiorGasto}`,
      descricao: `${maiorGasto} é sua maior categoria de gastos. Pequenas reduções aqui podem ter grande impacto.`,
      impacto: 'alto' as const
    })
  }

  // Recomendação: Aumentar renda extra
  if (mediaSobra > 0 && mediaSobra < (mesAtual?.metaEconomia || 1000) * 0.8) {
    recomendacoes.push({
      titulo: 'Considere Renda Extra',
      descricao: 'Sua sobra mensal está abaixo da meta. Freelances ou vendas podem acelerar seus objetivos.',
      impacto: 'medio' as const
    })
  }

  // Recomendação: Revisar metas
  if (sobrasMeses.length >= 3 && sobrasMeses.every(sobra => sobra < (mesAtual?.metaEconomia || 1000))) {
    recomendacoes.push({
      titulo: 'Revisar Metas de Economia',
      descricao: 'Suas metas podem estar muito altas para sua realidade atual. Considere ajustá-las.',
      impacto: 'medio' as const
    })
  }

  // Recomendação: Investimentos
  if (valorAtual > metaReserva * 0.5) {
    recomendacoes.push({
      titulo: 'Considere Investimentos',
      descricao: 'Você já tem uma boa reserva. Considere diversificar em investimentos de baixo risco.',
      impacto: 'baixo' as const
    })
  }

  // Calcular previsões
  const saldoProximoMes = mediaSobra > 0 ? valorAtual + mediaSobra : valorAtual
  const metaRealizavel = mediaSobra >= (mesAtual?.metaEconomia || 0) * 0.8
  const mesesParaReserva = mediaSobra > 0 ? Math.ceil((metaReserva - valorAtual) / mediaSobra) : 0

  return {
    mesesParaMeta: mesesParaReserva,
    valorAtual,
    meta: metaReserva,
    mensagem: gerarMensagemPersonalizada(valorAtual, metaReserva, mediaSobra),
    alertas,
    recomendacoes,
    previsoes: {
      saldoProximoMes,
      metaRealizavel,
      mesesParaReserva
    }
  }
}

function analisarMaiorGasto(mes: GastosMensais): string {
  const gastos = {
    'Cartão de Crédito': mes.cartaoCredito,
    'Contas Fixas': mes.contasFixas,
    'Hashish': mes.hashish * 95,
    'Mercado': mes.mercado,
    'Gasolina': mes.gasolina
  }

  const maiorGasto = Object.entries(gastos).reduce((max, [categoria, valor]) => 
    valor > max.valor ? { categoria, valor } : max, 
    { categoria: '', valor: 0 }
  )

  return maiorGasto.categoria
}

function gerarMensagemPersonalizada(valorAtual: number, meta: number, mediaSobra: number): string {
  const progresso = (valorAtual / meta) * 100

  if (progresso >= 100) {
    return '🎉 Parabéns! Você atingiu sua meta de reserva!'
  } else if (progresso >= 80) {
    return '🚀 Você está quase lá! Faltam poucos meses para atingir sua meta.'
  } else if (progresso >= 50) {
    return '💪 Você está no meio do caminho! Continue firme no seu objetivo.'
  } else if (progresso >= 25) {
    return '🌱 Bom começo! Cada real economizado te aproxima da sua meta.'
  } else if (mediaSobra > 0) {
    return '🎯 Você está no caminho certo! Mantenha a disciplina nos gastos.'
  } else {
    return '⚠️ Hora de revisar os gastos e ajustar as metas para alcançar seus objetivos.'
  }
}

/**
 * Análise de padrões de gastos para detectar anomalias
 */
export function analisarPadroesGastos(gastosMensais: GastosMensais[]): {
  categoria: string
  alerta: 'normal' | 'aumento' | 'reducao'
  variacao: number
}[] {
  if (gastosMensais.length < 2) return []

  const mesAtual = gastosMensais[0]
  const mesAnterior = gastosMensais[1]

  const categorias = [
    { nome: 'Cartão de Crédito', atual: mesAtual.cartaoCredito, anterior: mesAnterior.cartaoCredito },
    { nome: 'Contas Fixas', atual: mesAtual.contasFixas, anterior: mesAnterior.contasFixas },
    { nome: 'Hashish', atual: mesAtual.hashish * 95, anterior: mesAnterior.hashish * 95 },
    { nome: 'Mercado', atual: mesAtual.mercado, anterior: mesAnterior.mercado },
    { nome: 'Gasolina', atual: mesAtual.gasolina, anterior: mesAnterior.gasolina }
  ]

  return categorias.map(cat => {
    const variacao = cat.anterior > 0 ? ((cat.atual - cat.anterior) / cat.anterior) * 100 : 0
    let alerta: 'normal' | 'aumento' | 'reducao' = 'normal'

    if (variacao > 20) alerta = 'aumento'
    else if (variacao < -20) alerta = 'reducao'

    return {
      categoria: cat.nome,
      alerta,
      variacao
    }
  })
}

/**
 * Gera sugestões de economia baseadas nos padrões de gastos
 */
export function gerarSugestoesEconomia(gastosMensais: GastosMensais[]): string[] {
  if (gastosMensais.length === 0) return []

  const mesAtual = gastosMensais[0]
  const sugestoes = []

  // Sugestões baseadas nos gastos atuais
  if (mesAtual.cartaoCredito > mesAtual.salarioLiquido * 0.3) {
    sugestoes.push('💳 Considere reduzir o uso do cartão de crédito para no máximo 30% da sua renda')
  }

  if (mesAtual.hashish * 95 > 500) {
    sugestoes.push('🌿 O gasto com hashish está alto. Considere reduzir a quantidade ou buscar preços melhores')
  }

  if (mesAtual.mercado > 800) {
    sugestoes.push('🛒 Gastos com mercado elevados. Tente fazer lista de compras e evitar impulsos')
  }

  if (mesAtual.gasolina > 400) {
    sugestoes.push('⛽ Considere usar mais transporte público ou otimizar suas rotas')
  }

  return sugestoes
} 