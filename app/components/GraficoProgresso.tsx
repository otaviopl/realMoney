'use client'
import { BarChart, Bar, XAxis, Tooltip } from 'recharts'

interface Props {
  meta: number
  acumulado: number
}

export default function GraficoProgresso({ meta, acumulado }: Props) {
  const data = [
    { name: 'Meta', valor: meta },
    { name: 'Atual', valor: acumulado },
  ]
  return (
    <BarChart width={200} height={150} data={data}>
      <XAxis dataKey="name" />
      <Bar dataKey="valor" fill="#8884d8" />
      <Tooltip />
    </BarChart>
  )
}
