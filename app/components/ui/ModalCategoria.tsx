'use client'
import { useState, useEffect } from 'react';
import { useToast } from '../../lib/useToast';
import { motion } from 'framer-motion';
import { X, Save, Tag, TrendingUp, TrendingDown } from 'lucide-react';
import { Categoria } from '../../types/types';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingCategoria?: Categoria | null;
}

export default function ModalCategoria({ isOpen, onClose, onSuccess, editingCategoria }: Props) {
  const [formData, setFormData] = useState<Partial<Categoria>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (editingCategoria) {
      setFormData(editingCategoria);
    } else {
      setFormData({
        nome: '',
        tipo: 'saida',
        cor: '#3B82F6'
      });
    }
  }, [editingCategoria]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) {
      toast.error('Nome da categoria é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const url = editingCategoria ? `/api/categories/${editingCategoria.id}` : '/api/categories';
      const method = editingCategoria ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'sb-access-token': session.access_token },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar categoria.');
      }

      toast.success(`Categoria ${editingCategoria ? 'atualizada' : 'criada'} com sucesso!`);
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
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">{editingCategoria ? 'Editar' : 'Nova'} Categoria</h2>
          <button onClick={onClose} className="p-2"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label>Nome</label>
            <input type="text" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} className="w-full p-2 border rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'entrada' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'entrada' ? 'border-green-500' : ''}`}><TrendingUp /> Entrada</button>
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'saida' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'saida' ? 'border-red-500' : ''}`}><TrendingDown /> Saída</button>
          </div>
          <div>
            <label>Cor</label>
            <input type="color" value={formData.cor} onChange={e => setFormData(p => ({ ...p, cor: e.target.value }))} className="w-full h-10 p-1 border rounded-lg" />
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"><Save /> {loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
