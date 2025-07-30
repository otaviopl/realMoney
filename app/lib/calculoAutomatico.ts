import { Transacao, ResumoMensal, Categoria, GastoMensal } from '../types/types';

const normalizeString = (str: string | null | undefined): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
};

/**
 * Transações que são movimentações internas (transferências entre contas),
 * pagamentos de fatura ou movimentações de investimento não devem impactar
 * o cálculo de entradas / saídas. Mantemos a lista em minúsculo, já
 * normalizada, para facilitar a comparação.
 */
const IGNORE_PATTERNS_DEPRECATED = [
  'aplicacao rdb',              // já estava sendo ignorado
  'pagamento fatura',           // pagamento de fatura cartão de crédito
  'fatura',                     // transferência automática Nubank – "FATURA
  'pagamento',                  // genérico, mas necessário para pegar "PAGAMENTO CARTAO"
  'resgate',                    // resgates de investimento
  'transferencia',             // transf. entre contas
  'pix enviado',
  'pix recebido'
];

const isIgnorableDeprecated = (descricao?: string | null): boolean => {
  const desc = normalizeString(descricao);
  return IGNORE_PATTERNS_DEPRECATED.some(p => desc.includes(p));
};

// -- Nova lógica dinâmica de ignorar padrões --
const GLOBAL_IGNORE_PATTERNS = [
  'resgate', // resgates de investimento
  'adicionado',
  'aplicacao rdb'
];

const MONTHLY_IGNORE_PATTERNS = [
  'aplicacao rdb',       // aplicações de investimento
  'adicionado',
  'resgate'
  // REMOVIDO: 'fatura' e 'pagamento' para contabilizar pagamentos de fatura como saídas normais
];

const isIgnorable = (descricao?: string | null, mes?: string): boolean => {
  const desc = normalizeString(descricao);
  const patterns = mes ? MONTHLY_IGNORE_PATTERNS : GLOBAL_IGNORE_PATTERNS;
  return patterns.some(p => desc.includes(p));
};

// Função para detectar se é salário baseado no nome/descrição
const isSalario = (descricao?: string | null): boolean => {
  if (!descricao) return false;
  const desc = normalizeString(descricao);
  
  // Padrões que indicam salário (baseado no exemplo: "OTAVIO PEREIRA LOPES")
  const padroesSalario = [
    'otavio lopes',
    'otávio lopes',
    'otavio pereira lopes',
    'otávio pereira lopes',
    'salario',
    'salário'
  ];
  
  // Verificar se é transferência recebida COM nome do Otávio
  const isTransferenciaComOtavio = desc.includes('transferencia recebida') && 
    (desc.includes('otavio') || desc.includes('otávio'));
  
  return padroesSalario.some(padrao => desc.includes(padrao)) || isTransferenciaComOtavio;
};

export const calcularSaldoComNovaFormula = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  salario: number,
  mes?: string
): number => {
  let transacoesFiltradas = transacoes;
  if (mes) {
    transacoesFiltradas = transacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data);
      const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      return mesTransacao.toLowerCase() === mes.toLowerCase();
    });
  }

  // Separar entradas: salário detectado automaticamente vs outras entradas
  const salarioDetectado = transacoesFiltradas
    .filter(t => t.tipo === 'entrada' && !isIgnorable(t.descricao, mes) && isSalario(t.descricao))
    .reduce((total, t) => total + Number(t.valor), 0);

  const outrasEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada' && !isIgnorable(t.descricao, mes) && !isSalario(t.descricao))
    .reduce((total, t) => total + Number(t.valor), 0);

  // Total de entradas reais (incluindo salário detectado)
  const totalEntradasReais = salarioDetectado + outrasEntradas;

  // Total de saídas reais (incluindo pagamentos de fatura)
  const totalSaidasReais = transacoesFiltradas
    .filter(t => t.tipo === 'saida' && !isIgnorable(t.descricao, mes))
    .reduce((total, t) => total + Number(t.valor), 0);

  // Gastos mensais planejados (que podem não ter sido executados ainda)
  let gastosMensaisFiltrados = gastosMensais;
  if (mes) {
    gastosMensaisFiltrados = gastosMensais.filter(gasto => 
      gasto.mes.toLowerCase() === mes.toLowerCase()
    );
  }

  const totalGastosPlanejados = gastosMensaisFiltrados.reduce((total, gasto) => {
    return total + (gasto.valor_total || (gasto.quantidade * (gasto.valor_unitario || 0)));
  }, 0);

  // FÓRMULA SIMPLIFICADA E CORRIGIDA:
  // Saldo = (Entradas Reais + Salário Manual) - (Saídas Reais) - (Gastos Planejados não executados)
  // Se salário foi detectado automaticamente, usar esse valor; senão usar o manual
  const salarioTotal = salarioDetectado > 0 ? salarioDetectado : salario;
  
  return (salarioTotal + outrasEntradas) - totalSaidasReais - totalGastosPlanejados;
};

