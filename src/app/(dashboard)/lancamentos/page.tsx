'use client';

import React, { useState } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { formatCurrency } from '@/lib/formatters';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { CheckCircle2, AlertTriangle, Wand2, Calendar, RotateCcw, Save, Check } from 'lucide-react';

export default function LancamentosPage() {
  const {
    balances,
    period,
    setPeriod,
    balanceSheet,
    updateBalance,
    applyAutoBalance,
    resetBalances,
    saveCurrentBalances,
    isLoading,
  } = useAccounting();

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async () => {
    try {
      await saveCurrentBalances();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      alert(`Falha ao salvar: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Bloco de Configuração de Período e Ação de Salvar */}
      <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800">Período de Apuração Contábil</h2>
            <p className="text-xs text-gray-500">
              {period.id ? 'Editando lançamento salvo' : 'Novo lançamento em digitação'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold">
          <div>
            <label className="block text-gray-600 text-[11px] mb-1">Descrição</label>
            <input
              type="text"
              value={period.description}
              onChange={(e) => setPeriod({ ...period, description: e.target.value })}
              placeholder="Ex: Exercício 2025"
              className="p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 w-44 font-normal"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-[11px] mb-1">Data Inicial</label>
            <input
              type="date"
              value={period.startDate}
              onChange={(e) => setPeriod({ ...period, startDate: e.target.value })}
              className="p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 font-mono font-normal"
            />
          </div>
          <div>
            <label className="block text-gray-600 text-[11px] mb-1">Data Final</label>
            <input
              type="date"
              value={period.endDate}
              onChange={(e) => setPeriod({ ...period, endDate: e.target.value })}
              className="p-2 border rounded-lg focus:ring-1 focus:ring-blue-500 font-mono font-normal"
            />
          </div>
          <div className="flex items-center gap-2 pt-4">
            <button
              onClick={resetBalances}
              title="Limpar campos para um novo lançamento"
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Novo
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg shadow transition ${
                savedSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? 'Salvo!' : isLoading ? 'Salvando...' : 'Salvar Lançamentos'}
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Status do Fechamento Contábil */}
      <div
        className={`p-4 rounded-xl border shadow-sm flex items-center justify-between transition-all ${
          balanceSheet.isBalanced
            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
            : 'bg-amber-50 border-amber-300 text-amber-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {balanceSheet.isBalanced ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-amber-600 flex-shrink-0" />
          )}
          <div>
            <h3 className="font-bold text-sm">
              {balanceSheet.isBalanced
                ? 'Balanço Fechado Perfeitamente'
                : 'Balanço com Discrepância / Desbalanceado'}
            </h3>
            <p className="text-xs">
              Ativo: R$ {formatCurrency(balanceSheet.totalAssets.toNumber())} | 
              Passivo + PL: R$ {formatCurrency(balanceSheet.totalLiabilities.plus(balanceSheet.equity).toNumber())} | 
              Diferença: R$ {formatCurrency(balanceSheet.discrepancy.abs().toNumber())}
            </p>
          </div>
        </div>

        {!balanceSheet.isBalanced && (
          <button
            onClick={() => applyAutoBalance()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Wand2 className="w-4 h-4" />
            Balancear Automaticamente
          </button>
        )}
      </div>

      {/* Tabela de Digitação */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="font-bold text-gray-800 text-sm">Digitação e Ajuste de Valores por Conta</h2>
          <span className="text-xs text-gray-500">{balances.length} contas cadastradas</span>
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-gray-100 border-b z-10 font-bold text-gray-700">
              <tr>
                <th className="p-3 w-16 text-center">Cód.</th>
                <th className="p-3 w-28 text-center">Classificação</th>
                <th className="p-3">Descrição da Conta</th>
                <th className="p-3 w-32 text-right">Saldo Anterior (R$)</th>
                <th className="p-3 w-32 text-right">Débito (R$)</th>
                <th className="p-3 w-32 text-right">Crédito (R$)</th>
                <th className="p-3 w-36 text-right">Saldo Atual (R$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {balances.map((item) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                return (
                  <tr
                    key={item.codeReduced}
                    className={isSynthetic ? 'bg-gray-50/80 font-bold' : 'hover:bg-blue-50/40'}
                  >
                    <td className="p-2 text-center font-mono text-gray-500">{item.codeReduced}</td>
                    <td className="p-2 text-center font-mono text-gray-600">{item.classification}</td>
                    <td
                      className="p-2"
                      style={{
                        paddingLeft: `${(item.classification.split('-').length - 1) * 16 + 8}px`,
                      }}
                    >
                      {item.description}
                    </td>
                    <td className="p-2 text-right">
                      {!isSynthetic ? (
                        <CurrencyInput
                          value={item.initialBalance}
                          onChange={(val) => updateBalance(item.codeReduced, 'initialBalance', val)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-mono text-gray-500">
                          {formatCurrency(item.initialBalance)} {item.initialNature}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {!isSynthetic ? (
                        <CurrencyInput
                          value={item.debitAmount}
                          onChange={(val) => updateBalance(item.codeReduced, 'debitAmount', val)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-mono text-gray-500">{formatCurrency(item.debitAmount)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {!isSynthetic ? (
                        <CurrencyInput
                          value={item.creditAmount}
                          onChange={(val) => updateBalance(item.codeReduced, 'creditAmount', val)}
                          className="w-full"
                        />
                      ) : (
                        <span className="font-mono text-gray-500">{formatCurrency(item.creditAmount)}</span>
                      )}
                    </td>
                    <td className="p-2 text-right font-mono font-semibold">
                      {!isSynthetic ? (
                        <CurrencyInput
                          value={item.finalBalance}
                          onChange={(val) => updateBalance(item.codeReduced, 'finalBalance', val)}
                          className="w-full border-blue-200 bg-blue-50/30 font-bold"
                        />
                      ) : (
                        <span className="text-slate-800">
                          {formatCurrency(item.finalBalance)} {item.finalNature}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}