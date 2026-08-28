'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { ExpenseDistributor } from '@/domain/services/ExpenseDistributor';
import { AccountingAdvisor, AccountingSuggestion } from '@/domain/services/AccountingAdvisor';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
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
  PieChart,
  X,
  Share2,
  CheckSquare,
  Bot,
  Sparkles,
  HelpCircle,
  Lightbulb,
  Check,
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
    closeResultAccountsAction,
    distributeExpenseAccount,
    applyAutoBalance,
    undoLastChange,
    undoAllChanges,
    resetBalances,
    saveCurrentBalances,
  } = useAccounting();

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ATIVO' | 'PASSIVO' | 'RESULTADO' | 'ALL'>('ATIVO');

  const [selectedFocusAccount, setSelectedFocusAccount] = useState<AccountingBalance | null>(null);
  const [activeSuggestions, setActiveSuggestions] = useState<AccountingSuggestion[]>([]);
  const [assistantTab, setAssistantTab] = useState<'SUGGESTIONS' | 'GUIDE'>('SUGGESTIONS');

  const [isDistributeModalOpen, setIsDistributeModalOpen] = useState(false);
  const [selectedExpenseCode, setSelectedExpenseCode] = useState<number>(1624);
  const [distributePercent, setDistributePercent] = useState<number>(85);

  const outlierExpenses = ExpenseDistributor.detectOutlierExpenses(balances);

  useEffect(() => {
    if (balances.length > 0 && !selectedFocusAccount) {
      const defaultAccount = balances.find((b) => b.codeReduced === 1211) || balances[0];
      setSelectedFocusAccount(defaultAccount);
      const initialSugs = AccountingAdvisor.analyzeChange(defaultAccount, 'creditAmount', defaultAccount.creditAmount || 1000, balances);
      setActiveSuggestions(initialSugs);
    }
  }, [balances, selectedFocusAccount]);

  const focusStateRef = useRef<{
    codeReduced: number;
    field: string;
    initialValue: number;
    snapshot: AccountingBalance[];
  } | null>(null);

  const handleFocus = (codeReduced: number, field: string, currentValue: number) => {
    const target = balances.find((b) => b.codeReduced === codeReduced);
    if (target) {
      setSelectedFocusAccount(target);
      const sugs = AccountingAdvisor.analyzeChange(target, field, currentValue || 1000, balances);
      setActiveSuggestions(sugs);
    }

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

      const targetAcc = balances.find((b) => b.codeReduced === codeReduced);
      if (targetAcc) {
        const sugs = AccountingAdvisor.analyzeChange(targetAcc, field, finalValue, balances);
        setActiveSuggestions(sugs);
      }
    }
    focusStateRef.current = null;
  };

  const handleManualSync = async () => {
    try {
      const added = await syncChartOfAccounts();
      setSyncNotice(
        added > 0
          ? `${added} nova(s) conta(s) sincronizada(s) com sucesso!`
          : 'Todas as contas do Plano de Contas já estão sincronizadas.'
      );
      setTimeout(() => setSyncNotice(null), 3000);
    } catch (e: any) {
      alert(`Erro ao sincronizar: ${e.message}`);
    }
  };

  const handleCloseResult = () => {
    closeResultAccountsAction();
    setSyncNotice('Contas de Resultado (DRE) zeradas com sucesso contra o Patrimônio Líquido!');
    setTimeout(() => setSyncNotice(null), 4000);
  };

  const handleConfirmDistribution = () => {
    try {
      distributeExpenseAccount(selectedExpenseCode, distributePercent);
      setIsDistributeModalOpen(false);
      setSyncNotice('Despesa distribuída com sucesso entre as contas operacionais!');
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (e: any) {
      alert(`Erro na distribuição: ${e.message}`);
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

  // Computa em tempo real os saldos das sintéticas a partir de suas analíticas filhas
  const computedBalances = useMemo(() => {
    const map = new Map<number, AccountingBalance>();
    balances.forEach((b) => map.set(b.codeReduced, { ...b }));

    balances
      .filter((b) => b.accountType === 'SINTETICA')
      .sort((a, b) => b.classification.length - a.classification.length)
      .forEach((synthetic) => {
        const children = balances.filter(
          (b) =>
            b.accountType === 'ANALITICA' &&
            b.classification.startsWith(synthetic.classification) &&
            b.codeReduced !== synthetic.codeReduced
        );

        const debSum = children.reduce((acc, c) => acc + (c.debitAmount || 0), 0);
        const credSum = children.reduce((acc, c) => acc + (c.creditAmount || 0), 0);
        const initSum = children.reduce((acc, c) => acc + (c.initialBalance || 0), 0);
        const finalSum = children.reduce((acc, c) => acc + (c.finalBalance || 0), 0);

        const target = map.get(synthetic.codeReduced);
        if (target) {
          target.debitAmount = debSum;
          target.creditAmount = credSum;
          target.initialBalance = initSum;
          target.finalBalance = finalSum;
        }
      });

    return Array.from(map.values());
  }, [balances]);

  const filteredBalances = computedBalances.filter((item) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'ATIVO') return item.classification.startsWith('1');
    if (activeTab === 'PASSIVO') return item.classification.startsWith('2');
    if (activeTab === 'RESULTADO') {
      return (
        item.classification.startsWith('3') ||
        item.classification.startsWith('4') ||
        item.statementGroup === 'RECEITA' ||
        item.statementGroup === 'CUSTO' ||
        item.statementGroup === 'DESPESA'
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6 max-w-[1700px] mx-auto">
      {/* 1. Barra Superior de Controle do Período */}
      <div className="bg-white p-5 rounded-2xl border shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
            onClick={handleCloseResult}
            title="Zera as contas analíticas de receita/despesa e transfere o resultado para a conta 2-4-08-01"
            className="mt-4 px-3.5 py-2 border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            Zerar Resultado (DRE)
          </button>

          <button
            onClick={handleManualSync}
            disabled={isLoading}
            className="mt-4 px-3.5 py-2 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
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
            className={`mt-4 px-5 py-2 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition ${
              saveSuccess ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Lançamentos'}
          </button>
        </div>
      </div>

      {/* 2. PAINEL DO COPILOTO CONTÁBIL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-xl">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-wide">Assistente de Partidas Dobradas & Fechamento</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {selectedFocusAccount
                  ? `Conta em foco: [${selectedFocusAccount.codeReduced}] ${selectedFocusAccount.description} (${selectedFocusAccount.classification})`
                  : 'Selecione ou edite qualquer campo da tabela para ver a explicação e sugestões de contrapartidas contábeis.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAssistantTab('SUGGESTIONS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                assistantTab === 'SUGGESTIONS'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              Sugestões ({activeSuggestions.length})
            </button>
            <button
              onClick={() => setAssistantTab('GUIDE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                assistantTab === 'GUIDE'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Regras do Exercício
            </button>
          </div>
        </div>

        {assistantTab === 'SUGGESTIONS' ? (
          activeSuggestions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in">
              {activeSuggestions.map((sug) => (
                <div key={sug.id} className="bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/15 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-200">{sug.title}</span>
                    <span className="text-[10px] font-mono bg-blue-500/30 text-blue-100 font-bold px-2 py-0.5 rounded-full">
                      Contrapartida: {sug.targetClassification}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{sug.explanation}</p>
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-medium">{sug.targetDescription}</span>
                    {sug.suggestedField && sug.suggestedValue !== undefined && (
                      <button
                        onClick={() => {
                          updateBalance(sug.targetCode, sug.suggestedField!, sug.suggestedValue!);
                          setActiveSuggestions((prev) => prev.filter((s) => s.id !== sug.id));
                        }}
                        className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Lançar Ajuste (+ R$ {formatCurrency(sug.suggestedValue)})
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-white/5 rounded-xl border border-white/10 gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <p className="text-xs text-slate-200">
                  {balanceSheet.isBalanced
                    ? 'Balanço equilibrado com sucesso! Débitos e Créditos conferem com as normas do CFC/CPC.'
                    : `Diferença atual entre Ativo e Passivo: R$ ${formatCurrency(balanceSheet.discrepancy.abs().toNumber())}. Você pode ajustar os valores manualmente ou acionar o Auto-Balanceamento.`}
                </p>
              </div>
              {!balanceSheet.isBalanced && (
                <button
                  onClick={applyAutoBalance}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center gap-1.5 flex-shrink-0"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Equilibrar Agora
                </button>
              )}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-200 animate-in fade-in">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <p className="font-bold text-blue-300">1. Zeramento de Resultado</p>
              <p className="text-[11px] text-slate-300">
                Despesas e Receitas encerram o saldo em 0,00 e o lucro líquido é transportado para o PL (2-4-08-01).
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <p className="font-bold text-blue-300">2. Princípio das Partidas Dobradas</p>
              <p className="text-[11px] text-slate-300">
                Para cada Débito aplicado no Ativo ou Despesa, deve haver um Crédito equivalente no Passivo ou Receita.
              </p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
              <p className="font-bold text-blue-300">3. Transporte Patrimonial</p>
              <p className="text-[11px] text-slate-300">
                Ao finalizar o exercício, os saldos finais de Ativo e Passivo viram o saldo anterior do ano subsequente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alerta de Despesa Concentrada */}
      {outlierExpenses.length > 0 && (
        <div className="p-4 bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <PieChart className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Concentração de Despesa Detectada</p>
              <p className="text-[11px] text-purple-800">
                A conta <span className="font-bold">[{outlierExpenses[0].codeReduced}] {outlierExpenses[0].description}</span> possui um valor muito concentrado (R$ {formatCurrency(outlierExpenses[0].debitAmount || outlierExpenses[0].finalBalance)}).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedExpenseCode(outlierExpenses[0].codeReduced);
              setIsDistributeModalOpen(true);
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition flex-shrink-0"
          >
            <Share2 className="w-4 h-4" />
            Distribuir Despesas
          </button>
        </div>
      )}

      {syncNotice && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Status de Balanceamento */}
      {balanceSheet.isBalanced ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center justify-between shadow-xs">
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
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
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
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Wand2 className="w-4 h-4" />
            Balancear Automaticamente
          </button>
        </div>
      )}

      {/* Abas */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('ATIVO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ATIVO' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Wallet className="w-4 h-4" />
          1. Ativo
        </button>

        <button
          onClick={() => setActiveTab('PASSIVO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'PASSIVO' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Building className="w-4 h-4" />
          2. Passivo e PL
        </button>

        <button
          onClick={() => setActiveTab('RESULTADO')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RESULTADO' ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          3. Contas de Resultado (DRE)
        </button>

        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-gray-600 hover:bg-gray-100 border'
          }`}
        >
          <Layers className="w-4 h-4" />
          Todas as Contas ({computedBalances.length})
        </button>
      </div>

      {/* Tabela de Lançamentos com Edição Restrita a Analíticas */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div className="xl:col-span-3 bg-white rounded-2xl border shadow-xs overflow-hidden flex flex-col">
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
                  <th className="py-2.5 px-3 text-right w-36">Saldo Anterior</th>
                  <th className="py-2.5 px-3 text-right w-40">Débito (R$)</th>
                  <th className="py-2.5 px-3 text-right w-40">Crédito (R$)</th>
                  <th className="py-2.5 px-3 text-right w-40">Saldo Atual (R$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredBalances.map((item) => {
                  const isSynthetic = item.accountType === 'SINTETICA';
                  const isFocused = selectedFocusAccount?.codeReduced === item.codeReduced;
                  const levelIndent = (item.classification.split('-').length - 1) * 12;

                  return (
                    <tr
                      key={item.codeReduced}
                      className={`${
                        isFocused
                          ? 'bg-blue-50/80 ring-1 ring-inset ring-blue-500'
                          : isSynthetic
                          ? 'bg-gray-50/70 font-bold text-gray-900'
                          : 'hover:bg-blue-50/20 text-gray-800'
                      }`}
                    >
                      <td className="py-2 px-3 text-gray-500">{item.codeReduced}</td>
                      <td className="py-2 px-3 text-gray-600">{item.classification}</td>
                      <td className="py-2 px-3 font-sans font-medium" style={{ paddingLeft: `${levelIndent + 12}px` }}>
                        {item.description}
                      </td>

                      {/* Saldo Anterior */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-400 italic">
                            {formatCurrency(item.initialBalance)} {item.initialNature}
                          </span>
                        ) : (
                          <CurrencyInput
                            value={item.initialBalance}
                            onFocus={() => handleFocus(item.codeReduced, 'initialBalance', Number(item.initialBalance || 0))}
                            onChange={(val) => updateBalance(item.codeReduced, 'initialBalance', val)}
                            onBlur={(finalVal) => handleBlur(item.codeReduced, 'initialBalance', finalVal)}
                            className="w-full"
                          />
                        )}
                      </td>

                      {/* Débito */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-900 font-bold">{formatCurrency(item.debitAmount)}</span>
                        ) : (
                          <CurrencyInput
                            value={item.debitAmount}
                            onFocus={() => handleFocus(item.codeReduced, 'debitAmount', Number(item.debitAmount || 0))}
                            onChange={(val) => updateBalance(item.codeReduced, 'debitAmount', val)}
                            onBlur={(finalVal) => handleBlur(item.codeReduced, 'debitAmount', finalVal)}
                            className="w-full"
                          />
                        )}
                      </td>

                      {/* Crédito */}
                      <td className="py-1.5 px-3 text-right">
                        {isSynthetic ? (
                          <span className="text-gray-900 font-bold">{formatCurrency(item.creditAmount)}</span>
                        ) : (
                          <CurrencyInput
                            value={item.creditAmount}
                            onFocus={() => handleFocus(item.codeReduced, 'creditAmount', Number(item.creditAmount || 0))}
                            onChange={(val) => updateBalance(item.codeReduced, 'creditAmount', val)}
                            onBlur={(finalVal) => handleBlur(item.codeReduced, 'creditAmount', finalVal)}
                            className="w-full"
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

        {/* Histórico e Contrapartidas */}
        <div className="bg-white rounded-2xl border shadow-xs p-4 space-y-4 flex flex-col h-[680px]">
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
                  Altere um valor analítico na tabela, zere o resultado ou use o Assistente Contábil.
                </p>
              </div>
            ) : (
              history.map((entry) => (
                <div key={entry.id} className="p-3 border rounded-xl bg-slate-50/80 hover:bg-white text-xs space-y-2 transition border-slate-200">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-mono border-b pb-1">
                    <span>{entry.timestamp}</span>
                    <span className="font-bold text-gray-600">Conta: {entry.classification}</span>
                  </div>

                  {entry.distributionInfo ? (
                    <div className="space-y-1.5">
                      <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-900 text-[11px] font-semibold">
                        <p className="flex items-center gap-1 font-bold text-purple-950">
                          <Share2 className="w-3 h-3 text-purple-600" />
                          Rateio / Distribuição de Despesa
                        </p>
                        <p className="text-[10px] text-purple-800 mt-0.5">
                          Origem: {entry.distributionInfo.sourceAccount} (Total: R$ {formatCurrency(entry.distributionInfo.totalDistributed)})
                        </p>
                      </div>
                    </div>
                  ) : entry.counterpart ? (
                    <div className="space-y-1.5">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] font-semibold">
                        <p className="flex items-center gap-1 font-bold text-amber-950">
                          <Wand2 className="w-3 h-3 text-amber-600" />
                          Balanceamento Automático
                        </p>
                        <p className="text-[10px] text-amber-800 mt-0.5">{entry.counterpart.description}</p>
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

      {/* Modal de Distribuição de Despesas */}
      {isDistributeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b bg-purple-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-gray-900">Distribuir Despesa Exorbitante</h3>
              </div>
              <button onClick={() => setIsDistributeModalOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Conta de Despesa de Origem</label>
                <select
                  value={selectedExpenseCode}
                  onChange={(e) => setSelectedExpenseCode(parseInt(e.target.value, 10))}
                  className="w-full p-2.5 border rounded-xl bg-white font-medium focus:ring-1 focus:ring-purple-500"
                >
                  {balances
                    .filter((b) => b.statementGroup === 'DESPESA' && b.accountType === 'ANALITICA')
                    .map((acc) => (
                      <option key={acc.codeReduced} value={acc.codeReduced}>
                        [{acc.codeReduced}] {acc.description} — R$ {formatCurrency(acc.debitAmount || acc.finalBalance)}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-gray-700">Percentual a ser Distribuído</label>
                  <span className="font-mono font-bold text-purple-700 text-sm">{distributePercent}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="95"
                  step="5"
                  value={distributePercent}
                  onChange={(e) => setDistributePercent(parseInt(e.target.value, 10))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDistributeModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDistribution}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Confirmar Rateio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}