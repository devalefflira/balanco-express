'use client';

import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from '@/domain/services/AccountingEngine';
import { formatCurrency } from '@/lib/formatters';
import { ReportSignatures } from './ReportSignatures';
import { CompanyData, AccountantData } from '@/domain/context/AccountingContext';

export interface BalanceteReportProps {
  balances: AccountingBalance[];
  company?: CompanyData;
  accountant?: AccountantData;
  periodText?: string;
  companyName?: string;
  cnpj?: string;
  nire?: string;
  nireDate?: string;
  periodDescription?: string;
  startDate?: string;
  endDate?: string;
  representativeName?: string;
  representativeCpf?: string;
  accountantName?: string;
  accountantCrc?: string;
}

export const BalanceteReport: React.FC<BalanceteReportProps> = ({
  balances,
  company,
  accountant,
  periodText,
  companyName,
  cnpj,
  nire,
  nireDate,
  periodDescription,
  startDate,
  endDate,
  representativeName,
  representativeCpf,
  accountantName,
  accountantCrc,
}) => {
  const compName = company?.corporateName || companyName || 'JC MACHADO DIAS (00463)';
  const compCnpj = company?.cnpj || cnpj || '24.905.673/0001-59';
  const compNire = company?.nire || nire || '21201532287';
  const compNireDate = company?.nireDate || nireDate || '2016-05-31';
  const periodDesc = periodText || periodDescription || `De ${startDate || '01/01/2024'} a ${endDate || '31/12/2024'}`;

  const repName = company?.representativeName || representativeName || 'JOSE CARLOS MACHADO DIAS';
  const repCpf = company?.representativeCpf || representativeCpf || '196.018.244-72';
  const repRole = company?.representativeRole || 'Administrador';
  const accName = accountant?.name || accountantName || 'JAMAILA FONSECA LOPES COSTA';
  const accCrc = accountant?.crc || accountantCrc || '0124650';

  const sortedBalances = [...balances].sort((a, b) =>
    a.classification.localeCompare(b.classification, undefined, { numeric: true })
  );

  const analytical = balances.filter((b) => b.accountType === 'ANALITICA');
  const totalDebits = analytical.reduce((sum, b) => sum + (Number(b.debitAmount) || 0), 0);
  const totalCredits = analytical.reduce((sum, b) => sum + (Number(b.creditAmount) || 0), 0);

  const dreResult = AccountingEngine.calculateDRE(balances);
  const bsResult = AccountingEngine.calculateBalanceSheet(balances);

  const despesasTotal = dreResult.operatingExpenses.toNumber();
  const custosTotal = dreResult.costOfGoodsSold.toNumber();
  const receitasTotal = dreResult.grossRevenue.toNumber();
  const deducoesTotal = dreResult.deductions.toNumber();
  const resultadoOperacional = dreResult.netIncome.toNumber();

  const ativoTotal = bsResult.totalAssets.toNumber();
  const passivoPLTotal = bsResult.totalLiabilities.plus(bsResult.equity).toNumber();

  const getSyntheticValue = (item: AccountingBalance, field: 'initialBalance' | 'debitAmount' | 'creditAmount' | 'finalBalance') => {
    if (item.accountType === 'ANALITICA') {
      return item[field] || 0;
    }
    const children = balances.filter(
      (b) =>
        b.accountType === 'ANALITICA' &&
        b.classification.startsWith(item.classification) &&
        b.codeReduced !== item.codeReduced
    );

    if (field === 'finalBalance') {
      return children.reduce((sum, c) => {
        if (item.classification.startsWith('1') && (c.classification.startsWith('1-2-04') || c.finalNature === 'C')) {
          return sum - (c.finalBalance || 0);
        }
        return sum + (c.finalBalance || 0);
      }, 0);
    }

    return children.reduce((sum, c) => sum + (Number(c[field]) || 0), 0);
  };

  return (
    <div className="bg-white p-8 max-w-5xl mx-auto shadow-sm border rounded-xl text-xs font-sans text-gray-900 print:shadow-none print:border-none print:p-0 space-y-6">
      <div className="border-b pb-4 text-center">
        <p className="text-[10px] text-gray-400 font-mono">PRIME CONTABILIDADE</p>
        <h1 className="text-base font-bold uppercase tracking-wider">{compName}</h1>
        <p className="text-[11px] text-gray-600 font-mono">
          CNPJ: {compCnpj} | NIRE: {compNire} Data: {compNireDate}
        </p>
        <h2 className="text-sm font-semibold uppercase mt-2">Balancete Analítico</h2>
        <p className="text-xs text-gray-500 font-medium">{periodDesc}</p>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-900 text-gray-700 uppercase text-[10px] font-bold">
            <th className="py-2 px-2">Descrição</th>
            <th className="py-2 px-2 text-right w-28">Saldo Anterior</th>
            <th className="py-2 px-2 text-right w-28">Débito</th>
            <th className="py-2 px-2 text-right w-28">Crédito</th>
            <th className="py-2 px-2 text-right w-28">Saldo Atual</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 font-mono text-[11px]">
          {sortedBalances.map((item) => {
            const isSynthetic = item.accountType === 'SINTETICA';
            const levelIndent = (item.classification.split('-').length - 1) * 10;

            const initBal = getSyntheticValue(item, 'initialBalance');
            const deb = getSyntheticValue(item, 'debitAmount');
            const cred = getSyntheticValue(item, 'creditAmount');
            const finalBal = getSyntheticValue(item, 'finalBalance');

            return (
              <tr key={item.codeReduced} className={isSynthetic ? 'font-bold bg-gray-50/70 text-gray-900' : 'text-gray-700'}>
                <td className="py-1 px-2 font-sans" style={{ paddingLeft: `${levelIndent + 4}px` }}>
                  <span className="text-gray-400 mr-1.5 font-mono">[{item.codeReduced}]</span>
                  {item.description}
                </td>
                <td className="py-1 px-2 text-right text-gray-500">
                  {formatCurrency(initBal)} {item.initialNature || 'D'}
                </td>
                <td className="py-1 px-2 text-right">{formatCurrency(deb)}</td>
                <td className="py-1 px-2 text-right">{formatCurrency(cred)}</td>
                <td className="py-1 px-2 text-right font-bold">
                  {formatCurrency(finalBal)} {item.finalNature || (item.classification.startsWith('1-2-04') ? 'C' : 'D')}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Quadro Consolidado de Fechamento Integrado ao Balanço */}
      <div className="border-2 border-gray-900 rounded-xl p-4 bg-slate-50 space-y-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900 text-center border-b pb-2">
          Análise do Balancete e Fechamento
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Ativo:</span>
            <span className="font-bold text-gray-900">{formatCurrency(ativoTotal)} D</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Passivo + PL:</span>
            <span className="font-bold text-gray-900">{formatCurrency(passivoPLTotal)} C</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Receitas:</span>
            <span className="font-bold text-blue-700">{formatCurrency(receitasTotal)} C</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Custos:</span>
            <span className="font-bold text-gray-900">{formatCurrency(custosTotal)} D</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Despesas Operacionais:</span>
            <span className="font-bold text-gray-900">{formatCurrency(despesasTotal)} D</span>
          </div>
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Deduções da Receita:</span>
            <span className="font-bold text-gray-900">{formatCurrency(deducoesTotal)} D</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block text-[10px] uppercase font-sans font-bold">Resultado das Operações:</span>
            <span className={`font-black text-sm ${resultadoOperacional >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              R$ {formatCurrency(resultadoOperacional)} {resultadoOperacional >= 0 ? '(LUCRO)' : '(PREJUÍZO)'}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-300 pt-2 flex flex-col sm:flex-row justify-between items-center text-xs font-bold text-gray-800">
          <span>TOTAL GERAL DE DÉBITOS: R$ {formatCurrency(totalDebits)} D</span>
          <span>TOTAL GERAL DE CRÉDITOS: R$ {formatCurrency(totalCredits)} C</span>
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