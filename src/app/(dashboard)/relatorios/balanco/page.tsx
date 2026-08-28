'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { BalancoReport } from '@/components/reports/BalancoReport';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import { Printer } from 'lucide-react';

export default function BalancoPage() {
  const { balances, company, accountant, formatPeriodText } = useAccounting();

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Relatório: Balanço Patrimonial</h1>
          <p className="text-xs text-gray-500">Visualização oficial do Balanço de encerramento do exercício.</p>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir / Salvar PDF
        </button>
      </div>

      <ReportPeriodSelector />

      <BalancoReport
        balances={balances}
        company={company}
        accountant={accountant}
        periodText={formatPeriodText()}
      />
    </div>
  );
}