import { AccountNature } from './ChartAccount';

export interface AccountingBalance {
  id?: string;
  periodId: string;
  accountId: string;
  classification: string;
  description: string;
  codeReduced: number;
  statementGroup: 'ATIVO' | 'PASSIVO' | 'PL' | 'RECEITA' | 'CUSTO' | 'DESPESA';
  accountType: 'SINTETICA' | 'ANALITICA';
  initialBalance: number;
  initialNature: AccountNature;
  debitAmount: number;
  creditAmount: number;
  finalBalance: number;
  finalNature: AccountNature;
}