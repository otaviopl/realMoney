'use client'
import { useState, useEffect } from 'react';
import { useToast } from '../../lib/useToast';
import { motion } from 'framer-motion';
import { X, Save, User, ArrowUp, ArrowDown } from 'lucide-react';
import { Contato } from '../../types/types';
import { supabase } from '../../lib/supabaseClient';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingContato?: Contato | null;
}

export default function ModalContato({ isOpen, onClose, onSuccess, editingContato }: Props) {
  const [formData, setFormData] = useState<Partial<Contato>>({});
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (editingContato) {
      setFormData(editingContato);
    } else {
      setFormData({
        nome: '',
        tipo: undefined
      });
    }
  }, [editingContato]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome?.trim()) {
      toast.error('Nome do contato é obrigatório.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado.');

      const url = editingContato ? `/api/contacts/${editingContato.id}` : '/api/contacts';
      const method = editingContato ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'sb-access-token': session.access_token },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Falha ao salvar contato.');
      }

      toast.success(`Contato ${editingContato ? 'atualizado' : 'criado'} com sucesso!`);
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
          <h2 className="text-xl font-semibold">{editingContato ? 'Editar' : 'Novo'} Contato</h2>
          <button onClick={onClose} className="p-2"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label>Nome</label>
            <input type="text" value={formData.nome} onChange={e => setFormData(p => ({ ...p, nome: e.target.value }))} className="w-full p-2 border rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'recebedor' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'recebedor' ? 'border-green-500' : ''}`}><ArrowUp /> Recebedor</button>
            <button type="button" onClick={() => setFormData(p => ({ ...p, tipo: 'pagador' }))} className={`p-3 rounded-lg border-2 ${formData.tipo === 'pagador' ? 'border-red-500' : ''}`}><ArrowDown /> Pagador</button>
          </div>
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-purple-600 text-white disabled:opacity-50"><Save /> {loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
