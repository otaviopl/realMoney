import Formulario from '../components/Formulario'
import Dashboard from '../components/Dashboard'

export default function Home() {
  return (
    <main className="min-h-screen p-4 space-y-6">
      <h1 className="text-2xl font-bold">Financeiro</h1>
      <Formulario />
      <Dashboard />
    </main>
  )
}
