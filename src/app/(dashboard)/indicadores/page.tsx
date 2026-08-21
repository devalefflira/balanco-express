'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { FinancialIndicatorsEngine } from '@/domain/services/FinancialIndicatorsEngine';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import {
  Activity,
  Printer,
  FileText,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Clock,
  ShieldAlert,
} from 'lucide-react';

export default function IndicadoresPage() {
  const { balances, period } = useAccounting();

  const hasData = balances.some(
    (b) => (b.finalBalance || 0) > 0 || (b.debitAmount || 0) > 0 || (b.creditAmount || 0) > 0
  );

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

  const ind = hasData ? FinancialIndicatorsEngine.calculate(balances, periodLabel) : null;

  const formatNum = (val?: number, isPct: boolean = false, isMultiplier: boolean = false) => {
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

  // Funções de avaliação para as Notas Explicativas
  const getLiquidityStatus = (val?: number) => {
    const v = val ?? 0;
    if (v >= 1.5) return { status: 'BOM', color: 'emerald', text: `Índice de ${v.toFixed(1)}x é excelente. A empresa possui mais de R$ 1,50 em ativos circulantes para cada R$ 1,00 de obrigação no curto prazo.` };
    if (v >= 1.0) return { status: 'ADEQUADO', color: 'amber', text: `Índice de ${v.toFixed(1)}x está no limite seguro. Consegue cumprir com o passivo circulante, mas com pouca folga de caixa.` };
    return { status: 'ATENÇÃO', color: 'rose', text: `Índice de ${v.toFixed(1)}x é desfavorável. O ativo circulante é insuficiente para saldar as dívidas imediatas de curto prazo sem recorrer a novas captações.` };
  };

  const getLeverageStatus = (val?: number) => {
    const v = val ?? 0;
    if (v <= 2.0) return { status: 'BOM', color: 'emerald', text: `Alavancagem de ${v.toFixed(1)}x é baixa. A empresa financia a maior parte de seus ativos com capital próprio.` };
    if (v <= 3.5) return { status: 'MODERADA', color: 'amber', text: `Alavancagem de ${v.toFixed(1)}x é moderada. Requer acompanhamento da geração operacional de caixa perante os credores.` };
    return { status: 'ATENÇÃO', color: 'rose', text: `Alavancagem de ${v.toFixed(1)}x é elevada. Mais de 70% dos ativos dependem de capital de terceiros, aumentando o risco de solvência.` };
  };

  const getNetDebtToEbitdaStatus = (val?: number) => {
    const v = val ?? 0;
    if (v <= 1.5) return { status: 'BOM', color: 'emerald', text: `Relação de ${v.toFixed(1)}x é muito saudável. O endividamento líquido seria quitado em menos de 1,5 anos de EBITDA.` };
    if (v <= 2.5) return { status: 'ADEQUADO', color: 'amber', text: `Relação de ${v.toFixed(1)}x está dentro do padrão corporativo seguro.` };
    return { status: 'ATENÇÃO', color: 'rose', text: `Relação de ${v.toFixed(1)}x é arriscada. O endividamento compromete uma parcela muito alta da geração de caixa operacional anual.` };
  };

  const getCycleStatus = (days?: number) => {
    const d = days ?? 0;
    if (d <= 90) return { status: 'BOM', color: 'emerald', text: `Ciclo de ${d} dias é ágil. A empresa recebe e gira seus estoques antes de esgotar o prazo concedido pelos fornecedores.` };
    if (d <= 180) return { status: 'MODERADO', color: 'amber', text: `Ciclo de ${d} dias exige capital de giro intermediário para suportar o descasamento de estoques e pagamentos.` };
    return { status: 'ATENÇÃO', color: 'rose', text: `Ciclo de ${d} dias é longo. A retenção prolongada em estoques (PME elevado) pressiona o caixa livre e exige alto capital de giro.` };
  };

  const getEbitdaMarginStatus = (pct?: number) => {
    const p = pct ?? 0;
    if (p >= 20) return { status: 'BOM', color: 'emerald', text: `Margem de ${p.toFixed(1)}% é alta. Forte eficiência operacional e excelente capacidade de geração de caixa bruto sobre a receita.` };
    if (p >= 10) return { status: 'ADEQUADO', color: 'amber', text: `Margem de ${p.toFixed(1)}% está na média do setor comercial/distribuição.` };
    return { status: 'ATENÇÃO', color: 'rose', text: `Margem de ${p.toFixed(1)}% é estreita, vulnerável a oscilações nos custos operacionais ou na receita de vendas.` };
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
        <div className="space-y-6">
          {/* 1. Grid com as Duas Tabelas Oficiais */}
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

          {/* 2. Seção de Notas Explicativas e Diagnóstico Contábil */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm space-y-6 print:border-none print:p-0">
            <div className="border-b pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  Notas Explicativas e Diagnóstico dos Indicadores
                </h3>
                <p className="text-[11px] text-gray-500">
                  Avaliação técnica da saúde financeira, capacidade de pagamento e eficiência operacional para o período{' '}
                  <span className="font-bold text-gray-700">{periodLabel}</span>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Margem EBITDA */}
              {(() => {
                const diag = getEbitdaMarginStatus(ind?.ebitdaMarginPct);
                return (
                  <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">1. Margem EBITDA</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          diag.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : diag.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{diag.text}</p>
                    <p className="text-[10px] text-gray-400 italic">
                      Mede a geração operacional pura sobre as vendas antes de impostos, juros e depreciação.
                    </p>
                  </div>
                );
              })()}

              {/* Card 2: Liquidez Corrente */}
              {(() => {
                const diag = getLiquidityStatus(ind?.currentLiquidity);
                return (
                  <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">2. Índice de Liquidez</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          diag.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : diag.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{diag.text}</p>
                    <p className="text-[10px] text-gray-400 italic">
                      Fórmula: Ativo Circulante / Passivo Circulante. Valores acima de 1,0x indicam solvência imediata.
                    </p>
                  </div>
                );
              })()}

              {/* Card 3: Dívida Líquida / EBITDA */}
              {(() => {
                const diag = getNetDebtToEbitdaStatus(ind?.netDebtToEbitda);
                return (
                  <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">3. Dívida Líquida / EBITDA</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          diag.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : diag.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{diag.text}</p>
                    <p className="text-[10px] text-gray-400 italic">
                      Demonstra quantos anos seriam necessários para pagar toda a dívida bancária líquida de caixa.
                    </p>
                  </div>
                );
              })()}

              {/* Card 4: Alavancagem Financeira */}
              {(() => {
                const diag = getLeverageStatus(ind?.leverage);
                return (
                  <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">4. Alavancagem (Ativo / PL)</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          diag.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : diag.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{diag.text}</p>
                    <p className="text-[10px] text-gray-400 italic">
                      Indica a proporção de ativos totais mantidos para cada real de patrimônio líquido investido.
                    </p>
                  </div>
                );
              })()}

              {/* Card 5: Ciclo Financeiro e PME */}
              {(() => {
                const diag = getCycleStatus(ind?.financialCycleDays);
                return (
                  <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-800">5. Ciclo Financeiro (PME + PMR - PMP)</span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          diag.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800'
                            : diag.color === 'amber'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600 leading-relaxed">{diag.text}</p>
                    <p className="text-[10px] text-gray-400 italic">
                      PME: {ind?.pmeDays} dias de estoque | PMR: {ind?.pmrDays} dias de recebimento | PMP: {ind?.pmpDays} dias de fornecedores.
                    </p>
                  </div>
                );
              })()}

              {/* Card 6: Cash Flow Livre */}
              <div className="p-4 border rounded-xl bg-slate-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-800">6. Cash Flow Livre</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                      (ind?.freeCashFlowMM ?? 0) >= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {(ind?.freeCashFlowMM ?? 0) >= 0 ? 'POSITIVO' : 'DEFICITÁRIO'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {(ind?.freeCashFlowMM ?? 0) >= 0
                    ? `Geração líquida de R$ ${ind?.freeCashFlowMM} MM após cobrir investimentos em Capex e variações do capital de giro.`
                    : `Consumo de R$ ${Math.abs(ind?.freeCashFlowMM ?? 0)} MM de caixa livre decorrente do alongamento de estoques ou capex.`}
                </p>
                <p className="text-[10px] text-gray-400 italic">
                  Representa o caixa excedente disponível para remunerar acionistas ou amortizar dívidas bancárias.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}