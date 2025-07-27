'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import GraficoPizza from './GraficoPizza'
import GraficoProgresso from './GraficoProgresso'
import { GastosMensais } from '../types/types'

export default function Dashboard() {
  const [gastos, setGastos] = useState<GastosMensais[]>([])

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('gastos_mensais').select('*')
      setGastos(data || [])
    }
    load()
  }, [])

  const total = gastos.reduce((acc, g) => acc + g.salarioLiquido, 0)
  const totalGastos = gastos.reduce(
    (acc, g) =>
      acc +
      g.cartaoCredito +
      g.contasFixas +
      g.diversao +
      g.flash,
    0
  )

  const sobra = total - totalGastos

  const dataPizza = [
    { name: 'Cartão', value: totalGastos ? gastos[gastos.length - 1].cartaoCredito : 0 },
    { name: 'Contas', value: totalGastos ? gastos[gastos.length - 1].contasFixas : 0 },
    { name: 'Diversão', value: totalGastos ? gastos[gastos.length - 1].diversao : 0 },
    { name: 'Flash', value: totalGastos ? gastos[gastos.length - 1].flash : 0 },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="border p-4">Sobra mensal estimada: R${sobra}</div>
      <GraficoPizza data={dataPizza} />
      <GraficoProgresso meta={12000} acumulado={sobra} />
    </div>
  )
}
