import Papa from 'papaparse'
import { Transacao } from '../types/types'

export interface ParsedTransaction extends Omit<Transacao, 'id' | 'user_id' | 'categoria_id' | 'contato_id' | 'created_at'> {}

const toISO = (date: string) => {
  const [d, m, y] = date.trim().split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

const identificarTipo = (descricao: string): 'entrada' | 'saida' => {
  const desc = descricao.toLowerCase()
  
  // Palavras-chave que indicam entrada
  const palavrasEntrada = ['recebida', 'recebido', 'deposito', 'credito', 'transferencia recebida', 'pix recebido']
  
  // Palavras-chave que indicam saída
  const palavrasSaida = ['enviada', 'enviado', 'debito', 'saque', 'transferencia enviada', 'pix enviado', 'pagamento']
  
  // Verificar entradas primeiro
  if (palavrasEntrada.some(palavra => desc.includes(palavra))) {
    return 'entrada'
  }
  
  // Verificar saídas
  if (palavrasSaida.some(palavra => desc.includes(palavra))) {
    return 'saida'
  }
  
  // Padrão: se não identificar, assumir como saída (mais conservador)
  return 'saida'
}

export const parseBankCSV = (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const parsed = (data as any[]).map((row) => {
            const valorStr = String(row['Valor'] || row['valor'] || '0').replace(',', '.')
            const valor = Math.abs(parseFloat(valorStr))
            const descricao = String(row['Descrição'] || row['Descricao'] || row['descricao'] || row['Historico'] || row['historico'] || '')
            
            return {
              data: toISO(String(row['Data'] || row['data'])),
              valor: valor,
              tipo: identificarTipo(descricao),
              descricao: descricao
            } as ParsedTransaction
          })
          resolve(parsed)
        } catch (e) {
          reject(e)
        }
      },
      error: (err) => reject(err)
    })
  })
}
