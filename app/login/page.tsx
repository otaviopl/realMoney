'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '../../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password })
    if (!error) router.push('/')
  }

  return (
    <form onSubmit={handleLogin} className="p-4 space-y-2 max-w-sm mx-auto">
      <input className="border p-2 w-full" type="email" placeholder="Email" value={email} onChange={(e)=>setEmail(e.target.value)} />
      <input className="border p-2 w-full" type="password" placeholder="Senha" value={password} onChange={(e)=>setPassword(e.target.value)} />
      <button className="bg-black text-white w-full py-2" type="submit">Entrar</button>
    </form>
  )
}
