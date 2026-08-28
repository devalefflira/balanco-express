'use client';

import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from '@/domain/services/AccountingEngine';
import { formatCurrency } from '@/lib/formatters';
import { ReportSignatures } from './ReportSignatures';
import { CompanyData, AccountantData } from '@/domain/context/AccountingContext';

export interface BalancoReportProps {
  balances: AccountingBalance[];
  company?: CompanyData;
  accountant?: AccountantData;
  periodText?: string;
  companyName?: string;
  cnpj?: string;
  nire?: string;
  nireDate?: string;
  address?: string;
  periodDescription?: string;
  startDate?: string;
  endDate?: string;
  representativeName?: string;
  representativeCpf?: string;
  accountantName?: string;
  accountantCrc?: string;
}

export const BalancoReport: React.FC<BalancoReportProps> = ({
  balances,
  company,
  accountant,
  periodText,
  companyName,
  cnpj,
  nire,
  nireDate,
  address,
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
  const compNire = company?.nire || nire || '21201532287';
  const compNireDate = company?.nireDate || nireDate || '2016-05-31';
  const compAddress = company?.address || address || 'AVENIDA JK, 1208, Lote 1 A 4, Quadra 4 Fundos';
  const periodDesc = periodText || periodDescription || `Exercício de ${startDate || '01/01/2024'} a ${endDate || '31/12/2024'}`;

  const repName = company?.representativeName || representativeName || 'JOSE CARLOS MACHADO DIAS';
  const repCpf = company?.representativeCpf || representativeCpf || '196.018.244-72';
  const repRole = company?.representativeRole || 'Administrador';
  const accName = accountant?.name || accountantName || 'JAMAILA FONSECA LOPES COSTA';
  const accCrc = accountant?.crc || accountantCrc || '0124650';

  const bsResult = AccountingEngine.calculateBalanceSheet(balances);

  const assetAccounts = balances
    .filter((b) => b.classification.startsWith('1') || b.statementGroup === 'ATIVO')
    .sort((a, b) => a.classification.localeCompare(b.classification, undefined, { numeric: true }));

  const liabilityAndEquityAccounts = balances
    .filter((b) => b.classification.startsWith('2') || b.statementGroup === 'PASSIVO' || b.statementGroup === 'PL')
    .sort((a, b) => a.classification.localeCompare(b.classification, undefined, { numeric: true }));

  const getDisplayValue = (item: AccountingBalance) => {
    if (item.accountType === 'ANALITICA') {
      return item.finalBalance || 0;
    }
    const children = balances.filter(
      (b) =>
        b.accountType === 'ANALITICA' &&
        b.classification.startsWith(item.classification) &&
        b.codeReduced !== item.codeReduced
    );
    return children.reduce((sum, c) => sum + (c.finalBalance || 0), 0);
  };

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto shadow-sm border rounded-xl text-xs font-sans text-gray-900 print:shadow-none print:border-none print:p-0 space-y-6">
      <div className="border-b pb-4 text-center">
        <p className="text-[10px] text-gray-400 font-mono">PRIME CONTABILIDADE</p>
        <h1 className="text-base font-bold uppercase tracking-wider">{compName}</h1>
        <p className="text-[11px] text-gray-600">{compAddress}</p>
        <p className="text-[11px] text-gray-600 font-mono">
          CNPJ: {compCnpj} | NIRE: {compNire} Data: {compNireDate}
        </p>
        <h2 className="text-sm font-semibold uppercase mt-3">Balanço Patrimonial</h2>
        <p className="text-xs text-gray-500 font-medium">{periodDesc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-3">
          <div className="border-b-2 border-gray-900 pb-1 flex justify-between items-center">
            <h3 className="font-extrabold uppercase text-xs">Ativo</h3>
            <span className="font-mono font-bold text-xs">Exercício Atual</span>
          </div>

          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {assetAccounts.map((item) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                const levelIndent = (item.classification.split('-').length - 1) * 10;
                const val = getDisplayValue(item);

                return (
                  <tr key={item.codeReduced} className={isSynthetic ? 'font-bold bg-gray-50/60 text-gray-900' : 'text-gray-700'}>
                    <td className="py-1 px-1 font-sans" style={{ paddingLeft: `${levelIndent + 4}px` }}>
                      {item.description}
                    </td>
                    <td className="py-1 px-1 text-gray-400 text-[10px] w-20">{item.classification}</td>
                    <td className="py-1 px-1 text-right w-28">
                      {formatCurrency(val)} {item.finalNature || 'D'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-center font-extrabold text-xs bg-slate-100 p-2.5 rounded-lg">
            <span>TOTAL DO ATIVO:</span>
            <span className="font-mono text-blue-900">R$ {formatCurrency(bsResult.totalAssets.toNumber())} D</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="border-b-2 border-gray-900 pb-1 flex justify-between items-center">
            <h3 className="font-extrabold uppercase text-xs">Passivo e Patrimônio Líquido</h3>
            <span className="font-mono font-bold text-xs">Exercício Atual</span>
          </div>

          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
              {liabilityAndEquityAccounts.map((item) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                const levelIndent = (item.classification.split('-').length - 1) * 10;
                const val = getDisplayValue(item);

                return (
                  <tr key={item.codeReduced} className={isSynthetic ? 'font-bold bg-gray-50/60 text-gray-900' : 'text-gray-700'}>
                    <td className="py-1 px-1 font-sans" style={{ paddingLeft: `${levelIndent + 4}px` }}>
                      {item.description}
                    </td>
                    <td className="py-1 px-1 text-gray-400 text-[10px] w-20">{item.classification}</td>
                    <td className="py-1 px-1 text-right w-28">
                      {formatCurrency(val)} {item.finalNature || 'C'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="border-t-2 border-gray-900 pt-2 flex justify-between items-center font-extrabold text-xs bg-slate-100 p-2.5 rounded-lg">
            <span>TOTAL DO PASSIVO + PL:</span>
            <span className="font-mono text-blue-900">
              R$ {formatCurrency(bsResult.totalLiabilities.plus(bsResult.equity).toNumber())} C
            </span>
          </div>
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