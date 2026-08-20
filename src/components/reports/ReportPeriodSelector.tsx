'use client';

import React from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { Calendar, Building2 } from 'lucide-react';

export const ReportPeriodSelector: React.FC = () => {
  const { savedPeriods, period, loadPeriodById, company } = useAccounting();

  return (
    <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2 text-gray-700">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span className="font-semibold">{company.corporateName}</span>
          <span className="text-gray-400 font-mono">({company.cnpj})</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <label className="font-semibold text-gray-700">Selecionar Lançamento Salvo:</label>
          <select
            value={period.id || ''}
            onChange={(e) => {
              if (e.target.value) loadPeriodById(e.target.value);
            }}
            className="p-1.5 border rounded-lg bg-gray-50 focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
          >
            <option value="">-- Selecione o Período --</option>
            {savedPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.description} ({p.start_date.split('-').reverse().join('/')} a {p.end_date.split('-').reverse().join('/')})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};