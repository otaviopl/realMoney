'use client'
import { useEffect, useState } from 'react';
import { useToast } from '../../lib/useToast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, Plus, Edit3, Trash2, User, Tag, Activity, BarChart3, 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUpIcon, TrendingDownIcon, 
  Users, RefreshCw, Calculator, SlidersHorizontal, Upload
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { 
  Transacao, Categoria, Contato, GastoMensal, ResumoMensal
} from '../../types/types';

import ModalTransacao from '../ui/ModalTransacao';
import ModalCategoria from '../ui/ModalCategoria';
import ModalContato from '../ui/ModalContato';
import GerenciadorGastos from './GerenciadorGastos';
import ImportarExtrato from '../ui/ImportarExtrato';

interface StatsCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: any;
  color: string;
  bgColor: string;
}

export default function DashboardModerno() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [mesSelecionado, setMesSelecionado] = useState<string>('todos');
  const [salario, setSalario] = useState<number>(0);
  
  const [showModalTransacao, setShowModalTransacao] = useState(false);
  const [showModalCategoria, setShowModalCategoria] = useState(false);
  const [showModalContato, setShowModalContato] = useState(false);
  const [showGerenciadorGastos, setShowGerenciadorGastos] = useState(false);
  const [showImportarExtrato, setShowImportarExtrato] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'categories' | 'contacts'>('overview');

  const toast = useToast();

  useEffect(() => {
    carregarTodosOsDados();
  }, []);

  const carregarTodosOsDados = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/dashboard?salario=${salario}`, {
        headers: { 'sb-access-token': session.access_token },
      });

      if (!response.ok) throw new Error('Falha ao buscar dados do dashboard');

      const data = await response.json();
      setDashboardData(data);

      // Manter a seleção atual ("todos" por padrão)

    } catch (error: any) {
      toast.error(error.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const obterEstatisticas = (): StatsCard[] => {
    if (!dashboardData) return [];
    
    let resumoParaExibir;
    if (mesSelecionado === 'todos') {
      // Mostrar resumo geral de todas as transações
      resumoParaExibir = dashboardData.resumoGeral;
    } else {
      // Mostrar resumo do mês específico
      resumoParaExibir = dashboardData.resumosPorMes.find((r: ResumoMensal) => r.mes === mesSelecionado);
    }
    
    if (!resumoParaExibir) return [];

    const { totalEntradas, outrasEntradas, totalSaidas, saldoFinal, salario, salarioDetectado, transacoes } = resumoParaExibir;

    const stats: StatsCard[] = [
      { 
        title: mesSelecionado === 'todos' ? 'Total Salários' : 'Salário do Mês', 
        value: `R$ ${salario.toLocaleString('pt-BR')}`, 
        change: salarioDetectado > 0 
          ? `✓ Detectado automaticamente: R$ ${salarioDetectado.toLocaleString('pt-BR')}`
          : mesSelecionado === 'todos' ? '(estimativa geral)' : '(valor manual)', 
        trend: salarioDetectado > 0 ? 'up' as const : 'neutral' as const, 
        icon: TrendingUpIcon, 
        color: salarioDetectado > 0 ? 'text-green-600' : 'text-blue-600', 
        bgColor: salarioDetectado > 0 ? 'bg-green-50' : 'bg-blue-50' 
      },
      { 
        title: 'Outras Entradas', 
        value: `R$ ${(outrasEntradas || 0).toLocaleString('pt-BR')}`, 
        change: '(freelance, vendas, etc.)', 
        trend: 'neutral' as const, 
        icon: TrendingUpIcon, 
        color: 'text-green-600', 
        bgColor: 'bg-green-50' 
      },
      { 
        title: 'Total Saídas', 
        value: `R$ ${totalSaidas.toLocaleString('pt-BR')}`, 
        change: '', 
        trend: 'neutral' as const, 
        icon: TrendingDownIcon, 
        color: 'text-red-600', 
        bgColor: 'bg-red-50' 
      },
      { 
        title: 'Saldo Final', 
        value: `R$ ${saldoFinal.toLocaleString('pt-BR')}`, 
        change: 'sem dupla contagem', 
        trend: 'neutral' as const, 
        icon: Calculator, 
        color: saldoFinal > 0 ? 'text-green-600' : 'text-red-600', 
        bgColor: saldoFinal > 0 ? 'bg-green-50' : 'bg-red-50' 
      }
    ];

    // Adicionar estatística de transações na visão geral
    if (mesSelecionado === 'todos') {
      stats.push({
        title: 'Total Transações',
        value: `${transacoes || 0}`,
        change: 'registradas no sistema',
        trend: 'neutral' as const,
        icon: Calculator,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
      });
    }

    return stats;
  };

  const handleDelete = async (table: string, id: number) => {
    if (!confirm(`Tem certeza que deseja excluir este item?`)) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Usuário não autenticado');

      const response = await fetch(`/api/${table}/${id}`, {
        method: 'DELETE',
        headers: { 'sb-access-token': session.access_token },
      });

      if (!response.ok) throw new Error('Falha ao excluir item');

      toast.success('Item excluído com sucesso!');
      carregarTodosOsDados();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-gray-900 shadow-sm border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3"><div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center"><DollarSign className="h-5 w-5 text-white" /></div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">realMoney</h1></div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowImportarExtrato(true)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><Upload className="h-5 w-5 text-gray-500" /></button>
              <button onClick={carregarTodosOsDados} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"><RefreshCw className="h-5 w-5 text-gray-500" /></button>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center"><User className="h-4 w-4" /></div>
            </div>
          </div>
        </div>
      </motion.header>

      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex space-x-8">
          {[{ key: 'overview', label: 'Visão Geral', icon: BarChart3 }, { key: 'transactions', label: 'Transações', icon: Activity }, { key: 'categories', label: 'Categorias', icon: Tag }, { key: 'contacts', label: 'Contatos', icon: Users }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex items-center space-x-2 py-4 border-b-2 ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}><tab.icon className="h-4 w-4" /><span>{tab.label}</span></button>
          ))}
        </div></div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && dashboardData && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  {mesSelecionado === 'todos' ? 'Dashboard Geral - Todas as Transações' : `Dashboard de ${mesSelecionado}`}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">
                      {mesSelecionado === 'todos' ? 'Salário Médio' : 'Salário do Mês'}
                    </label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      value={salario || ''} 
                      onChange={e => setSalario(Number(e.target.value))} 
                      onBlur={carregarTodosOsDados}
                      onKeyPress={e => e.key === 'Enter' && carregarTodosOsDados()}
                      className="px-3 py-2 border rounded-lg w-32" 
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm text-gray-600 mb-1">Período</label>
                    <select 
                      value={mesSelecionado} 
                      onChange={e => setMesSelecionado(e.target.value)} 
                      className="px-4 py-2 border rounded-lg min-w-[160px]"
                    >
                      <option value="">Selecione o Período</option>
                      <option value="todos" className="font-semibold">📊 Todos os meses</option>
                      <option disabled>─────────────</option>
                      {dashboardData.resumosPorMes.map((r: ResumoMensal) => 
                        <option key={r.mes} value={r.mes}>{r.mes}</option>
                      )}
                    </select>
                  </div>
                  <button 
                    onClick={() => setShowGerenciadorGastos(true)} 
                    className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Gerenciar Gastos Mensais"
                  >
                    <SlidersHorizontal />
                  </button>
                </div>
              </div>
              <div className={`grid gap-6 ${mesSelecionado === 'todos' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                {obterEstatisticas().map(stat => 
                  <motion.div 
                    key={stat.title} 
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{stat.value}</h3>
                      <p className="text-sm text-gray-500">{stat.title}</p>
                      {stat.change && (
                        <p className="text-xs text-gray-400 mt-1">{stat.change}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'transactions' && dashboardData && (
            <motion.div key="transactions" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transações</h2>
                <button onClick={() => { setEditingItem(null); setShowModalTransacao(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Nova Transação</span>
                </button>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Data</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Descrição</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Categoria</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Valor</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                        <th className="text-left py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.transacoes.map((transacao: Transacao) => {
                        const categoria = dashboardData.categorias.find((c: Categoria) => c.id === transacao.categoria_id);
                        return (
                          <tr key={transacao.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-4 px-6 text-gray-900 dark:text-white">{new Date(transacao.data).toLocaleDateString('pt-BR')}</td>
                            <td className="py-4 px-6 text-gray-900 dark:text-white">{transacao.descricao || '-'}</td>
                            <td className="py-4 px-6">{categoria ? <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full text-sm">{categoria.nome}</span> : '-'}</td>
                            <td className={`py-4 px-6 font-medium ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{transacao.tipo === 'entrada' ? '+' : '-'}R$ {transacao.valor.toLocaleString('pt-BR')}</td>
                            <td className="py-4 px-6"><span className={`px-2 py-1 rounded-full text-sm ${transacao.tipo === 'entrada' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>{transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                            <td className="py-4 px-6">
                              <div className="flex items-center space-x-2">
                                <button onClick={() => { setEditingItem(transacao); setShowModalTransacao(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Edit3 className="h-4 w-4 text-gray-500" /></button>
                                <button onClick={() => handleDelete('transactions', transacao.id!)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Trash2 className="h-4 w-4 text-red-500" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'categories' && dashboardData && (
            <motion.div key="categories" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categorias</h2>
                <button onClick={() => { setEditingItem(null); setShowModalCategoria(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Nova Categoria</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.categorias.map((categoria: Categoria) => (
                  <motion.div key={categoria.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${categoria.tipo === 'entrada' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}><Tag className={`h-5 w-5 ${categoria.tipo === 'entrada' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} /></div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{categoria.nome}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{categoria.tipo === 'entrada' ? 'Entrada' : 'Saída'}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => { setEditingItem(categoria); setShowModalCategoria(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Edit3 className="h-4 w-4 text-gray-500" /></button>
                        <button onClick={() => handleDelete('categories', categoria.id!)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Trash2 className="h-4 w-4 text-red-500" /></button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {categoria.unidade && <p className="text-sm text-gray-600 dark:text-gray-400">Unidade: {categoria.unidade}</p>}
                      {categoria.preco_unitario && <p className="text-sm text-gray-600 dark:text-gray-400">Preço unitário: R$ {categoria.preco_unitario.toLocaleString('pt-BR')}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'contacts' && dashboardData && (
            <motion.div key="contacts" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contatos</h2>
                <button onClick={() => { setEditingItem(null); setShowModalContato(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
                  <Plus className="h-4 w-4" />
                  <span>Novo Contato</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.contatos.map((contato: Contato) => (
                  <motion.div key={contato.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"><User className="h-5 w-5 text-gray-600 dark:text-gray-400" /></div>
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{contato.nome}</h3>
                          {contato.tipo && <p className="text-sm text-gray-500 dark:text-gray-400">{contato.tipo === 'pagador' ? 'Pagador' : 'Recebedor'}</p>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button onClick={() => { setEditingItem(contato); setShowModalContato(true); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Edit3 className="h-4 w-4 text-gray-500" /></button>
                        <button onClick={() => handleDelete('contacts', contato.id!)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"><Trash2 className="h-4 w-4 text-red-500" /></button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Criado em: {new Date(contato.created_at || '').toLocaleDateString('pt-BR')}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ModalTransacao isOpen={showModalTransacao} onClose={() => setShowModalTransacao(false)} onSuccess={carregarTodosOsDados} editingTransaction={editingItem} />
      <ModalCategoria isOpen={showModalCategoria} onClose={() => setShowModalCategoria(false)} onSuccess={carregarTodosOsDados} editingCategoria={editingItem} />
      <ModalContato isOpen={showModalContato} onClose={() => setShowModalContato(false)} onSuccess={carregarTodosOsDados} editingContato={editingItem} />
      {showGerenciadorGastos && <GerenciadorGastos isOpen={showGerenciadorGastos} onClose={() => setShowGerenciadorGastos(false)} onSuccess={carregarTodosOsDados} mesSelecionado={mesSelecionado} />}
      {showImportarExtrato && <ImportarExtrato isOpen={showImportarExtrato} onClose={() => setShowImportarExtrato(false)} onSuccess={carregarTodosOsDados} />}
    </div>
  );
}
