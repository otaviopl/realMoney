'use client'
import { useState } from 'react'

export default function Formulario() {
  const [mes, setMes] = useState('')
  const [salarioLiquido, setSalarioLiquido] = useState(0)
  const [cartaoCredito, setCartaoCredito] = useState(0)
  const [contasFixas, setContasFixas] = useState(0)
  const [hashishGramas, setHashishGramas] = useState(0)
  const [flash, setFlash] = useState(700)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/gastos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mes,
        salarioLiquido,
        cartaoCredito,
        contasFixas,
        hashishGramas,
        flash,
      }),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 p-4">
      <input
        className="border p-2 w-full"
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        placeholder="Mês"
      />
      <input
        className="border p-2 w-full"
        value={salarioLiquido}
        onChange={(e) => setSalarioLiquido(Number(e.target.value))}
        placeholder="Salário líquido"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={cartaoCredito}
        onChange={(e) => setCartaoCredito(Number(e.target.value))}
        placeholder="Cartão de crédito"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={contasFixas}
        onChange={(e) => setContasFixas(Number(e.target.value))}
        placeholder="Contas fixas"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={hashishGramas}
        onChange={(e) => setHashishGramas(Number(e.target.value))}
        placeholder="Hashish em gramas"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={flash}
        onChange={(e) => setFlash(Number(e.target.value))}
        placeholder="Flash"
        type="number"
      />
      <button className="bg-blue-500 text-white px-4 py-2" type="submit">
        Salvar
      </button>
    </form>
  )
}
