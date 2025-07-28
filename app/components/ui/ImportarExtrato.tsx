'use client'
import { useState } from 'react'
import { parseBankCSV, ParsedTransaction } from '../../lib/parseBankCSV'
import { useToast } from '../../lib/useToast'
import { useTransactions } from '../../hooks/useTransactions'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function ImportarExtrato({ isOpen, onClose }: Props) {
  const [preview, setPreview] = useState<ParsedTransaction[]>([])
  const { importTransactions } = useTransactions()
  const toast = useToast()

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const data = await parseBankCSV(file)
      setPreview(data)
    } catch (err) {
      toast.error('Erro ao ler arquivo')
    }
  }

  const handleImport = () => {
    importTransactions(preview, {
      onSuccess: () => {
        toast.success('Importação concluída')
        setPreview([])
        onClose()
      },
      onError: () => toast.error('Erro ao importar')
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Importar extrato</h3>
        <input type="file" accept=".csv,.txt" onChange={handleFile} className="mb-4" />
        {preview.length > 0 && (
          <div className="border rounded mb-4 max-h-60 overflow-y-auto text-sm">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Data</th>
                  <th className="px-2 py-1 text-left">Valor</th>
                  <th className="px-2 py-1 text-left">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-2 py-1">{t.valor.toFixed(2)}</td>
                    <td className="px-2 py-1">{t.descricao}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">Cancelar</button>
          <button onClick={handleImport} className="px-4 py-2 bg-blue-600 text-white rounded" disabled={preview.length===0}>Importar</button>
        </div>
      </div>
    </div>
  )
}
