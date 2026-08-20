'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { useRouter } from 'next/navigation';
import { Archive, Edit3, Trash2, CheckCircle2, AlertTriangle, Sparkles, PenTool } from 'lucide-react';

export default function LancamentosSalvosPage() {
  const { savedPeriods, loadPeriodById, deleteSavedPeriod, isLoading } = useAccounting();
  const router = useRouter();

  const handleEdit = async (periodId: string) => {
    await loadPeriodById(periodId);
    router.push('/lancamentos');
  };

  const handleDelete = async (periodId: string) => {
    if (confirm('Tem certeza que deseja excluir este período e seus saldos salvos?')) {
      await deleteSavedPeriod(periodId);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Archive className="w-6 h-6 text-blue-600" />
          Lançamentos Salvos
        </h1>
        <p className="text-xs text-gray-500">
          Gerencie e edite os fechamentos contábeis manuais e importados
        </p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {savedPeriods.length === 0 ? (
          <div className="p-12 text-center text-gray-500 space-y-3">
            <Archive className="w-12 h-12 mx-auto text-gray-300" />
            <p className="text-sm font-semibold">Nenhum lançamento salvo até o momento.</p>
            <p className="text-xs text-gray-400">
              Crie um lançamento manual em <strong>Lançamentos / Saldos</strong> ou envie um arquivo em <strong>Importações</strong>.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-50 border-b font-bold text-gray-700">
              <tr>
                <th className="p-4">Empresa / Cliente</th>
                <th className="p-4">Descrição do Período</th>
                <th className="p-4 text-center">Origem</th>
                <th className="p-4 text-center">Intervalo</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {savedPeriods.map((item) => {
                const isBalanced = item.status === 'BALANCED';
                const isImported = item.source_type === 'IMPORTED';
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-4 font-semibold text-gray-800">
                      {item.company?.corporate_name || 'JC MACHADO DIAS'}
                      <span className="block font-mono text-[10px] text-gray-500 font-normal">
                        CNPJ: {item.company?.cnpj || '24.905.673/0001-59'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-blue-600">{item.description}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isImported
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {isImported ? <Sparkles className="w-3 h-3 text-purple-600" /> : <PenTool className="w-3 h-3 text-slate-500" />}
                        {isImported ? 'Importado' : 'Manual'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-gray-600">
                      {item.start_date.split('-').reverse().join('/')} até {item.end_date.split('-').reverse().join('/')}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          isBalanced
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isBalanced ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {isBalanced ? 'Fechado' : 'Aberto'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(item.id)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-semibold transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold transition"
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
        )}
      </div>
    </div>
  );
}