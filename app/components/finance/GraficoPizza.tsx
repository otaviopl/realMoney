'use client'
import { PieChart, Pie, Cell, Tooltip } from 'recharts'

interface Props {
  data: { name: string; value: number }[]
}

export default function GraficoPizza({ data }: Props) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']
  return (
    <PieChart width={200} height={200}>
      <Pie data={data} dataKey="value" nameKey="name" outerRadius={80}>
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  )
}
