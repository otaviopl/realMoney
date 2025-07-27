'use client'
import { useState } from 'react'

export default function Configuracoes() {
  const [meta, setMeta] = useState(12000)
  const [saldoInicial, setSaldoInicial] = useState(0)

  return (
    <form className="p-4 space-y-2">
      <input
        className="border p-2 w-full"
        type="number"
        value={meta}
        onChange={(e) => setMeta(Number(e.target.value))}
        placeholder="Meta para o carro"
      />
      <input
        className="border p-2 w-full"
        type="number"
        value={saldoInicial}
        onChange={(e) => setSaldoInicial(Number(e.target.value))}
        placeholder="Saldo inicial"
      />
    </form>
  )
}
