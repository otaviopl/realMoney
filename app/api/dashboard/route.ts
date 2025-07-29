import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { obterResumoDetalhado } from '../../lib/calculoAutomatico'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || ''
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // Verificar se o usuário está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Buscar transações do usuário
    const { data: transacoes, error: transacoesError } = await supabase
      .from('transacoes')
      .select('*')
      .eq('user_id', user.id)
      .order('data', { ascending: false })

    if (transacoesError) {
      return NextResponse.json({ error: transacoesError.message }, { status: 500 })
    }

    // Buscar gastos mensais do usuário
    const { data: gastosMensais, error: gastosError } = await supabase
      .from('gastos_mensais')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (gastosError) {
      return NextResponse.json({ error: gastosError.message }, { status: 500 })
    }

    // Buscar configurações do usuário
    const { data: configuracoes, error: configError } = await supabase
      .from('configuracoes')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: configError.message }, { status: 500 })
    }

    // Buscar categorias do usuário
    const { data: categorias, error: categoriasError } = await supabase
      .from('categorias')
      .select('*')
      .eq('user_id', user.id)

    if (categoriasError) {
      return NextResponse.json({ error: categoriasError.message }, { status: 500 })
    }

    // Buscar contatos do usuário
    const { data: contatos, error: contatosError } = await supabase
      .from('contatos')
      .select('*')
      .eq('user_id', user.id)

    if (contatosError) {
      return NextResponse.json({ error: contatosError.message }, { status: 500 })
    }

    // Obter parâmetros da query para filtrar por mês se necessário
    const url = new URL(req.url)
    const mes = url.searchParams.get('mes')

    // Calcular resumo usando a nova fórmula
    const resumoDetalhado = obterResumoDetalhado(
      transacoes || [], 
      gastosMensais || [], 
      mes || undefined
    )

    // Calcular totais por mês
    const resumosPorMes = calcularResumosPorMes(transacoes || [], gastosMensais || [])

    // Preparar resposta
    const dashboardData = {
      resumoAtual: resumoDetalhado,
      resumosPorMes,
      transacoes: transacoes || [],
      gastosMensais: gastosMensais || [],
      configuracoes: configuracoes || { meta_reserva: 12000, saldo_inicial: 0 },
      categorias: categorias || [],
      contatos: contatos || [],
      estatisticas: {
        totalTransacoes: (transacoes || []).length,
        totalCategorias: (categorias || []).length,
        totalContatos: (contatos || []).length,
        mesesComDados: resumosPorMes.length
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Erro na API do dashboard:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Função auxiliar para calcular resumos por mês
function calcularResumosPorMes(transacoes: any[], gastosMensais: any[]) {
  const mesesComDados = new Set<string>()
  
  // Coletar meses das transações
  transacoes.forEach(transacao => {
    const dataTransacao = new Date(transacao.data)
    const mes = dataTransacao.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })
    mesesComDados.add(mes)
  })

  // Coletar meses dos gastos mensais
  gastosMensais.forEach(gasto => {
    mesesComDados.add(gasto.mes)
  })

  // Calcular resumo para cada mês
  return Array.from(mesesComDados).map(mes => {
    const resumo = obterResumoDetalhado(transacoes, gastosMensais, mes)
    return {
      mes,
      ...resumo
    }
  }).sort((a, b) => {
    // Ordenar por data (mais recente primeiro)
    const dataA = new Date(a.mes.split(' ').reverse().join('/'))
    const dataB = new Date(b.mes.split(' ').reverse().join('/'))
    return dataB.getTime() - dataA.getTime()
  })
}