'use client';

import React, { useState, useRef } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { formatCurrency } from '@/lib/formatters';
import {
  Save,
  Wand2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Undo2,
  History,
  ArrowRight,
  Wallet,
  Building,
  TrendingUp,
  Layers,
  RefreshCw,
} from 'lucide-react';

export default function LancamentosPage() {
  const {
    balances,
    period,
    balanceSheet,
    history,
    isLoading,
    setPeriod,
    updateBalance,
    recordHistoryEntry,
    syncChartOfAccounts,
    applyAutoBalance,
    undoLastChange,
    undoAllChanges,
    resetBalances,
    saveCurrentBalances,
  } = useAccounting();

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'PASSIVO' | 'RESULTADO' | 'ALL'>('ATIVO');

  const focusStateRef = useRef<{
    codeReduced: number;
    field: string;
    initialValue: number;
    snapshot: AccountingBalance[];
  } | null>(null);

  const handleFocus = (codeReduced: number, field: string, currentValue: number) => {
    focusStateRef.current = {
      codeReduced,
      field,
      initialValue: currentValue || 0,
      snapshot: balances.map((b) => ({ ...b })),
    };
  };

  const handleBlur = (codeReduced: number, field: string, finalValue: number) => {
    if (!focusStateRef.current) return;
    const { codeReduced: fCode, field: fField, initialValue, snapshot } = focusStateRef.current;

    if (fCode === codeReduced && fField === field && initialValue !== finalValue) {
      recordHistoryEntry(codeReduced, field, initialValue, finalValue, snapshot);
    }
    focusStateRef.current = null;
  };

  const handleManualSync = async () => {
    try {
      const added = await syncChartOfAccounts();
      if (added > 0) {
        setSyncNotice(`${added} nova(s) conta(s) sincronizada(s) com sucesso!`);
      } else {
        setSyncNotice('Todas as contas do Plano de Contas já estão sincronizadas.');
      }
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e: any) {
      alert(`Erro ao sincronizar: ${e.message}`);
    }
  };

  const handleSave = async () => {
    try {
      await saveCurrentBalances();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message}`);
    }
  };

  const filteredBalances = balances.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ATIVO') return item.classification.startsWith('1');
    if (activeTab === 'PASSIVO') return item.classification.startsWith('2');
    if (activeTab === 'RESULTADO') {
      return item.classification.startsWith('3') || item.classification.startsWith('4');
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* 1. Barra Superior de Controle do Período */}
      <div className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900">Período de Apuração Contábil</h2>
            <p className="text-[11px] text-gray-500">
              {period.id ? 'Editando lançamento salvo' : 'Novo lançamento em elaboração'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Descrição</label>
            <input
              type="text"
              value={period.description}
              onChange={(e) => setPeriod({ ...period, description: e.target.value })}
              className="px-3 py-1.5 border rounded-lg text-xs font-semibold bg-gray-50/50 w-64"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Data Inicial</label>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
              className="px-3 py-1.5 border rounded-lg text-xs font-semibold bg-gray-50/50"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Data Final</label>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
              className="px-3 py-1.5 border rounded-lg text-xs font-semibold bg-gray-50/50"
            />
          </div>

          <button
            onClick={handleManualSync}
            disabled={isLoading}
            title="Sincroniza novas contas criadas no Plano de Contas sem alterar os valores existentes"
            className="mt-4 px-3.5 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sincronizar Plano
          </button>

          <button
            onClick={resetBalances}
            className="mt-4 px-3.5 py-2 border rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Novo
          </button>

          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`mt-4 px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow transition ${
              saveSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Lançamentos'}
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* 2. Barra de Status de Balanceamento */}
      {balanceSheet.isBalanced ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Balanço Fechado Perfeitamente</p>
              <p className="text-[11px] text-emerald-700">
                Ativo: R$ {formatCurrency(balanceSheet.totalAssets.toNumber())} | Passivo + PL: R${' '}
                {formatCurrency(balanceSheet.totalLiabilities.plus(balanceSheet.equity).toNumber())} | Diferença: R$ 0,00
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Balanço com Discrepância / Desbalanceado</p>
              <p className="text-[11px] text-amber-800">
                Ativo: R$ {formatCurrency(balanceSheet.totalAssets.toNumber())} | Passivo + PL: R${' '}
                {formatCurrency(balanceSheet.totalLiabilities.plus(balanceSheet.equity).toNumber())} |{' '}
                <span className="font-extrabold text-amber-950">
                  Diferença: R$ {formatCurrency(balanceSheet.discrepancy.abs().toNumber())}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={applyAutoBalance}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow transition"
          >
            <Wand2 className="w-4 h-4" />
            Balancear Automaticamente
          </button>
        </div>
      )}

      {/* 3. Abas de Navegação das Contas */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('ATIVO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ATIVO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Wallet className="w-4 h-4" />
          1. Ativo
        </button>

        <button
          onClick={() => setActiveTab('PASSIVO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PASSIVO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Building className="w-4 h-4" />
          2. Passivo e PL
        </button>

        <button
          onClick={() => setActiveTab('RESULTADO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RESULTADO'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          3. Contas de Resultado (DRE)
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Layers className="w-4 h-4" />
          Todas as Contas ({balances.length})
        </button>
      </div>

      {/* 4. Grid Principal: Tabela de Lançamentos + Painel Lateral de Histórico */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Tabela (3/4) */}
        <div className="xl:col-span-3 bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
            <div>
              <h3 className="text-xs font-black text-gray-900 uppercase tracking-wider">
                {activeTab === 'ATIVO' && 'Contas do Ativo (Grupo 1)'}
                {activeTab === 'PASSIVO' && 'Contas do Passivo e Patrimônio Líquido (Grupo 2)'}
                {activeTab === 'RESULTADO' && 'Contas de Resultado: Receitas, Custos e Despesas (Grupos 3 e 4)'}
                {activeTab === 'ALL' && 'Plano de Contas Geral (Grupos 1, 2, 3 e 4)'}
              </h3>
              <p className="text-[11px] text-gray-500">{filteredBalances.length} contas exibidas nesta aba</p>
            </div>
          </div>

          <div className="max-h-[620px] overflow-y-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-gray-50/90 text-gray-700 font-bold sticky top-0 border-b z-10 text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-16">Cód.</th>
                  <th className="py-2.5 px-3 w-28">Classificação</th>
                  <th className="py-2.5 px-3">Descrição da Conta</th>
                  <th className="py-2.5 px-3 text-right w-32">Saldo Anterior</th>
                  <th className="py-2.5 px-3 text-right w-36">Débito (R$)</th>
                  <th className="py-2.5 px-3 text-right w-36">Crédito (R$)</th>
                  <th className="py-2.5 px-3 text-right w-36">Saldo Atual (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredBalances.map((item) => {
                  const isSynthetic = item.accountType === 'SINTETICA';
                  const levelIndent = (item.classification.split('-').length - 1) * 12;

                  return (
                    <tr
                      key={item.codeReduced}
                      className={isSynthetic ? 'bg-gray-50/60 font-bold text-gray-900' : 'hover:bg-blue-50/20 text-gray-800'}
                    >
                      <td className="py-2 px-3 text-gray-500">{item.codeReduced}</td>
                      <td className="py-2 px-3 text-gray-600">{item.classification}</td>
                      <td className="py-2 px-3 font-sans font-medium" style={{ paddingLeft: `${levelIndent + 12}px` }}>
                        {item.description}
                      </td>

                      {/* Saldo Anterior */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-500">
                            {formatCurrency(item.initialBalance)} {item.initialNature}
                          </span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.initialBalance ?? ''}
                            onFocus={() => handleFocus(item.codeReduced, 'initialBalance', Number(item.initialBalance || 0))}
                            onChange={(e) =>
                              updateBalance(item.codeReduced, 'initialBalance', parseFloat(e.target.value) || 0)
                            }
                            onBlur={(e) => handleBlur(item.codeReduced, 'initialBalance', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-xs font-mono font-normal"
                            placeholder="0,00"
                          />
                        )}
                      </td>

                      {/* Débito */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-500">{formatCurrency(item.debitAmount)}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.debitAmount ?? ''}
                            onFocus={() => handleFocus(item.codeReduced, 'debitAmount', Number(item.debitAmount || 0))}
                            onChange={(e) =>
                              updateBalance(item.codeReduced, 'debitAmount', parseFloat(e.target.value) || 0)
                            }
                            onBlur={(e) => handleBlur(item.codeReduced, 'debitAmount', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-xs font-mono font-normal"
                            placeholder="0,00"
                          />
                        )}
                      </td>

                      {/* Crédito */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-500">{formatCurrency(item.creditAmount)}</span>
                        ) : (
                          <input
                            type="number"
                            step="0.01"
                            value={item.creditAmount ?? ''}
                            onFocus={() => handleFocus(item.codeReduced, 'creditAmount', Number(item.creditAmount || 0))}
                            onChange={(e) =>
                              updateBalance(item.codeReduced, 'creditAmount', parseFloat(e.target.value) || 0)
                            }
                            onBlur={(e) => handleBlur(item.codeReduced, 'creditAmount', parseFloat(e.target.value) || 0)}
                            className="w-full text-right px-2 py-1 border rounded-lg bg-white focus:ring-1 focus:ring-blue-500 text-xs font-mono font-normal"
                            placeholder="0,00"
                          />
                        )}
                      </td>

                      {/* Saldo Atual */}
                      <td className="py-2 px-3 text-right font-bold">
                        {formatCurrency(item.finalBalance)} {item.finalNature}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Painel Lateral de Histórico e Contrapartidas */}
        <div className="bg-white rounded-2xl border shadow-sm p-4 space-y-4 flex flex-col h-[680px]">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-extrabold text-gray-900 uppercase">Histórico e Contrapartidas</h3>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
              {history.length}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={undoLastChange}
              disabled={history.length === 0}
              className="py-1.5 px-2.5 border rounded-xl text-[11px] font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 flex items-center justify-center gap-1.5 transition"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Desfazer Última
            </button>
            <button
              onClick={undoAllChanges}
              disabled={history.length === 0}
              className="py-1.5 px-2.5 border border-rose-200 bg-rose-50/60 rounded-xl text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-40 flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Desfazer Todas
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 text-xs p-6 border border-dashed rounded-xl">
                <History className="w-8 h-8 opacity-30 mb-2" />
                <p className="font-semibold text-gray-500">Nenhuma alteração recente</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Altere um valor na tabela ou use o Balanceamento Automático para rastrear as contrapartidas.
                </p>
              </div>
            ) : (
              history.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border rounded-xl bg-slate-50/80 hover:bg-white text-xs space-y-2 transition border-slate-200"
                >
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono border-b pb-1">
                    <span>{entry.timestamp}</span>
                    <span className="font-bold text-gray-600">Conta: {entry.classification}</span>
                  </div>

                  {entry.counterpart ? (
                    <div className="space-y-1.5">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-semibold">
                        <p className="flex items-center gap-1 font-bold text-amber-950">
                          <Wand2 className="w-3 h-3 text-amber-600" />
                          Balanceamento Automático
                        </p>
                        <p className="text-[10px] text-amber-800 mt-0.5">{entry.counterpart.description}</p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-gray-500">Contrapartida:</span>
                        <span className="font-mono font-bold text-emerald-700">
                          + R$ {formatCurrency(entry.counterpart.amount)} ({entry.counterpart.type})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800 text-[11px] truncate">{entry.accountName}</p>
                      <div className="flex items-center justify-between font-mono text-[11px] text-gray-600 pt-1">
                        <span className="text-gray-400 line-through">R$ {formatCurrency(entry.previousValue)}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-bold text-blue-700">R$ {formatCurrency(entry.newValue)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}