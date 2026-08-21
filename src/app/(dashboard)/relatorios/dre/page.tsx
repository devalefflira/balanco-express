'use client';

import React, { useEffect, useState } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { DREReport } from '@/components/reports/DREReport';
import { ReportPeriodSelector } from '@/components/reports/ReportPeriodSelector';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function DREReportPage() {
  const { balances, period, company, accountant } = useAccounting();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handlePrint = () => {
    window.print();
  };

  const periodText = `De ${period.startDate.split('-').reverse().join('/')} até ${period.endDate.split('-').reverse().join('/')}`;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto print:p-0 print:m-0 print:max-w-full">
      {/* Barra de Ações Superior */}
      <div className="flex items-center justify-between print:hidden">
        <Link
          href="/lancamentos-salvos"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Ver Lançamentos Salvos
        </Link>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow transition"
        >
          <Printer className="w-4 h-4" />
          Imprimir DRE (PDF)
        </button>
      </div>

      {/* Seletor de Períodos Salvos */}
      <div className="print:hidden">
        <ReportPeriodSelector />
      </div>

      {/* Relatório Contábil da DRE */}
      <div className="bg-white border rounded-xl shadow-sm print:border-none print:shadow-none">
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