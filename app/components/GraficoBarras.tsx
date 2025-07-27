'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface Props {
  data: { name: string; value: number }[]
}

export default function GraficoBarras({ data }: Props) {
  return (
    <BarChart width={300} height={200} data={data} layout="vertical">
      <XAxis type="number" hide />
      <YAxis dataKey="name" type="category" width={80} />
      <Bar dataKey="value" fill="#333" />
      <Tooltip />
    </BarChart>
  )
}
