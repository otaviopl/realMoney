import { NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabaseClient'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const body = await request.json()
  const { data, error } = await supabase.from('gastos_mensais').update(body).eq('id', id).select()
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data[0])
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const { id } = params
  const { error } = await supabase.from('gastos_mensais').delete().eq('id', id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ message: 'Gasto mensal deletado com sucesso' })
}
