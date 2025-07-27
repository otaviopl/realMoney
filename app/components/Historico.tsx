'use client'
import Link from 'next/link'
import { GastosMensais } from '../types/types'

interface Props {
  registros: GastosMensais[]
}

export default function Historico({ registros }: Props) {
  if (!registros.length) return null

  return (
    <div className="space-y-2">
      {registros.map((g) => (
        <div key={g.mes} className="border p-2 flex justify-between">
          <span>{g.mes}</span>
          <span className="space-x-2 text-sm">
            <Link href="#" className="underline">
              editar
            </Link>
            <Link href="#" className="underline">
              clonar
            </Link>
          </span>
        </div>
      ))}
    </div>
  )
}
