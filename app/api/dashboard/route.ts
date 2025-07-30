import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { obterResumoDetalhado, validarCalculos } from '../../lib/calculoAutomatico';
import type { Transacao, GastoMensal } from '../../types/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || '';
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase environment variables not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const supabaseWithAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseWithAuth.auth.getUser();
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const salario = Number(searchParams.get('salario')) || 0;

    // Buscar dados com tratamento de erro individual
    let transacoes: any[] = [];
    let gastosMensais: any[] = [];
    let categorias: any[] = [];
    let contatos: any[] = [];

    try {
      const { data: transacoesData, error: transacoesError } = await supabaseWithAuth
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false });

      if (transacoesError) {
        console.error('Error fetching transacoes:', transacoesError);
        // Continue with empty array instead of throwing
      } else {
        transacoes = transacoesData || [];
      }
    } catch (error) {
      console.error('Exception fetching transacoes:', error);
      transacoes = [];
    }

    try {
      const { data: gastosData, error: gastosError } = await supabaseWithAuth
        .from('gastos_mensais')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (gastosError) {
        console.error('Error fetching gastos_mensais:', gastosError);
      } else {
        gastosMensais = gastosData || [];
      }
    } catch (error) {
      console.error('Exception fetching gastos_mensais:', error);
      gastosMensais = [];
    }

    try {
      const { data: categoriasData, error: categoriasError } = await supabaseWithAuth
        .from('categorias')
        .select('*')
        .eq('user_id', user.id);

      if (categoriasError) {
        console.error('Error fetching categorias:', categoriasError);
      } else {
        categorias = categoriasData || [];
      }
    } catch (error) {
      console.error('Exception fetching categorias:', error);
      categorias = [];
    }

    try {
      const { data: contatosData, error: contatosError } = await supabaseWithAuth
        .from('contatos')
        .select('*')
        .eq('user_id', user.id);

      if (contatosError) {
        console.error('Error fetching contatos:', contatosError);
      } else {
        contatos = contatosData || [];
      }
    } catch (error) {
      console.error('Exception fetching contatos:', error);
      contatos = [];
    }

    const transacoesPorMes: { [key: string]: Transacao[] } = {};
    (transacoes || []).forEach(transacao => {
      const mes = new Date(transacao.data).toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      if (!transacoesPorMes[mes]) {
        transacoesPorMes[mes] = [];
      }
      transacoesPorMes[mes].push(transacao);
    });

    const gastosPorMes: { [key: string]: GastoMensal[] } = {};
    (gastosMensais || []).forEach(gasto => {
      const mes = gasto.mes;
      if (!gastosPorMes[mes]) {
        gastosPorMes[mes] = [];
      }
      gastosPorMes[mes].push(gasto);
    });

    const meses = Array.from(new Set([...Object.keys(transacoesPorMes), ...Object.keys(gastosPorMes)]));

    const resumosPorMes = meses.map(mes => {
      try {
        const resumo = obterResumoDetalhado(
          transacoesPorMes[mes] || [],
          gastosPorMes[mes] || [],
          salario,
          mes
        );
        return { 
          mes, 
          ...resumo, 
          transacoes: (transacoesPorMes[mes] || []).length,
          // Garantir que salarioDetectado sempre existe
          salarioDetectado: resumo.salarioDetectado || 0
        };
      } catch (error) {
        console.error(`Error calculating resumo for month ${mes}:`, error);
        return {
          mes,
          totalEntradas: 0,
          outrasEntradas: 0,
          totalSaidas: 0,
          totalDespesasForms: 0,
          salario: salario,
          salarioDetectado: 0,
          saldoFinal: 0,
          transacoes: (transacoesPorMes[mes] || []).length,
          detalhesCalculo: {
            formula: 'Error in calculation',
            entradas: 0,
            outrasEntradas: 0,
            saidas: 0,
            salario: salario,
            salarioDetectado: 0,
            gastosPlanejados: 0,
            resultado: 'Error'
          }
        };
      }
    }).sort((a, b) => {
      try {
        return new Date(b.mes).getTime() - new Date(a.mes).getTime();
      } catch {
        return 0;
      }
    });

    // Adicionar resumo GERAL de todas as transações
    let resumoGeral;
    try {
      // Para o resumo geral, calcular salário médio baseado nos meses ou usar o informado
      const salarioParaResumoGeral = resumosPorMes.length > 0 
        ? (salario > 0 ? salario * resumosPorMes.length : 0) // Se tem salário informado, multiplicar pelo número de meses
        : salario;
        
      const resumoGeralCalculado = obterResumoDetalhado(
        transacoes || [],
        gastosMensais || [],
        salarioParaResumoGeral
      );
      resumoGeral = {
        ...resumoGeralCalculado,
        mes: 'Todos os meses',
        transacoes: (transacoes || []).length,
        numeroMeses: resumosPorMes.length,
        // Garantir que salarioDetectado sempre existe
        salarioDetectado: resumoGeralCalculado.salarioDetectado || 0
      };
    } catch (error) {
      console.error('Error calculating resumo geral:', error);
      resumoGeral = {
        totalEntradas: 0,
        outrasEntradas: 0,
        totalSaidas: 0,
        totalDespesasForms: 0,
        salario: salario,
        salarioDetectado: 0,
        saldoFinal: 0,
        mes: 'Todos os meses',
        transacoes: (transacoes || []).length,
        numeroMeses: resumosPorMes.length,
        detalhesCalculo: {
          formula: 'Error in calculation',
          entradas: 0,
          outrasEntradas: 0,
          saidas: 0,
          salario: salario,
          salarioDetectado: 0,
          gastosPlanejados: 0,
          resultado: 'Error'
        }
      };
    }

    const resumoAtual = resumosPorMes.length > 0 ? resumosPorMes[0] : {
      totalEntradas: 0,
      totalSaidas: 0,
      totalDespesasForms: 0,
      saldoFinal: 0,
      detalhesCalculo: { formula: '', entradas: 0, saidas: 0, salario: 0, despesasForms: 0, resultado: '' }
    };

    const dashboardData = {
      resumoAtual,
      resumoGeral, // Novo: resumo de todas as transações
      resumosPorMes,
      transacoes: transacoes || [],
      gastosMensais: gastosMensais || [],
      categorias: categorias || [],
      contatos: contatos || [],
    };

    return NextResponse.json(dashboardData);

  } catch (error: any) {
    console.error('Erro na API dashboard:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}