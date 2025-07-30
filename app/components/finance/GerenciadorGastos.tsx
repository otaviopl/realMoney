'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Edit3, Trash2, Save, DollarSign, Tag, Hash, Repeat, DollarSign as DollarSignIcon } from 'lucide-react';
import { useToast } from '../../lib/useToast';
import { supabase } from '../../lib/supabaseClient';
import type { GastoMensal, Categoria } from '../../types/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mesSelecionado: string;
}

export default function GerenciadorGastos({ isOpen, onClose, onSuccess, mesSelecionado }: Props) {
  const [gastos, setGastos] = useState<GastoMensal[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGasto, setEditingGasto] = useState<GastoMensal | null>(null);
  const [formData, setFormData] = useState<Partial<GastoMensal>>({
    mes: mesSelecionado,
    categoria_id: undefined,
    quantidade: 1,
    valor_unitario: 0,
    valor_total: 0,
    nome: ''
  });
  
  const [calculoAutomatico, setCalculoAutomatico] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      carregarDados();
    }
  }, [isOpen, mesSelecionado]);

  const carregarDados = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const [gastosRes, categoriasRes] = await Promise.all([
        fetch(`/api/monthly-expenses?mes=${mesSelecionado}`, { headers: { 'sb-access-token': session.access_token } }),
        fetch('/api/categories', { headers: { 'sb-access-token': session.access_token } })
      ]);

      if (!gastosRes.ok || !categoriasRes.ok) throw new Error('Falha ao carregar dados');

      const [gastosData, categoriasData] = await Promise.all([gastosRes.json(), categoriasRes.json()]);
      
      setGastos(gastosData);
      setCategorias(categoriasData);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || formData.quantidade! <= 0) {
      toast.error('Preencha o nome e a quantidade.');
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      // Calculate valor_total based on available data
      let valorTotal = 0;
      if (calculoAutomatico && formData.quantidade && formData.valor_unitario) {
        // Automatic calculation: quantity * unit price
        valorTotal = formData.quantidade * formData.valor_unitario;
      } else if (formData.valor_total && formData.valor_total > 0) {
        // Manual value expense
        valorTotal = formData.valor_total;
      } else {
        // Fallback to quantity as total value
        valorTotal = formData.quantidade || 0;
      }
      
      const gastoData = { ...formData, valor_total: valorTotal, mes: mesSelecionado };

      const url = editingGasto ? `/api/monthly-expenses/${editingGasto.id}` : '/api/monthly-expenses';
      const method = editingGasto ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'sb-access-token': session.access_token },
        body: JSON.stringify(gastoData)
      });

      if (!response.ok) throw new Error(editingGasto ? 'Erro ao atualizar gasto' : 'Erro ao criar gasto');

      toast.success(editingGasto ? 'Gasto atualizado!' : 'Gasto criado!');
      resetForm();
      carregarDados();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (gasto: GastoMensal) => {
    setEditingGasto(gasto);
    setFormData(gasto);
    // Determine if it's using automatic calculation
    const isAuto = gasto.valor_unitario && gasto.quantidade && 
                   Math.abs((gasto.valor_unitario * gasto.quantidade) - (gasto.valor_total || 0)) < 0.01;
    setCalculoAutomatico(isAuto);
    setShowForm(true);
  };

  // Handle category change to auto-fill unit price
  const handleCategoriaChange = (categoriaId: number | undefined) => {
    const categoria = categorias.find(c => c.id === categoriaId);
    setFormData({
      ...formData,
      categoria_id: categoriaId,
      valor_unitario: categoria?.preco_unitario || 0,
      nome: categoria?.nome || formData.nome
    });
  };

  // Calculate total automatically when quantity or unit price changes
  const handleQuantidadeChange = (quantidade: number) => {
    const novoFormData = { ...formData, quantidade };
    if (calculoAutomatico && formData.valor_unitario) {
      novoFormData.valor_total = quantidade * formData.valor_unitario;
    }
    setFormData(novoFormData);
  };

  const handleValorUnitarioChange = (valorUnitario: number) => {
    const novoFormData = { ...formData, valor_unitario: valorUnitario };
    if (calculoAutomatico && formData.quantidade) {
      novoFormData.valor_total = formData.quantidade * valorUnitario;
    }
    setFormData(novoFormData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/monthly-expenses/${id}`, {
        method: 'DELETE',
        headers: { 'sb-access-token': session.access_token }
      });

      if (!response.ok) throw new Error('Erro ao excluir gasto');

      toast.success('Gasto excluído!');
      carregarDados();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingGasto(null);
    setCalculoAutomatico(true);
    setFormData({
      mes: mesSelecionado,
      categoria_id: undefined,
      quantidade: 1,
      valor_unitario: 0,
      valor_total: 0,
      nome: ''
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Gastos Mensais de {mesSelecionado}</h2>
              <p className="text-sm text-gray-500">Gerencie seus gastos personalizados para este mês.</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><X className="h-5 w-5 text-gray-400" /></button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {!showForm ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Gastos Cadastrados</h3>
                  <button onClick={() => setShowForm(true)} className="inline-flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"><Plus className="h-4 w-4 mr-2" />Novo Gasto</button>
                </div>
                {loading ? <p className="text-center py-8 text-gray-500">Carregando...</p> : gastos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><DollarSign className="h-8 w-8 text-gray-400" /></div>
                    <p className="text-gray-500 mb-4">Nenhum gasto cadastrado para {mesSelecionado}.</p>
                    <button onClick={() => setShowForm(true)} className="text-gray-900 underline">Criar primeiro gasto</button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {gastos.map((gasto) => (
                      <motion.div key={gasto.id} layout className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><Tag className="h-4 w-4 text-gray-600" /></div>
                              <div>
                                <h4 className="font-medium text-gray-900">{gasto.nome}</h4>
                                <p className="text-sm text-gray-500">{categorias.find(c=>c.id === gasto.categoria_id)?.nome || 'Sem Categoria'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div><span className="text-gray-500">Quantidade:</span><p className="font-medium">{gasto.quantidade}</p></div>
                              <div><span className="text-gray-500">Valor Unitário:</span><p className="font-medium">R$ {(gasto.valor_unitario || 0).toLocaleString('pt-BR')}</p></div>
                              <div><span className="text-gray-500">Total:</span><p className="font-medium text-green-600">R$ {(gasto.valor_total || 0).toLocaleString('pt-BR')}</p></div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button onClick={() => handleEdit(gasto)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"><Edit3 className="h-4 w-4" /></button>
                            <button onClick={() => handleDelete(gasto.id!)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">{editingGasto ? 'Editar Gasto' : 'Novo Gasto'}</h3>
                  <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="h-5 w-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Tag className="h-4 w-4 inline mr-1" />Nome do Gasto</label>
                      <input type="text" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Tag className="h-4 w-4 inline mr-1" />Categoria (Opcional)</label>
                      <select value={formData.categoria_id || ''} onChange={(e) => handleCategoriaChange(e.target.value ? Number(e.target.value) : undefined)} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                        <option value="">Selecione uma categoria</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nome} {c.preco_unitario ? `(R$ ${c.preco_unitario})` : ''}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><Hash className="h-4 w-4 inline mr-1" />Quantidade</label>
                      <input type="number" step="0.01" min="0" value={formData.quantidade} onChange={(e) => handleQuantidadeChange(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2"><DollarSign className="h-4 w-4 inline mr-1" />Valor Unitário</label>
                      <input type="number" step="0.01" min="0" value={formData.valor_unitario} onChange={(e) => handleValorUnitarioChange(Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />Valor Total
                        <label className="ml-auto flex items-center text-xs">
                          <input type="checkbox" checked={calculoAutomatico} onChange={(e) => setCalculoAutomatico(e.target.checked)} className="mr-1" />
                          Cálculo automático
                        </label>
                      </label>
                      <input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        value={formData.valor_total} 
                        onChange={(e) => setFormData({...formData, valor_total: Number(e.target.value)})} 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" 
                        disabled={calculoAutomatico}
                        required 
                      />
                      {calculoAutomatico && (
                        <p className="text-xs text-gray-500 mt-1">
                          {formData.quantidade && formData.valor_unitario 
                            ? `${formData.quantidade} × R$ ${formData.valor_unitario} = R$ ${(formData.quantidade * formData.valor_unitario).toFixed(2)}`
                            : 'Informe quantidade e valor unitário para cálculo automático'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button type="button" onClick={resetForm} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancelar</button>
                    <button type="submit" disabled={loading} className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"><Save className="h-4 w-4 mr-2" />{loading ? 'Salvando...' : 'Salvar'}</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}