export type AccountType = 'SINTETICA' | 'ANALITICA';
export type AccountNature = 'D' | 'C';
export type StatementGroup = 'ATIVO' | 'PASSIVO' | 'PL' | 'RECEITA' | 'CUSTO' | 'DESPESA';

export interface ChartAccount {
  id?: string;
  companyId?: string;
  codeReduced: number;
  classification: string;
  description: string;
  accountType: AccountType;
  nature: AccountNature;
  statementGroup: StatementGroup;
  level: number;
  createdAt?: string;
}