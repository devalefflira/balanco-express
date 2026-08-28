'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounting } from '@/domain/context/AccountingContext';
import { SavedPeriodSummary } from '@/infrastructure/repositories/AccountingRepository';
import {
  FolderKanban,
  Edit,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Clock,
  Lock,
  Unlock,
  CheckCircle,
  PlusCircle,
  X,
} from 'lucide-react';

export default function LancamentosSalvosPage() {
  const router = useRouter();
  const {
    savedPeriods,
    loadSavedPeriod,
    deleteSavedPeriod,
    syncChartOfAccounts,
    createNewBlankPeriod,
    togglePeriodClose,
    isLoading,
  } = useAccounting();

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [forwardNotice, setForwardNotice] = useState<string | null>(null);

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    description: 'Exercício 01/01/2026 a 31/12/2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  const handleStartManualCreation = (e: React.FormEvent) => {
    e.preventDefault();
    createNewBlankPeriod({
      description: manualForm.description,
      startDate: manualForm.startDate,
      endDate: manualForm.endDate,
    });
    setIsManualModalOpen(false);
    router.push('/lancamentos');
  };

  const handleEdit = async (periodId: string) => {
    try {
      await loadSavedPeriod(periodId);
      router.push('/lancamentos');
    } catch (e: any) {
      alert(`Erro ao carregar o período: ${e.message}`);
    }
  };

  const handleDelete = async (periodId: string) => {
    if (!confirm('Deseja realmente excluir este fechamento contábil e todos os seus saldos?')) {
      return;
    }

    setDeletingId(periodId);
    try {
      await deleteSavedPeriod(periodId);
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSyncAll = async () => {
    try {
      const added = await syncChartOfAccounts();
      setSyncFeedback(
        added > 0
          ? `${added} conta(s) adicionada(s) e sincronizada(s) nos balanços com sucesso!`
          : 'Todos os balanços já estão com o Plano de Contas 100% atualizado.'
      );
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e: any) {
      alert(`Erro ao sincronizar: ${e.message}`);
    }
  };

  const handleToggleStatus = async (item: SavedPeriodSummary) => {
    setTogglingId(item.id);
    try {
      const result = await togglePeriodClose(item.id, item.status);
      if (result?.nextPeriodUpdated && (result.accountsForwarded || 0) > 0) {
        setForwardNotice(
          `Fechamento concluído! ${result.accountsForwarded} saldos patrimoniais foram transportados automaticamente como saldo inicial para o período: "${result.nextPeriodUpdated}".`
        );
        setTimeout(() => setForwardNotice(null), 6000);
      }
    } catch (e: any) {
      alert(`Erro ao alterar status: ${e.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const formatTimestampBR = (timestamp?: string) => {
    if (!timestamp) return '-';
    try {
      const d = new Date(timestamp);
      const datePart = d.toLocaleDateString('pt-BR');
      const timePart = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      return `${datePart} às ${timePart}`;
    } catch (e) {
      return timestamp;
    }
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'CLOSED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Finalizado
        </span>
      );
    }
    if (status === 'BALANCED') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
          <Edit className="w-3 h-3" />
          Em Edição
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
        <AlertCircle className="w-3 h-3" />
        Aberto
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-blue-600" />
            Lançamentos Importados e Manuais
          </h1>
          <p className="text-xs text-gray-500">
            Gerencie, crie e edite os fechamentos contábeis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            + Novo Balancete
          </button>

          <button
            onClick={handleSyncAll}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar Plano
          </button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{syncFeedback}</span>
        </div>
      )}

      {forwardNotice && (
        <div className="p-4 bg-sky-50 border border-sky-200 text-sky-900 rounded-xl text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0" />
          <span className="font-medium">{forwardNotice}</span>
        </div>
      )}

      {/* Tabela de Lançamentos */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden">
        {savedPeriods.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2">
            <FolderKanban className="w-10 h-10 opacity-30" />
            <p className="font-semibold text-gray-600">Nenhum lançamento importado ou salvo.</p>
            <p className="text-[11px] text-gray-400">
              Clique em "+ Novo Balancete" ou importe um arquivo pelo menu Importar Arquivos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50/80 text-gray-700 font-bold border-b text-[11px]">
                <tr>
                  <th className="py-3 px-4">Empresa / Cliente</th>
                  <th className="py-3 px-4">Descrição do Período</th>
                  <th className="py-3 px-4 text-center">Origem</th>
                  <th className="py-3 px-4 text-center">Intervalo</th>
                  <th className="py-3 px-4 text-center">Última Alteração</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {savedPeriods.map((item: SavedPeriodSummary) => {
                  const companyName = item.company?.corporate_name || 'JC MACHADO DIAS';
                  const companyCnpj = item.company?.cnpj || '24.905.673/0001-59';
                  const isClosed = item.status === 'CLOSED';

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{companyName}</div>
                        <div className="text-[10px] text-gray-400 font-mono">CNPJ: {companyCnpj}</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-blue-600">
                        {item.description}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            item.source_type === 'IMPORTED'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.source_type === 'IMPORTED' && <Sparkles className="w-3 h-3" />}
                          {item.source_type === 'IMPORTED' ? 'Importado' : 'Manual'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center text-gray-600 font-mono text-[11px]">
                        {formatDateBR(item.start_date)} até {formatDateBR(item.end_date)}
                      </td>

                      <td className="py-3 px-4 text-center font-mono text-[11px] text-gray-600">
                        <div className="inline-flex items-center gap-1.5 bg-gray-100/80 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span>{formatTimestampBR(item.updated_at || item.created_at)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {renderStatusBadge(item.status)}
                      </td>

                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition ${
                            isClosed
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {isClosed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          {isClosed ? 'Reabrir' : 'Finalizar'}
                        </button>

                        <button
                          onClick={() => handleEdit(item.id)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Editar
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Criar Balancete */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Novo Balancete Manual</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartManualCreation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição do Exercício</label>
                <input
                  type="text"
                  required
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder="Ex: Exercício 01/01/2026 a 31/12/2026"
                  className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Inicial</label>
                  <input
                    type="date"
                    required
                    value={manualForm.startDate}
                    onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Final</label>
                  <input
                    type="date"
                    required
                    value={manualForm.endDate}
                    onChange={(e) => setManualForm({ ...manualForm, endDate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-[11px] leading-relaxed">
                Um novo exercício será inicializado em branco com todas as contas zeradas para digitação.
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  Criar e Iniciar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}