'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { DREReport } from '@/components/reports/DREReport';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DREPage() {
  const { company, accountant, balances, formatPeriodText } = useAccounting();

  return (
    <div className="p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center print:hidden">
        <Link
          href="/lancamentos-salvos"
          className="flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-blue-600 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Lançamentos Salvos
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir DRE (PDF)
        </button>
      </div>

      <ReportPeriodSelector />

      <DREReport
        company={company}
        accountant={accountant}
        periodText={formatPeriodText('balance')}
        balances={balances}
      />
    </div>
  );
}