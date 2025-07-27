'use client'
import { useEffect, useState } from 'react'
import GraficoPizza from './GraficoPizza'
import GraficoProgresso from './GraficoProgresso'
import { GastosMensais } from '../types/types'

export default function Dashboard() {
  const [gastos, setGastos] = useState<GastosMensais[]>([])

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/gastos')
      const data = await res.json()
      setGastos(data || [])
    }
    load()
  }, [])

  const latest = gastos[gastos.length - 1]
  const sobra = latest
    ? latest.salarioLiquido -
      latest.cartaoCredito -
      latest.contasFixas -
      latest.hashishGramas * 90 -
      latest.flash
    : 0

  const dataPizza = latest
    ? [
        { name: 'Cartão', value: latest.cartaoCredito },
        { name: 'Contas', value: latest.contasFixas },
        { name: 'Hashish', value: latest.hashishGramas * 90 },
        { name: 'Flash', value: latest.flash },
      ]
    : []

  const sobraClass = sobra >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border rounded shadow p-4 text-center">
        <span className="block text-sm text-gray-500">Sobra mensal estimada</span>
        <span className={`text-2xl font-bold ${sobraClass}`}>R${sobra}</span>
      </div>
      <GraficoPizza data={dataPizza} />
      <GraficoProgresso meta={12000} acumulado={sobra} />
    </div>
  )
}
