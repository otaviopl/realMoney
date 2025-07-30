import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || '';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const mes = searchParams.get('mes');

    let query = supabase
      .from('gastos_mensais')
      .select('*')
      .eq('user_id', user.id);

    if (mes) {
      query = query.eq('mes', mes);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao buscar gastos mensais:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || '';
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    // Validate required fields
    if (!body.nome || body.nome.trim() === '') {
      return NextResponse.json({ error: 'Nome do gasto é obrigatório' }, { status: 400 });
    }
    
    if (!body.mes || body.mes.trim() === '') {
      return NextResponse.json({ error: 'Mês é obrigatório' }, { status: 400 });
    }
    
    if (!body.quantidade || isNaN(Number(body.quantidade)) || Number(body.quantidade) <= 0) {
      return NextResponse.json({ error: 'Quantidade deve ser maior que zero' }, { status: 400 });
    }
    
    // Calculate valor_total based on available data
    let valorTotalCalculado = 0;
    if (body.valor_total && body.valor_total > 0) {
      // If valor_total is provided directly (fixed expense)
      valorTotalCalculado = body.valor_total;
    } else if (body.quantidade && body.valor_unitario) {
      // If quantidade and valor_unitario are provided (variable expense)
      valorTotalCalculado = body.quantidade * body.valor_unitario;
    } else {
      // Default case - just use quantidade as valor_total
      valorTotalCalculado = body.quantidade || 0;
    }
    
    if (valorTotalCalculado <= 0) {
      return NextResponse.json({ error: 'Valor total calculado deve ser maior que zero' }, { status: 400 });
    }

    const gastoData = {
      user_id: user.id,
      mes: body.mes,
      categoria_id: body.categoria_id || null,
      nome: body.nome,
      quantidade: body.quantidade || 1,
      valor_unitario: body.valor_unitario || null,
      valor_total: valorTotalCalculado
    };

    // Check for duplicates to prevent insertion of same expense
    const { data: existing } = await supabase
      .from('gastos_mensais')
      .select('id')
      .eq('user_id', user.id)
      .eq('mes', gastoData.mes)
      .eq('nome', gastoData.nome)
      .eq('valor_total', gastoData.valor_total)
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Este gasto já foi registrado para este mês' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('gastos_mensais')
      .insert(gastoData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro ao criar gasto mensal:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
