import { redirect } from 'next/navigation'
import Home from './pages/index'
import { createSupabaseServerClient } from '../lib/supabase'

export default async function Page() {
  const supabase = createSupabaseServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  return <Home />
}
