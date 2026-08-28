'use client';

import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from '@/domain/services/AccountingEngine';
import { formatCurrency } from '@/lib/formatters';
import { ReportSignatures } from './ReportSignatures';
import { CompanyData, AccountantData } from '@/domain/context/AccountingContext';

export interface DREReportProps {
  balances: AccountingBalance[];
  company?: CompanyData;
  accountant?: AccountantData;
  periodText?: string;
  companyName?: string;
  cnpj?: string;
  periodDescription?: string;
  startDate?: string;
  endDate?: string;
  representativeName?: string;
  representativeCpf?: string;
  accountantName?: string;
  accountantCrc?: string;
}

export const DREReport: React.FC<DREReportProps> = ({
  balances,
  company,
  accountant,
  periodText,
  companyName,
  cnpj,
  periodDescription,
  startDate,
  endDate,
  representativeName,
  representativeCpf,
  accountantName,
  accountantCrc,
}) => {
  const compName = company?.corporateName || companyName || 'JC MACHADO DIAS';
  const compCnpj = company?.cnpj || cnpj || '24.905.673/0001-59';
  const periodDesc = periodText || periodDescription || `De ${startDate || '01/01/2024'} a ${endDate || '31/12/2024'}`;

  const repName = company?.representativeName || representativeName || 'JOSE CARLOS MACHADO DIAS';
  const repCpf = company?.representativeCpf || representativeCpf || '196.018.244-72';
  const repRole = company?.representativeRole || 'Administrador';
  const accName = accountant?.name || accountantName || 'JAMAILA FONSECA LOPES COSTA';
  const accCrc = accountant?.crc || accountantCrc || '0124650';

  const dreResult = AccountingEngine.calculateDRE(balances);

  const dreAccounts = balances
    .filter(
      (b) =>
        b.statementGroup === 'RECEITA' ||
        b.statementGroup === 'CUSTO' ||
        b.statementGroup === 'DESPESA' ||
        b.classification.startsWith('3') ||
        b.classification.startsWith('4')
    )
    .sort((a, b) => a.classification.localeCompare(b.classification, undefined, { numeric: true }));

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto shadow-sm border rounded-xl text-xs font-sans text-gray-900 print:shadow-none print:border-none print:p-0">
      <div className="border-b pb-4 mb-4 text-center">
        <h1 className="text-base font-bold uppercase tracking-wider">{compName}</h1>
        <p className="text-[11px] text-gray-600">CNPJ: {compCnpj}</p>
        <h2 className="text-sm font-semibold uppercase mt-2">Demonstração do Resultado do Exercício</h2>
        <p className="text-xs text-gray-500">{periodDesc}</p>
      </div>

      <table className="w-full text-left border-collapse mb-6">
        <thead>
          <tr className="border-b border-gray-300 text-gray-600 uppercase text-[10px]">
            <th className="py-2 px-2">Descrição</th>
            <th className="py-2 px-2 w-28">Classificação</th>
            <th className="py-2 px-2 w-16 text-center">Conta</th>
            <th className="py-2 px-2 w-36 text-right">Exercício Atual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
          {dreAccounts.map((item) => {
            const isSynthetic = item.accountType === 'SINTETICA';
            const levelIndent = (item.classification.split('-').length - 1) * 12;

            let displayValue = item.finalBalance || 0;
            if (isSynthetic) {
              const children = balances.filter(
                (b) =>
                  b.accountType === 'ANALITICA' &&
                  b.classification.startsWith(item.classification) &&
                  b.codeReduced !== item.codeReduced
              );
              displayValue = children.reduce(
                (sum, c) => sum + (c.statementGroup === 'RECEITA' ? (c.creditAmount || c.finalBalance || 0) : (c.debitAmount || c.finalBalance || 0)),
                0
              );
            }

            return (
              <tr key={item.codeReduced} className={isSynthetic ? 'font-bold bg-gray-50/50 text-gray-900' : 'text-gray-700'}>
                <td className="py-1 px-2 font-sans" style={{ paddingLeft: `${levelIndent + 8}px` }}>
                  {item.description}
                </td>
                <td className="py-1 px-2 text-gray-500">{item.classification}</td>
                <td className="py-1 px-2 text-center text-gray-400">{item.codeReduced}</td>
                <td className="py-1 px-2 text-right">
                  {formatCurrency(displayValue)} {item.statementGroup === 'RECEITA' ? 'C' : 'D'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="border-t-2 border-gray-900 pt-3 space-y-1.5 font-bold text-xs bg-slate-50 p-4 rounded-lg">
        <div className="flex justify-between items-center text-gray-700">
          <span>RECEITAS BRUTAS:</span>
          <span className="font-mono">{formatCurrency(dreResult.grossRevenue.toNumber())} C</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>(-) DEDUÇÕES DA RECEITA:</span>
          <span className="font-mono">{formatCurrency(dreResult.deductions.toNumber())} D</span>
        </div>
        <div className="flex justify-between items-center text-gray-900 border-t border-gray-200 pt-1">
          <span>RECEITAS LÍQUIDAS:</span>
          <span className="font-mono text-blue-700">{formatCurrency(dreResult.netRevenue.toNumber())} C</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>(-) CUSTO DAS MERCADORIAS VENDIDAS (CMV):</span>
          <span className="font-mono">{formatCurrency(dreResult.costOfGoodsSold.toNumber())} D</span>
        </div>
        <div className="flex justify-between items-center text-gray-900 border-t border-gray-200 pt-1">
          <span>LUCRO BRUTO:</span>
          <span className="font-mono">{formatCurrency(dreResult.grossProfit.toNumber())} C</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>(-) DESPESAS OPERACIONAIS:</span>
          <span className="font-mono">{formatCurrency(dreResult.operatingExpenses.toNumber())} D</span>
        </div>
        <div className="flex justify-between items-center text-gray-700">
          <span>(-) DESPESAS FINANCEIRAS:</span>
          <span className="font-mono">{formatCurrency(dreResult.financialExpenses.toNumber())} D</span>
        </div>
        <div className="flex justify-between items-center text-sm font-extrabold text-emerald-800 border-t-2 border-gray-300 pt-2">
          <span>LUCRO LÍQUIDO DO EXERCÍCIO:</span>
          <span className="font-mono">R$ {formatCurrency(dreResult.netIncome.toNumber())}</span>
        </div>
      </div>

      <ReportSignatures
        representativeName={repName}
        representativeCpf={repCpf}
        representativeRole={repRole}
        accountantName={accName}
        accountantCrc={accCrc}
      />
    </div>
  );
};