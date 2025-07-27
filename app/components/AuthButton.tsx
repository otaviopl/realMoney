'use client'
import { supabaseBrowser } from '../../lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthButton() {
  const router = useRouter()
  const handleSignOut = async () => {
    await supabaseBrowser.auth.signOut()
    router.push('/login')
  }
  return (
    <button onClick={handleSignOut} className="text-sm text-gray-500">
      Sair
    </button>
  )
}
