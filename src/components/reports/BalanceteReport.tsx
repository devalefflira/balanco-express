import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from '@/domain/services/AccountingEngine';
import { formatCurrency } from '@/lib/formatters';

interface BalanceteReportProps {
  company: {
    corporateName: string;
    code?: string;
    cnpj: string;
    nire?: string;
    nireDate?: string;
  };
  firmName?: string;
  periodText: string; // Ex: "01/01/2026 até 31/03/2026"
  balances: AccountingBalance[];
}

export const BalanceteReport: React.FC<BalanceteReportProps> = ({
  company,
  firmName = 'PRIME CONTABILIDADE',
  periodText,
  balances,
}) => {
  const dreResult = AccountingEngine.calculateDRE(balances);
  const balanceSheet = AccountingEngine.calculateBalanceSheet(balances);

  const totalDebits = balances
    .filter((b) => b.accountType === 'ANALITICA')
    .reduce((acc, curr) => acc + (curr.debitAmount || 0), 0);

  const totalCredits = balances
    .filter((b) => b.accountType === 'ANALITICA')
    .reduce((acc, curr) => acc + (curr.creditAmount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto bg-white p-8 font-sans text-xs text-gray-900 border shadow-sm print:border-none print:shadow-none">
      {/* Cabeçalho do Balancete */}
      <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-start">
        <div>
          <h2 className="text-sm font-extrabold uppercase">
            {company.corporateName} {company.code && `(${company.code})`}
          </h2>
          <h1 className="text-xs font-bold text-gray-700">{firmName}</h1>
          <p>
            CNPJ: {company.cnpj} {company.nire && `| NIRE: ${company.nire} Data: ${company.nireDate || ''}`}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">Balancete Analítico</p>
          <p className="font-semibold text-gray-700">{periodText}</p>
        </div>
      </div>

      {/* Tabela de Contas e Saldos */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black text-left font-bold bg-gray-50">
            <th className="py-2 pl-2">Descrição</th>
            <th className="py-2 text-right w-28">Saldo Anterior</th>
            <th className="py-2 text-right w-28">Débito</th>
            <th className="py-2 text-right w-28">Crédito</th>
            <th className="py-2 text-right w-32 pr-2">Saldo Atual</th>
          </tr>
        </thead>
        <tbody>
          {balances.map((item, idx) => {
            const isSynthetic = item.accountType === 'SINTETICA';
            return (
              <tr
                key={idx}
                className={`border-b border-gray-100 ${
                  isSynthetic ? 'font-bold bg-gray-50/60' : 'hover:bg-blue-50/30'
                }`}
              >
                <td
                  className="py-1 pl-2"
                  style={{ paddingLeft: `${(item.classification.split('-').length - 1) * 12 + 8}px` }}
                >
                  <span className="font-mono text-gray-500 mr-1.5">[{item.codeReduced}]</span>
                  {item.description}
                </td>
                <td className="py-1 text-right font-mono text-gray-600">
                  {formatCurrency(item.initialBalance)}
                  {item.initialNature}
                </td>
                <td className="py-1 text-right font-mono">{formatCurrency(item.debitAmount)}</td>
                <td className="py-1 text-right font-mono">{formatCurrency(item.creditAmount)}</td>
                <td className="py-1 text-right font-mono font-semibold pr-2">
                  {formatCurrency(item.finalBalance)}
                  {item.finalNature}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Análise do Balancete e Totais do Período */}
      <div className="border border-black p-4 bg-gray-50 font-mono text-xs space-y-3">
        <h3 className="font-bold uppercase tracking-wider text-center border-b border-gray-300 pb-1">
          Análise do Balancete
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Ativo:</span>
              <span className="font-bold">{formatCurrency(balanceSheet.totalAssets.toNumber())} D</span>
            </div>
            <div className="flex justify-between">
              <span>Despesa:</span>
              <span>
                {formatCurrency(
                  dreResult.operatingExpenses.plus(dreResult.financialExpenses).toNumber()
                )}{' '}
                D
              </span>
            </div>
            <div className="flex justify-between">
              <span>Custo:</span>
              <span>{formatCurrency(dreResult.costOfGoodsSold.toNumber())} D</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-300 font-bold">
              <span>Total Débitos:</span>
              <span>{formatCurrency(totalDebits)} D</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Passivo:</span>
              <span className="font-bold">
                {formatCurrency(
                  balanceSheet.totalLiabilities.plus(balanceSheet.equity).toNumber()
                )}{' '}
                C
              </span>
            </div>
            <div className="flex justify-between">
              <span>Receita:</span>
              <span>
                {formatCurrency(
                  dreResult.grossRevenue.plus(dreResult.nonOperatingRevenue).toNumber()
                )}{' '}
                C
              </span>
            </div>
            <div className="flex justify-between text-blue-900 font-bold">
              <span>Lucro / Resultado:</span>
              <span>{formatCurrency(dreResult.netIncome.toNumber())}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-gray-300 font-bold">
              <span>Total Créditos:</span>
              <span>{formatCurrency(totalCredits)} C</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};