import Formulario from '../components/Formulario'
import Dashboard from '../components/Dashboard'

export default function Home() {
  return (
    <main className="min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Financeiro do Otavio</h1>
      <Formulario />
      <Dashboard />
    </main>
  )
}
