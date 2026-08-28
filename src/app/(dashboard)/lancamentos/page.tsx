'use client';

import React, { useState, useMemo } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { formatCurrency } from '@/lib/formatters';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCcw,
} from 'lucide-react';

export default function LancamentosPage() {
  const {
    balances,
    period,
    balanceSheet,
    setPeriod,
    updateBalance,
    resetBalances,
    saveCurrentBalances,
  } = useAccounting();

  const [filterGroup, setFilterGroup] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Ordenação natural de contas
  const sortedBalances = useMemo(() => {
    return [...balances].sort((a, b) =>
      a.classification.localeCompare(b.classification, undefined, { numeric: true })
    );
  }, [balances]);

  // Filtro por grupo ou texto
  const filteredBalances = useMemo(() => {
    return sortedBalances.filter((item) => {
      const matchSearch =
        searchTerm === '' ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.classification.includes(searchTerm) ||
        String(item.codeReduced).includes(searchTerm);

      if (!matchSearch) return false;

      if (filterGroup === 'ALL') return true;
      if (filterGroup === 'ATIVO') return item.classification.startsWith('1');
      if (filterGroup === 'PASSIVO') return item.classification.startsWith('2');
      if (filterGroup === 'RESULTADO') return item.classification.startsWith('3') || item.classification.startsWith('4');

      return true;
    });
  }, [sortedBalances, filterGroup, searchTerm]);

  const handleSave = async () => {
    await saveCurrentBalances();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const isBalanced = balanceSheet.isBalanced;

  return (
    <div className="h-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden font-sans">
      {/* 1. Barra Superior Compacta: Identificação do Exercício e Ações */}
      <header className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs flex-shrink-0">
        <div className="flex items-center gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Período de Apuração</span>
            <input
              type="text"
              value={period.description}
              onChange={(e) => setPeriod({ ...period, description: e.target.value })}
              className="font-bold text-sm text-slate-900 border-b border-dashed border-slate-300 hover:border-slate-500 focus:outline-hidden bg-transparent"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-4 border-l border-slate-200">
            <span>De</span>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
              className="font-medium p-1 border border-slate-200 rounded-md text-xs bg-slate-50"
            />
            <span>até</span>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
              className="font-medium p-1 border border-slate-200 rounded-md text-xs bg-slate-50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-pulse">
              <CheckCircle2 className="w-4 h-4" /> Salvo com sucesso!
            </span>
          )}

          <button
            onClick={resetBalances}
            title="Zerar Lançamentos"
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Salvar Lançamentos
          </button>
        </div>
      </header>

      {/* 2. Barra de Status Contábil em Tempo Real */}
      <div className="bg-slate-900 text-white px-6 py-2 flex items-center justify-between text-xs flex-shrink-0 shadow-inner">
        <div className="flex items-center gap-8 font-mono">
          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Total do Ativo</span>
            <span className="font-bold text-blue-400">R$ {formatCurrency(balanceSheet.totalAssets.toNumber())} D</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Total Passivo + PL</span>
            <span className="font-bold text-blue-400">R$ {formatCurrency(balanceSheet.totalLiabilities.plus(balanceSheet.equity).toNumber())} C</span>
          </div>

          <div>
            <span className="text-slate-400 text-[10px] block uppercase">Lucro Líquido (DRE)</span>
            <span className={`font-bold ${balanceSheet.dreResult.netIncome.greaterThanOrEqualTo(0) ? 'text-emerald-400' : 'text-rose-400'}`}>
              R$ {formatCurrency(balanceSheet.dreResult.netIncome.toNumber())}
            </span>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full font-bold text-xs flex items-center gap-1.5 ${
          isBalanced ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800' : 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse'
        }`}>
          {isBalanced ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Balanço Equilibrado (Diferença: R$ 0,00)</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Diferença: R$ {formatCurrency(balanceSheet.discrepancy.toNumber())}</span>
            </>
          )}
        </div>
      </div>

      {/* 3. Filtros Rápidos e Campo de Busca */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
          <button
            onClick={() => setFilterGroup('ALL')}
            className={`px-3 py-1 rounded-md transition ${filterGroup === 'ALL' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Todas as Contas ({balances.length})
          </button>
          <button
            onClick={() => setFilterGroup('ATIVO')}
            className={`px-3 py-1 rounded-md transition ${filterGroup === 'ATIVO' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ativo (1)
          </button>
          <button
            onClick={() => setFilterGroup('PASSIVO')}
            className={`px-3 py-1 rounded-md transition ${filterGroup === 'PASSIVO' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Passivo & PL (2)
          </button>
          <button
            onClick={() => setFilterGroup('RESULTADO')}
            className={`px-3 py-1 rounded-md transition ${filterGroup === 'RESULTADO' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Resultado / DRE (3 e 4)
          </button>
        </div>

        <div className="relative w-72">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por conta, código ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* 4. Tabela de Lançamentos com Scroll Contido */}
      <div className="flex-1 overflow-auto bg-white px-6">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100 border-b border-slate-300 text-slate-600 font-bold uppercase text-[10px] z-10 shadow-xs">
            <tr>
              <th className="py-2 px-2 w-14 text-center">Cód.</th>
              <th className="py-2 px-2 w-28">Classificação</th>
              <th className="py-2 px-2">Descrição da Conta</th>
              <th className="py-2 px-2 w-32 text-right">Saldo Anterior</th>
              <th className="py-2 px-2 w-36 text-center">Débito (R$)</th>
              <th className="py-2 px-2 w-36 text-center">Crédito (R$)</th>
              <th className="py-2 px-2 w-32 text-right">Saldo Atual</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredBalances.map((item) => {
              const isSynthetic = item.accountType === 'SINTETICA';
              const level = item.classification.split('-').length - 1;

              let synthInitial = item.initialBalance || 0;
              let synthDebit = item.debitAmount || 0;
              let synthCredit = item.creditAmount || 0;
              let synthFinal = item.finalBalance || 0;

              if (isSynthetic) {
                const children = balances.filter(
                  (b) =>
                    b.accountType === 'ANALITICA' &&
                    b.classification.startsWith(item.classification) &&
                    b.codeReduced !== item.codeReduced
                );
                synthInitial = children.reduce((s, c) => s + (c.initialBalance || 0), 0);
                synthDebit = children.reduce((s, c) => s + (c.debitAmount || 0), 0);
                synthCredit = children.reduce((s, c) => s + (c.creditAmount || 0), 0);
                synthFinal = children.reduce((s, c) => s + (c.finalBalance || 0), 0);
              }

              return (
                <tr
                  key={item.codeReduced}
                  className={`transition ${
                    isSynthetic
                      ? 'bg-slate-50/80 font-bold text-slate-900 border-t border-slate-200'
                      : 'hover:bg-blue-50/40 text-slate-700'
                  }`}
                >
                  <td className="py-1 px-2 text-center text-slate-400 font-semibold">{item.codeReduced}</td>
                  <td className="py-1 px-2 text-slate-500">{item.classification}</td>
                  <td className="py-1 px-2 font-sans font-medium" style={{ paddingLeft: `${level * 14 + 8}px` }}>
                    {item.description}
                  </td>

                  {/* Saldo Anterior */}
                  <td className="py-1 px-2 text-right">
                    {isSynthetic ? (
                      <span className="text-slate-500">{formatCurrency(synthInitial)} {item.initialNature || 'D'}</span>
                    ) : (
                      <CurrencyInput
                        value={item.initialBalance || 0}
                        onChange={(val) => updateBalance(item.codeReduced, 'initialBalance', val)}
                        className="w-full text-right p-1 border border-transparent hover:border-slate-300 focus:border-blue-500 rounded bg-transparent focus:bg-white text-[11px]"
                      />
                    )}
                  </td>

                  {/* Débito */}
                  <td className="py-1 px-2 text-center">
                    {isSynthetic ? (
                      <span className="text-slate-600 font-bold">{formatCurrency(synthDebit)}</span>
                    ) : (
                      <CurrencyInput
                        value={item.debitAmount || 0}
                        onChange={(val) => updateBalance(item.codeReduced, 'debitAmount', val)}
                        className="w-full text-right p-1 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded bg-white text-[11px] font-semibold"
                      />
                    )}
                  </td>

                  {/* Crédito */}
                  <td className="py-1 px-2 text-center">
                    {isSynthetic ? (
                      <span className="text-slate-600 font-bold">{formatCurrency(synthCredit)}</span>
                    ) : (
                      <CurrencyInput
                        value={item.creditAmount || 0}
                        onChange={(val) => updateBalance(item.codeReduced, 'creditAmount', val)}
                        className="w-full text-right p-1 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded bg-white text-[11px] font-semibold"
                      />
                    )}
                  </td>

                  {/* Saldo Atual */}
                  <td className="py-1 px-2 text-right font-bold text-slate-900">
                    {formatCurrency(isSynthetic ? synthFinal : item.finalBalance || 0)} {item.finalNature || 'D'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}