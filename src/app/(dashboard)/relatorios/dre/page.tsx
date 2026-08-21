'use client';

import React from 'react';
import Link from 'next/link';
import { useAccounting } from '@/domain/context/AccountingContext';
import { DREReport } from '@/components/reports/DREReport';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import { Printer, ArrowLeft } from 'lucide-react';

export default function DREPage() {
  const { company, accountant, period, balances, formatPeriodText } = useAccounting();

  const handlePrint = () => {
    window.print();
  };

  const periodText = `De ${formatPeriodText(period.startDate, period.endDate)}`;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <Link
          href="/lancamentos-salvos"
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Lançamentos Salvos
        </Link>
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir DRE (PDF)
        </button>
      </div>

      <div className="print:hidden">
        <ReportPeriodSelector />
      </div>

      <div className="bg-white rounded-2xl border shadow-sm print:border-none print:shadow-none">
        <DREReport
          company={company}
          accountant={accountant}
          periodText={periodText}
          balances={balances}
        />
      </div>
    </div>
  );
}