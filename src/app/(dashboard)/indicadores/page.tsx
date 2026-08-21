'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { FinancialIndicatorsEngine } from '@/domain/services/FinancialIndicatorsEngine';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import { Activity, Printer, FileText } from 'lucide-react';
import { clear } from 'console';

export default function IndicadoresPage() {
  const { balances, period } = useAccounting();

  // Verifica se há dados carregados para o período
  const hasData = balances.some(
    (b) => (b.finalBalance || 0) > 0 || (b.debitAmount || 0) > 0 || (b.creditAmount || 0) > 0
  );

  // Formata o rótulo da coluna com base no período selecionado
  const getPeriodLabel = () => {
    if (!period.description) return 'Exercício Atual';
    const desc = period.description.toLowerCase();
    if (desc.includes('2024')) return 'dez/24';
    if (desc.includes('2025')) return 'dez/25';
    if (desc.includes('1t2026') || desc.includes('1t/2026') || desc.includes('1º trimestre')) return '1T/26';
    if (desc.includes('2026')) return 'dez/26';
    return period.description.split('(')[0].trim();
  };

  const periodLabel = getPeriodLabel();

  // Calcula indicadores com base nas contas ativas selecionadas
  const ind = hasData
    ? FinancialIndicatorsEngine.calculate(balances, periodLabel)
    : null;

  const formatNum = (
    val?: number,
    isPct: boolean = false,
    isMultiplier: boolean = false
  ) => {
    if (val === undefined || val === null) return '-';
    if (isPct) return `${val.toFixed(1).replace('.', ',')}%`;
    if (isMultiplier) return `${val.toFixed(1).replace('.', ',')}x`;
    return val.toFixed(1).replace('.', ',');
  };

  const renderVal = (val?: number, isRedOnNeg: boolean = true) => {
    if (val === undefined || val === null) return <span className="text-gray-400">-</span>;
    const isNeg = val < 0;
    return (
      <span className={isNeg && isRedOnNeg ? 'text-rose-600 font-bold' : 'text-gray-900 font-bold'}>
        {formatNum(val)}
      </span>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1500px] mx-auto">
      {/* Barra de Ações Superior */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-600" />
            Indicadores Financeiros e Cash Flow
          </h1>
          <p className="text-xs text-gray-500">
            Demonstrativos de Desempenho, Estrutura de Capital, Prazos Médios e Fluxo de Caixa Indireto calculados do Balancete.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          disabled={!hasData}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir Indicadores (PDF)
        </button>
      </div>

      {/* Seletor de Período Salvo */}
      <div className="print:hidden">
        <ReportPeriodSelector />
      </div>

      {!hasData ? (
        <div className="bg-white p-12 rounded-2xl border shadow-sm text-center flex flex-col items-center justify-center gap-3">
          <FileText className="w-10 h-10 text-gray-300" />
          <h3 className="text-sm font-bold text-gray-700">Nenhum Exercício Carregado</h3>
          <p className="text-xs text-gray-400 max-w-md">
            Selecione um lançamento salvo no seletor acima ou importe um Balancete Analítico para visualizar os indicadores calculados.
          </p>
        </div>
      ) : (
        /* Grid com as Duas Tabelas Oficiais */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white p-8 rounded-2xl border shadow-sm print:border-none print:shadow-none print:p-0">
          
          {/* Tabela Esquerda: Indicadores e Estrutura */}
          <div className="space-y-4 font-mono text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black font-sans font-bold text-gray-900">
                  <th className="py-2 text-left">BRL MM</th>
                  <th className="py-2 text-right w-28 uppercase text-blue-700 font-extrabold">{periodLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                <tr>
                  <td className="py-1.5 font-sans font-medium">Receita Líquida</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.netRevenueMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">EBITDA</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.ebitdaMM)}</td>
                </tr>
                <tr className="font-bold italic bg-slate-50/50">
                  <td className="py-1.5 font-sans">Margem EBITDA (%)</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.ebitdaMarginPct, true)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">EBIT</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.ebitMM)}</td>
                </tr>
                <tr className="font-bold italic bg-slate-50/50">
                  <td className="py-1.5 font-sans">Margem EBIT (%)</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.ebitMarginPct, true)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Lucro Líquido</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.netIncomeMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Dividendos</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.dividendsMM)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1.5 font-sans">Cash Flow Livre</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.freeCashFlowMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Patrimônio Líquido</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.equityMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Dívida Financeira</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financialDebtMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 pl-3 font-sans text-gray-600">- Bancos</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.bankDebtMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 pl-3 font-sans text-gray-600">- Outras Dívidas Financeiras</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.otherDebtMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Caixa e aplicações financeiras</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.cashAndEquivalentsMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Ativo Total</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.totalAssetsMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Dívida Fin. Líquida/EBITDA</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.netDebtToEbitda)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 pl-3 font-sans text-gray-600">- DFL/EBITDA (sem Outras Dívidas)</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.netDebtToEbitdaNoOther)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">EBITDA/Juros</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.ebitdaToInterest)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Liquidez</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.currentLiquidity, false, true)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Alavancagem</td>
                  <td className="py-1.5 text-right font-mono">{formatNum(ind?.leverage, false, true)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">PME (dias)</td>
                  <td className="py-1.5 text-right font-mono font-bold text-gray-900">{ind?.pmeDays ?? '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">PMR (dias)</td>
                  <td className="py-1.5 text-right font-mono font-bold text-gray-900">{ind?.pmrDays ?? '-'}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">PMP (dias)</td>
                  <td className="py-1.5 text-right font-mono font-bold text-gray-900">{ind?.pmpDays ?? '-'}</td>
                </tr>
                <tr className="border-t-2 border-black font-bold bg-slate-50/70">
                  <td className="py-2 font-sans text-xs">Ciclo Financeiro (dias)</td>
                  <td className="py-2 text-right text-xs font-mono">{ind?.financialCycleDays ?? '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabela Direita: Fluxo de Caixa / Cash Flow Indireto */}
          <div className="space-y-4 font-mono text-xs">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black font-sans font-bold text-gray-900">
                  <th className="py-2 text-left">BRL MM</th>
                  <th className="py-2 text-right w-28 uppercase text-blue-700 font-extrabold">{periodLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-[11px]">
                <tr>
                  <td className="py-1.5 font-sans font-medium">EBIT</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.ebitMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+ Depreciação / Amortização / Provisão</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.depreciationMM)}</td>
                </tr>
                <tr className="font-bold bg-slate-50/50">
                  <td className="py-1.5 font-sans">EBITDA</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.ebitdaMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Variação do Capital de Giro</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.workingCapitalVarMM)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1.5 font-sans">Fluxo Operacional</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.operationalCashFlowMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">- Capex</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.capexMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">- Investimentos Financeiros</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financialInvestmentsMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+ Receitas Financeiras</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financialRevenuesMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Mútuo Financeiro</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financialMutualMM)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1.5 font-sans">Fluxo de Investimento</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.investmentCashFlowMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">- Imposto de Renda</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.incomeTaxMM)}</td>
                </tr>
                <tr className="border-t-2 border-b-2 border-black font-bold bg-slate-50/80">
                  <td className="py-1.5 font-sans">Cash Flow Livre</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.freeCashFlowMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">- Dividendos</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.dividendsMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Variação da Dívida de LP</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.longTermDebtVarMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Variação da Dívida de CP</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.shortTermDebtVarMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+ Despesas Financeiras</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financialExpensesMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Variação do PL</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.equityVarMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Variação Cambial</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.fxVarMM)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans text-gray-600">+/- Outros</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.otherFinancingMM)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1.5 font-sans">Fluxo de Financiamento</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.financingCashFlowMM)}</td>
                </tr>
                <tr className="border-t-2 border-black font-bold bg-slate-50/70">
                  <td className="py-1.5 font-sans text-xs">Variação de Caixa</td>
                  <td className="py-1.5 text-right text-xs">{renderVal(ind?.cashVariationMM, false)}</td>
                </tr>
                <tr>
                  <td className="py-1.5 font-sans font-medium">Caixa Inicial</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.initialCashMM, false)}</td>
                </tr>
                <tr className="font-bold">
                  <td className="py-1.5 font-sans">Caixa Final</td>
                  <td className="py-1.5 text-right">{renderVal(ind?.finalCashMM, false)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}