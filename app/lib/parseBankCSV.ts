import Papa from 'papaparse'
import { Transacao } from '../types/types'

export interface ParsedTransaction extends Omit<Transacao, 'id' | 'user_id' | 'categoria_id' | 'contato_id' | 'created_at'> {}

const toISO = (date: string) => {
  const [d, m, y] = date.trim().split('/')
  if (!d || !m || !y) return ''
  return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
}

export const parseBankCSV = (file: File): Promise<ParsedTransaction[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: ({ data }) => {
        try {
          const parsed = (data as any[]).map((row) => {
            const raw = parseFloat(String(row['Valor']).replace(',', '.'))
            return {
              data: toISO(String(row['Data'])),
              valor: Math.abs(raw),
              tipo: raw >= 0 ? 'entrada' : 'saida',
              descricao: String(row['Descrição'] || row['Descricao'] || row['descricao'] || '')
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
