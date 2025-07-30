import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const token = req.headers.get('sb-access-token') || '';
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const body = await req.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const newTransactions = [];
  const existingTransactions = [];

  for (const t of body) {
    const { data: existing } = await supabase
      .from('transacoes')
      .select('id')
      .eq('user_id', user.id)
      .eq('data', t.data)
      .eq('valor', t.valor)
      .ilike('descricao', t.descricao)
      .limit(1);

    if (existing && existing.length > 0) {
      existingTransactions.push(t);
    } else {
      newTransactions.push({ ...t, user_id: user.id });
    }
  }

  if (newTransactions.length > 0) {
    const { error } = await supabase.from('transacoes').insert(newTransactions);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    imported: newTransactions.length,
    skipped: existingTransactions.length,
    message: `${newTransactions.length} transações importadas, ${existingTransactions.length} ignoradas (duplicadas).`
  });
}
