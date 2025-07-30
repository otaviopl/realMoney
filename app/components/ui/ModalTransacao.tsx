'use client'
import { useState, useEffect } from 'react';
import { useToast } from '../../lib/useToast';
import { motion } from 'framer-motion';
import { X, Save, Tag, Plus, User, Calendar, DollarSign, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { Transacao, Categoria, Contato } from '../../types/types';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingTransaction?: Transacao | null;
}

export default function ModalTransacao({ isOpen, onClose, onSuccess, editingTransaction }: Props) {
  const [formData, setFormData] = useState<Partial<Transacao>>({});
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        ...editingTransaction,
        data: editingTransaction.data ? new Date(editingTransaction.data).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData({
        data: new Date().toISOString().split('T')[0],
        valor: 0,
        tipo: 'saida',
        descricao: ''
      });
    }
  }, [editingTransaction]);

  useEffect(() => {
    if (isOpen) {
      carregarDependentes();
    }
  }, [isOpen]);

  const carregarDependentes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const [catRes, conRes] = await Promise.all([
        fetch('/api/categories', { headers: { 'sb-access-token': session.access_token } }),
        fetch('/api/contacts', { headers: { 'sb-access-token': session.access_token } })
      ]);

      if (catRes.ok) setCategorias(await catRes.json());
      if (conRes.ok) setContatos(await conRes.json());
    } catch (error) {
      toast.error('Erro ao carregar dados de apoio.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.valor || formData.valor <= 0) {
      toast.error('O valor da transação deve ser maior que zero.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const url = editingTransaction ? `/api/transactions/${editingTransaction.id}` : '/api/transactions';
      const method = editingTransaction ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'sb-access-token': session.access_token },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar transação.');
      }

      toast.success(`Transação ${editingTransaction ? 'atualizada' : 'criada'} com sucesso!`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingTransaction ? 'Editar' : 'Nova'} Transação</h2>
          <button onClick={onClose} className="p-2"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'entrada' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'entrada' ? 'border-green-500' : ''}`}><TrendingUp className="mr-2" />Entrada</button>
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'saida' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'saida' ? 'border-red-500' : ''}`}><TrendingDown className="mr-2" />Saída</button>
          </div>
          <div>
            <label>Data</label>
            <input type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label>Valor</label>
            <input type="number" step="0.01" value={formData.valor} onChange={e => setFormData(p => ({ ...p, valor: parseFloat(e.target.value) || 0 }))} className="w-full p-2 border rounded-lg" required />
          </div>
          <div>
            <label>Categoria</label>
            <select value={formData.categoria_id || ''} onChange={e => setFormData(p => ({ ...p, categoria_id: Number(e.target.value) }))} className="w-full p-2 border rounded-lg">
              <option value="">Selecione</option>
              {categorias.filter(c => c.tipo === formData.tipo).map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Contato</label>
            <select value={formData.contato_id || ''} onChange={e => setFormData(p => ({ ...p, contato_id: Number(e.target.value) }))} className="w-full p-2 border rounded-lg">
              <option value="">Selecione</option>
              {contatos.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label>Descrição</label>
            <textarea value={formData.descricao} onChange={e => setFormData(p => ({ ...p, descricao: e.target.value }))} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"><Save className="mr-2" />{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 