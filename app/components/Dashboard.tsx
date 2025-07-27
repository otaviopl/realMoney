'use client'
import { useEffect, useState } from 'react'
import GraficoBarras from './GraficoBarras'
import GraficoLinha from './GraficoLinha'
import GraficoProgresso from './GraficoProgresso'
import Historico from './Historico'
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
    ? latest.salarioLiquido +
      latest.flashRecebido -
      latest.cartaoCredito -
      latest.contasFixas -
      latest.hashishGramas * 90 -
      latest.mercado -
      latest.gasolina
    : 0

  const dataBarras = latest
    ? [
        { name: 'Cartão', value: latest.cartaoCredito },
        { name: 'Contas', value: latest.contasFixas },
        { name: 'Hashish', value: latest.hashishGramas * 90 },
        { name: 'Mercado', value: latest.mercado },
        { name: 'Gasolina', value: latest.gasolina },
      ]
    : []

  const dataLinha = gastos.map((g) => ({
    name: g.mes,
    sobra:
      g.salarioLiquido +
      g.flashRecebido -
      g.cartaoCredito -
      g.contasFixas -
      g.hashishGramas * 90 -
      g.mercado -
      g.gasolina,
  }))

  const acumulado = dataLinha.reduce((acc, d) => acc + d.sobra, 0)
  const mesesRestantes = sobra > 0 ? Math.ceil((12000 - acumulado) / sobra) : 0

  const sobraClass = sobra >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white border rounded shadow p-4 text-center">
        <span className="block text-sm text-gray-500">Sobra mensal estimada</span>
        <span className={`text-2xl font-bold ${sobraClass}`}>R${sobra}</span>
      </div>
      <GraficoBarras data={dataBarras} />
      <GraficoLinha data={dataLinha} />
      <GraficoProgresso meta={12000} acumulado={acumulado} />
      <p className="text-center text-sm text-gray-600">
        Você vai atingir R$12k em {mesesRestantes} meses
      </p>
      <Historico registros={gastos} />
    </div>
  )
}
