'use client'
import { useState } from 'react'

export default function Formulario() {
  const [mes, setMes] = useState('')
  const [salarioLiquido, setSalarioLiquido] = useState(0)
  const [cartaoCredito, setCartaoCredito] = useState(0)
  const [contasFixas, setContasFixas] = useState(0)
  const [hashishGramas, setHashishGramas] = useState(0)
  const [mercado, setMercado] = useState(0)
  const [gasolina, setGasolina] = useState(0)
  const [flashRecebido, setFlashRecebido] = useState(700)
  const [metaEconomia, setMetaEconomia] = useState(0)

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
        mercado,
        gasolina,
        flashRecebido,
        metaEconomia,
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
        value={mercado}
        onChange={(e) => setMercado(Number(e.target.value))}
        placeholder="Mercado"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={gasolina}
        onChange={(e) => setGasolina(Number(e.target.value))}
        placeholder="Gasolina"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={flashRecebido}
        onChange={(e) => setFlashRecebido(Number(e.target.value))}
        placeholder="Flash recebido"
        type="number"
      />
      <input
        className="border p-2 w-full"
        value={metaEconomia}
        onChange={(e) => setMetaEconomia(Number(e.target.value))}
        placeholder="Meta de economia"
        type="number"
      />
      <button className="bg-blue-500 text-white px-4 py-2" type="submit">
        Salvar
      </button>
    </form>
  )
}
