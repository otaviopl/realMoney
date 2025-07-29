import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || ''
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // Verificar usuário autenticado
    const { data: { user } } = await supabaseWithAuth.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar transações
    const { data: transacoes, error: transacoesError } = await supabaseWithAuth
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })

    if (transacoesError) throw transacoesError

    // Buscar categorias
    const { data: categorias, error: categoriasError } = await supabaseWithAuth
      .from('categorias')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')

    if (categoriasError) throw categoriasError

    // Buscar contatos
    const { data: contatos, error: contatosError } = await supabaseWithAuth
      .from('contatos')
      .select('*')
      .eq('user_id', user.id)
      .order('nome')

    if (contatosError) throw contatosError

    // Buscar configurações
    const { data: configuracoes, error: configError } = await supabaseWithAuth
      .from('configuracoes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Configuração pode não existir ainda, então não consideramos erro
    
    // Buscar gastos mensais
    const { data: gastosMensais, error: gastosError } = await supabaseWithAuth
      .from('gastos_mensais')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (gastosError) throw gastosError

    // Calcular resumos por mês baseado nas transações
    const resumosPorMes = calcularResumosPorMes(transacoes || [])

    // Calcular resumo atual (mês mais recente)
    const resumoAtual = resumosPorMes.length > 0 ? resumosPorMes[0] : {
      totalEntradas: 0,
      totalSaidas: 0,
      totalDespesasForms: 0,
      saldoFinal: 0,
      detalhesCalculo: {
        formula: '0 - 0 - 0',
        entradas: 0,
        saidas: 0,
        salario: 0,
        despesasForms: 0,
        resultado: 'R$ 0,00'
      }
    }

    // Calcular estatísticas gerais
    const estatisticas = {
      totalTransacoes: transacoes?.length || 0,
      totalCategorias: categorias?.length || 0,
      totalContatos: contatos?.length || 0,
      mesesComDados: resumosPorMes.length
    }

    const dashboardData = {
      resumoAtual,
      resumosPorMes,
      transacoes: transacoes || [],
      gastosMensais: gastosMensais || [],
      configuracoes: configuracoes || {
        meta_reserva: 12000,
        saldo_inicial: 0
      },
      categorias: categorias || [],
      contatos: contatos || [],
      estatisticas
    }

    return NextResponse.json(dashboardData)

  } catch (error: any) {
    console.error('Erro na API dashboard:', error)
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function calcularResumosPorMes(transacoes: any[]) {
  const resumos: { [key: string]: any } = {}

  transacoes.forEach(transacao => {
    const data = new Date(transacao.data)
    const mes = data.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    
    if (!resumos[mes]) {
      resumos[mes] = {
        mes,
        totalEntradas: 0,
        totalSaidas: 0,
        totalDespesasForms: 0,
        saldoFinal: 0,
        transacoes: 0,
        detalhesCalculo: {
          formula: '',
          entradas: 0,
          saidas: 0,
          salario: 0,
          despesasForms: 0,
          resultado: ''
        }
      }
    }

    resumos[mes].transacoes++

    if (transacao.tipo === 'entrada') {
      resumos[mes].totalEntradas += transacao.valor
    } else {
      resumos[mes].totalSaidas += transacao.valor
    }
  })

  // Calcular saldo final e detalhes para cada mês
  Object.values(resumos).forEach((resumo: any) => {
    resumo.saldoFinal = resumo.totalEntradas - resumo.totalSaidas - resumo.totalDespesasForms
    
    resumo.detalhesCalculo = {
      formula: `${resumo.totalEntradas} - ${resumo.totalSaidas} - ${resumo.totalDespesasForms}`,
      entradas: resumo.totalEntradas,
      saidas: resumo.totalSaidas,
      salario: 0, // Para compatibilidade
      despesasForms: resumo.totalDespesasForms,
      resultado: `R$ ${resumo.saldoFinal.toLocaleString('pt-BR')}`
    }
  })

  // Ordenar por data (mais recente primeiro)
  return Object.values(resumos).sort((a: any, b: any) => {
    return new Date(b.mes).getTime() - new Date(a.mes).getTime()
  })
}