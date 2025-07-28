'use client'
import { useState } from 'react'
import { parseBankCSV, ParsedTransaction } from '../../lib/parseBankCSV'
import { useToast } from '../../lib/useToast'
import { supabase } from '../../lib/supabaseClient'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function ImportarExtrato({ isOpen, onClose, onSuccess }: Props) {
  const [preview, setPreview] = useState<ParsedTransaction[]>([])
  const [isImporting, setIsImporting] = useState(false)
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

  const handleImport = async () => {
    setIsImporting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Usuário logado - usar Supabase
        const transacoesParaImportar = preview.map(t => ({
          ...t,
          user_id: user.id,
          categoria_id: null,
          contato_id: null
        }))
        
        const { data, error } = await supabase
          .from('transacoes')
          .insert(transacoesParaImportar)
          .select()
        
        if (error) throw error
        
        toast.success(`${data.length} transação(ões) importada(s) com sucesso!`)
      } else {
        // Usuário não logado - usar localStorage
        const existingTransactions = JSON.parse(localStorage.getItem('transacoes') || '[]')
        const newTransactions = preview.map((t, index) => ({
          ...t,
          id: Date.now() + index,
          user_id: 'local-user',
          categoria_id: null,
          contato_id: null,
          created_at: new Date().toISOString()
        }))
        
        const allTransactions = [...existingTransactions, ...newTransactions]
        localStorage.setItem('transacoes', JSON.stringify(allTransactions))
        
        toast.success(`${newTransactions.length} transação(ões) importada(s) localmente!`)
      }
      
      setPreview([])
      onClose()
      onSuccess?.() // Chamar callback de sucesso se fornecido
    } catch (error) {
      console.error('Erro na importação:', error)
      toast.error('Erro ao importar transações. Tente novamente.')
    } finally {
      setIsImporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-4xl">
        <h3 className="text-lg font-semibold mb-4">Importar Extrato Bancário</h3>
        
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm">
          <p className="text-yellow-700">
            <strong>Formato esperado:</strong> CSV com colunas "Data", "Valor" e "Descrição" (ou "Histórico").
            O sistema identifica automaticamente entradas e saídas pela descrição.
          </p>
        </div>
        
        <input 
          type="file" 
          accept=".csv,.txt" 
          onChange={handleFile} 
          className="w-full p-2 border border-gray-300 rounded mb-4 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
        />
        {preview.length > 0 && (
          <div className="border rounded mb-4 max-h-60 overflow-y-auto text-sm">
            <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400">
              <p className="text-blue-700 text-xs">
                <strong>{preview.length} transação(ões) encontrada(s)</strong> - 
                Entradas: {preview.filter(t => t.tipo === 'entrada').length} | 
                Saídas: {preview.filter(t => t.tipo === 'saida').length}
              </p>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1 text-left">Data</th>
                  <th className="px-2 py-1 text-left">Tipo</th>
                  <th className="px-2 py-1 text-left">Valor</th>
                  <th className="px-2 py-1 text-left">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((t, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-2 py-1">{new Date(t.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-2 py-1">
                      <span className={`px-2 py-1 rounded text-xs ${
                        t.tipo === 'entrada' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {t.tipo === 'entrada' ? '↗ Entrada' : '↘ Saída'}
                      </span>
                    </td>
                    <td className="px-2 py-1 font-mono">R$ {t.valor.toFixed(2)}</td>
                    <td className="px-2 py-1 max-w-xs truncate" title={t.descricao}>
                      {t.descricao}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {preview.length > 0 && (
              <span>✓ Arquivo processado - {preview.length} transação(ões) pronta(s) para importação</span>
            )}
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={onClose} 
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleImport} 
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed" 
              disabled={preview.length === 0 || isImporting}
            >
              {isImporting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Importando...
                </span>
              ) : preview.length > 0 ? (
                `Importar ${preview.length} Transação(ões)`
              ) : (
                'Importar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
