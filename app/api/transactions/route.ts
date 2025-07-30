import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  const token = req.headers.get('sb-access-token') || ''
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase.from('transacoes').select('*').eq('user_id', user.id).order('data', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('sb-access-token') || ''
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )
    const body = await req.json()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // Validate transaction data
    if (!body.tipo || (body.tipo !== 'entrada' && body.tipo !== 'saida')) {
      return NextResponse.json({ error: 'Tipo de transação deve ser "entrada" ou "saida"' }, { status: 400 });
    }
    
    if (!body.valor || isNaN(Number(body.valor)) || Number(body.valor) <= 0) {
      return NextResponse.json({ error: 'Valor da transação deve ser maior que zero' }, { status: 400 });
    }
    
    if (!body.data) {
      return NextResponse.json({ error: 'Data da transação é obrigatória' }, { status: 400 });
    }
    
    // Check for duplicates to prevent insertion of same transaction
    const { data: existing } = await supabase
      .from('transacoes')
      .select('id')
      .eq('user_id', user.id)
      .eq('data', body.data)
      .eq('valor', body.valor)
      .eq('tipo', body.tipo)
      .ilike('descricao', body.descricao || '')
      .limit(1);

    if (existing && existing.length > 0) {
      return NextResponse.json({ error: 'Esta transação já foi registrada' }, { status: 409 });
    }
    
    const { data, error } = await supabase.from('transacoes').insert({ ...body, user_id: user.id }).select().single()
    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
