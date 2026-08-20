import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from '@/domain/services/AccountingEngine';
import { formatCurrency } from '@/lib/formatters';
import { ReportSignatures } from './ReportSignatures';

interface DREReportProps {
  company: {
    corporateName: string;
    cnpj: string;
    nire?: string;
    nireDate?: string;
    address?: string;
    representativeName: string;
    representativeCpf: string;
  };
  accountant: {
    name: string;
    crc: string;
  };
  firmName?: string;
  periodText: string;
  balances: AccountingBalance[];
}

export const DREReport: React.FC<DREReportProps> = ({
  company,
  accountant,
  firmName = 'PRIME CONTABILIDADE',
  periodText,
  balances,
}) => {
  const dreResult = AccountingEngine.calculateDRE(balances);
  const dreAccounts = balances.filter(b => b.classification.startsWith('3') || b.classification.startsWith('4'));

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans text-xs text-gray-900 border shadow-sm print:border-none print:shadow-none">
      {/* Cabeçalho */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold uppercase">{firmName}</h1>
            <h2 className="text-base font-extrabold">{company.corporateName}</h2>
            <p>{company.address}</p>
            <p>CNPJ: {company.cnpj} {company.nire && `| NIRE: ${company.nire} Data: ${company.nireDate || ''}`}</p>
          </div>
          <div className="text-right font-semibold">
            <p className="text-sm font-bold">Demonstração do Resultado do Exercício</p>
            <p>Período: {periodText}</p>
          </div>
        </div>
      </div>

      {/* Lista de Contas */}
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b border-black text-left font-bold">
            <th className="py-1">Descrição</th>
            <th className="py-1 text-center w-28">Classificação</th>
            <th className="py-1 text-center w-20">Conta</th>
            <th className="py-1 text-right w-36">Exercício Atual</th>
          </tr>
        </thead>
        <tbody>
          {dreAccounts.map((item, idx) => {
            const isSynthetic = item.accountType === 'SINTETICA';
            return (
              <tr key={idx} className={`border-b border-gray-100 ${isSynthetic ? 'font-bold bg-gray-50/70' : ''}`}>
                <td className="py-1 pl-1" style={{ paddingLeft: `${(item.classification.split('-').length - 1) * 12}px` }}>
                  {item.description}
                </td>
                <td className="py-1 text-center font-mono text-gray-600">{item.classification}</td>
                <td className="py-1 text-center font-mono text-gray-500">{item.codeReduced || '-'}</td>
                <td className="py-1 text-right font-mono">
                  {formatCurrency(item.finalBalance)}{item.finalNature}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Quadro Sintético de Fechamento do Resultado */}
      <div className="border border-black p-4 bg-gray-50 font-mono text-sm space-y-1 mb-8">
        <div className="flex justify-between font-bold">
          <span>RECEITAS:</span>
          <span>{formatCurrency(dreResult.grossRevenue.plus(dreResult.nonOperatingRevenue).toNumber())} C</span>
        </div>
        <div className="flex justify-between font-bold text-gray-700">
          <span>DESPESAS + CUSTO:</span>
          <span>{formatCurrency(dreResult.costOfGoodsSold.plus(dreResult.operatingExpenses).plus(dreResult.financialExpenses).plus(dreResult.deductions).toNumber())} D</span>
        </div>
        <div className="border-t border-black pt-2 flex justify-between font-black text-base text-blue-900">
          <span>LUCRO LÍQUIDO DO EXERCÍCIO:</span>
          <span>R$ {formatCurrency(dreResult.netIncome.toNumber())}</span>
        </div>
      </div>

      {/* Assinaturas */}
      <ReportSignatures
        representativeName={company.representativeName}
        representativeCpf={company.representativeCpf}
        accountantName={accountant.name}
        accountantCrc={accountant.crc}
      />
    </div>
  );
};