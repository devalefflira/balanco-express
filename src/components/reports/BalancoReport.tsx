import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { formatCurrency } from '@/lib/formatters';
import { ReportSignatures } from './ReportSignatures';

interface BalancoReportProps {
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
  periodText: string; // Ex: "01/01/2025 a 31/12/2025"
  balances: AccountingBalance[];
}

export const BalancoReport: React.FC<BalancoReportProps> = ({
  company,
  accountant,
  firmName = 'PRIME CONTABILIDADE',
  periodText,
  balances,
}) => {
  const assetBalances = balances.filter(b => b.classification.startsWith('1'));
  const liabilityBalances = balances.filter(b => b.classification.startsWith('2'));

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
            <p className="text-sm font-bold">Balanço Patrimonial</p>
            <p>Período: {periodText}</p>
          </div>
        </div>
      </div>

      {/* Grid Ativo / Passivo */}
      <div className="space-y-6">
        {/* Bloco Ativo */}
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black text-left font-bold">
                <th className="py-1">Descrição</th>
                <th className="py-1 text-center w-28">Classificação</th>
                <th className="py-1 text-right w-36">Exercício Atual</th>
              </tr>
            </thead>
            <tbody>
              {assetBalances.map((item, idx) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                return (
                  <tr key={idx} className={`border-b border-gray-100 ${isSynthetic ? 'font-bold bg-gray-50/70' : ''}`}>
                    <td className="py-1 pl-1" style={{ paddingLeft: `${(item.classification.split('-').length - 1) * 12}px` }}>
                      {item.description}
                    </td>
                    <td className="py-1 text-center font-mono text-gray-600">{item.classification}</td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(item.finalBalance)}{item.finalNature}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bloco Passivo e PL */}
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-black text-left font-bold">
                <th className="py-1">Descrição</th>
                <th className="py-1 text-center w-28">Classificação</th>
                <th className="py-1 text-right w-36">Exercício Atual</th>
              </tr>
            </thead>
            <tbody>
              {liabilityBalances.map((item, idx) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                return (
                  <tr key={idx} className={`border-b border-gray-100 ${isSynthetic ? 'font-bold bg-gray-50/70' : ''}`}>
                    <td className="py-1 pl-1" style={{ paddingLeft: `${(item.classification.split('-').length - 1) * 12}px` }}>
                      {item.description}
                    </td>
                    <td className="py-1 text-center font-mono text-gray-600">{item.classification}</td>
                    <td className="py-1 text-right font-mono">
                      {formatCurrency(item.finalBalance)}{item.finalNature}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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