'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'

interface Props {
  data: { name: string; sobra: number }[]
}

export default function GraficoLinha({ data }: Props) {
  return (
    <LineChart width={300} height={200} data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Line type="monotone" dataKey="sobra" stroke="#000" />
      <Tooltip />
    </LineChart>
  )
}
