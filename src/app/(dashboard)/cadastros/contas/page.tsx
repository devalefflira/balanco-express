'use client';

import React, { useState } from 'react';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { ListTree, Plus, Search } from 'lucide-react';

export default function ContasPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [accounts] = useState(DEFAULT_CHART_OF_ACCOUNTS);

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.classification.includes(searchTerm) ||
      String(acc.codeReduced).includes(searchTerm)
  );

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <ListTree className="w-6 h-6 text-blue-600" />
            Plano de Contas Referencial
          </h1>
          <p className="text-xs text-gray-500">
            Estrutura hierárquica contábil utilizada nas demonstrações e lançamentos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition">
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      <div className="bg-white rounded-xl border shadow-sm p-4 space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por descrição, classificação ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="sticky top-0 bg-gray-100 border-b font-bold text-gray-700">
              <tr>
                <th className="p-3 w-16 text-center">Cód.</th>
                <th className="p-3 w-32 text-center">Classificação</th>
                <th className="p-3">Descrição</th>
                <th className="p-3 w-24 text-center">Tipo</th>
                <th className="p-3 w-20 text-center">Natureza</th>
                <th className="p-3 w-28 text-center">Grupo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredAccounts.map((item, idx) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                return (
                  <tr
                    key={idx}
                    className={isSynthetic ? 'bg-gray-50/70 font-bold' : 'hover:bg-blue-50/30'}
                  >
                    <td className="p-2.5 text-center text-gray-500">{item.codeReduced}</td>
                    <td className="p-2.5 text-center text-gray-700">{item.classification}</td>
                    <td
                      className="p-2.5 font-sans"
                      style={{
                        paddingLeft: `${(item.classification.split('-').length - 1) * 16 + 8}px`,
                      }}
                    >
                      {item.description}
                    </td>
                    <td className="p-2.5 text-center text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          isSynthetic
                            ? 'bg-purple-100 text-purple-700 font-semibold'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.accountType}
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-bold">
                      <span className={item.nature === 'D' ? 'text-blue-600' : 'text-amber-600'}>
                        {item.nature}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-gray-500 text-[10px]">
                      {item.statementGroup}
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