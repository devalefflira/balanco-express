'use client';

import React from 'react';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
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
  const dreAccounts = balances.filter(
    (b) => b.statementGroup === 'RECEITA' || b.statementGroup === 'CUSTO' || b.statementGroup === 'DESPESA'
  );

  // Cálculos de Resultado
  const revenda = balances.find((b) => b.classification === '3-1-01-03')?.finalBalance || 0;
  const icms = balances.find((b) => b.classification === '3-2-01-03')?.finalBalance || 0;
  const devolucoesVenda = balances.find((b) => b.classification === '3-2-01-06')?.finalBalance || 0;
  const totalDeducoes = icms + devolucoesVenda;
  const cmv = balances.find((b) => b.classification === '3-2-03-03')?.finalBalance || 0;
  const bonificacoes = balances.find((b) => b.classification === '3-5-01-02')?.finalBalance || 0;

  const totalReceitas = revenda - totalDeducoes - cmv + bonificacoes;

  const despesasOperacionais = balances
    .filter((b) => b.classification.startsWith('4-1') && b.accountType === 'ANALITICA')
    .reduce((acc, curr) => acc + (curr.finalBalance || 0), 0);

  const despesasFinanceiras = balances
    .filter((b) => b.classification.startsWith('4-2') && b.accountType === 'ANALITICA')
    .reduce((acc, curr) => acc + (curr.finalBalance || 0), 0);

  const totalDespesas = despesasOperacionais + despesasFinanceiras;
  const lucroLiquido = totalReceitas - totalDespesas;

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-sans text-xs text-gray-900 border shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-full">
      {/* Cabeçalho */}
      <div className="border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold uppercase">{firmName}</h1>
            <h2 className="text-base font-extrabold">{company.corporateName}</h2>
            <p>{company.address}</p>
            <p>
              CNPJ: {company.cnpj} {company.nire && `| NIRE: ${company.nire} Data: ${company.nireDate || ''}`}
            </p>
          </div>
          <div className="text-right font-semibold">
            <p className="text-sm font-bold">Demonstração do Resultado do Exercício</p>
            <p>Período: {periodText}</p>
          </div>
        </div>
      </div>

      {/* Tabela de Contas DRE */}
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
              <tr
                key={idx}
                className={`border-b border-gray-100 print:break-inside-avoid ${
                  isSynthetic ? 'font-bold bg-gray-50/70' : ''
                }`}
              >
                <td
                  className="py-1 pl-1"
                  style={{ paddingLeft: `${(item.classification.split('-').length - 1) * 12}px` }}
                >
                  {item.description}
                </td>
                <td className="py-1 text-center font-mono text-gray-600">{item.classification}</td>
                <td className="py-1 text-center font-mono text-gray-500">{item.codeReduced}</td>
                <td className="py-1 text-right font-mono font-semibold">
                  {formatCurrency(item.finalBalance)}
                  {item.finalNature}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Bloco de Resultado Final da DRE */}
      <div className="border-t-2 border-black pt-3 mb-6 print:break-inside-avoid space-y-1 font-mono text-xs">
        <div className="flex justify-between font-bold">
          <span>TOTAL RECEITAS LÍQUIDAS:</span>
          <span>{formatCurrency(Math.max(totalReceitas, 0))} C</span>
        </div>
        <div className="flex justify-between font-bold text-rose-700">
          <span>TOTAL DESPESAS OPERACIONAIS + FINANCEIRAS:</span>
          <span>{formatCurrency(totalDespesas)} D</span>
        </div>
        <div className="flex justify-between font-extrabold text-sm border-t border-black pt-2 text-emerald-800">
          <span>LUCRO LÍQUIDO DO EXERCÍCIO:</span>
          <span>R$ {formatCurrency(lucroLiquido)}</span>
        </div>
      </div>

      {/* Assinaturas */}
      <div className="print:break-inside-avoid mt-8">
        <ReportSignatures
          representativeName={company.representativeName}
          representativeCpf={company.representativeCpf}
          accountantName={accountant.name}
          accountantCrc={accountant.crc}
        />
      </div>
    </div>
  );
};