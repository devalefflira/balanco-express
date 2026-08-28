'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { Calendar, Building2 } from 'lucide-react';

export const ReportPeriodSelector: React.FC = () => {
  const { savedPeriods, period, loadPeriodById, company } = useAccounting();

  return (
    <div className="bg-white p-4 rounded-xl border shadow-xs mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-gray-900">{company?.corporateName || 'JC MACHADO DIAS'}</h3>
          <p className="text-[11px] text-gray-500 font-mono">CNPJ: {company?.cnpj || '24.905.673/0001-59'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Calendar className="w-4 h-4 text-gray-400" />
        <select
          value={period.id || ''}
          onChange={(e) => loadPeriodById(e.target.value)}
          className="px-3 py-1.5 border rounded-lg text-xs font-medium bg-gray-50/50 w-full sm:w-64 focus:ring-1 focus:ring-blue-500"
        >
          {savedPeriods.map((p: any) => (
            <option key={p.id} value={p.id}>
              {p.description}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};