export const obterResumoDetalhado = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  salario: number,
  mes?: string
) => {
  let transacoesFiltradas = transacoes;
  if (mes) {
    transacoesFiltradas = transacoes.filter(transacao => {
      const dataTransacao = new Date(transacao.data);
      const mesTransacao = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      return mesTransacao.toLowerCase() === mes.toLowerCase();
    });
  }

  // Separar entradas: salário detectado automaticamente vs outras entradas
  const salarioDetectado = transacoesFiltradas
    .filter(t => t.tipo === 'entrada' && !isIgnorable(t.descricao, mes) && isSalario(t.descricao))
    .reduce((total, t) => total + Number(t.valor), 0);

  const outrasEntradas = transacoesFiltradas
    .filter(t => t.tipo === 'entrada' && !isIgnorable(t.descricao, mes) && !isSalario(t.descricao))
    .reduce((total, t) => total + Number(t.valor), 0);

  // Total de saídas reais (incluindo pagamentos de fatura)
  const totalSaidas = transacoesFiltradas
    .filter(t => t.tipo === 'saida' && !isIgnorable(t.descricao, mes))
    .reduce((total, t) => total + Number(t.valor), 0);

  // Gastos mensais planejados
  let gastosMensaisFiltrados = gastosMensais;
  if (mes) {
    gastosMensaisFiltrados = gastosMensais.filter(gasto => 
      gasto.mes.toLowerCase() === mes.toLowerCase()
    );
  }

  const totalGastosPlanejados = gastosMensaisFiltrados.reduce((total, gasto) => {
    return total + (gasto.valor_total || (gasto.quantidade * (gasto.valor_unitario || 0)));
  }, 0);

  // Usar salário detectado se disponível, senão usar o manual
  const salarioTotal = salarioDetectado > 0 ? salarioDetectado : salario;
  const totalEntradas = salarioTotal + outrasEntradas;

  const saldoFinal = calcularSaldoComNovaFormula(transacoes, gastosMensais, salario, mes);

  // Log for debugging - nova estrutura
  console.log(`Cálculo para ${mes || 'todos os meses'}:`, {
    salarioManual: salario,
    salarioDetectado,
    salarioTotal,
    outrasEntradas,
    totalEntradas,
    totalSaidas,
    totalGastosPlanejados,
    saldoFinal,
    formula: `(${salarioTotal} + ${outrasEntradas}) - ${totalSaidas} - ${totalGastosPlanejados} = ${saldoFinal}`
  });

  return {
    totalEntradas,
    outrasEntradas,
    totalSaidas,
    totalDespesasForms: totalGastosPlanejados, // Renomeado para ficar claro
    salario: salarioTotal, // Usar o salário efetivo (detectado ou manual)
    salarioDetectado,
    saldoFinal,
    detalhesCalculo: {
      formula: '(Salário Total + Outras Entradas) - Saídas - Gastos Planejados',
      entradas: totalEntradas,
      outrasEntradas,
      saidas: totalSaidas,
      salario: salarioTotal,
      salarioDetectado,
      gastosPlanejados: totalGastosPlanejados,
      resultado: `(${salarioTotal} + ${outrasEntradas}) - ${totalSaidas} - ${totalGastosPlanejados} = ${saldoFinal}`
    }
  };
}; 

export const validarCalculos = (
  transacoes: Transacao[],
  gastosMensais: GastoMensal[],
  salario: number,
  mes?: string
) => {
  const resumo = obterResumoDetalhado(transacoes, gastosMensais, salario, mes);
  
  const validation = {
    isValid: true,
    warnings: [] as string[],
    errors: [] as string[]
  };

  // Validar se as transações têm valores válidos
  const transacoesInvalidas = transacoes.filter(t => 
    isNaN(Number(t.valor)) || Number(t.valor) <= 0
  );
  if (transacoesInvalidas.length > 0) {
    validation.errors.push(`${transacoesInvalidas.length} transações com valores inválidos encontradas`);
    validation.isValid = false;
  }

  // Validar se os gastos mensais têm valores válidos
  const gastosInvalidos = gastosMensais.filter(g => 
    isNaN(Number(g.valor_total)) || Number(g.valor_total) <= 0
  );
  if (gastosInvalidos.length > 0) {
    validation.warnings.push(`${gastosInvalidos.length} gastos mensais com valores inválidos encontrados`);
  }

  // Validar fórmula
  const calculoManual = (resumo.totalEntradas - resumo.totalSaidas) - (salario - resumo.totalDespesasForms);
  if (Math.abs(calculoManual - resumo.saldoFinal) > 0.01) {
    validation.errors.push(`Inconsistência no cálculo: esperado ${calculoManual}, obtido ${resumo.saldoFinal}`);
    validation.isValid = false;
  }

  // Verificar se há entradas/saídas não classificadas
  const transacoesSemTipo = transacoes.filter(t => !t.tipo || (t.tipo !== 'entrada' && t.tipo !== 'saida'));
  if (transacoesSemTipo.length > 0) {
    validation.warnings.push(`${transacoesSemTipo.length} transações sem tipo definido`);
  }

  return {
    ...resumo,
    validation
  };
};
