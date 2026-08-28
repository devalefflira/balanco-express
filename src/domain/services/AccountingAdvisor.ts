import { AccountingBalance } from '../entities/AccountingBalance';
import { formatCurrency } from '@/lib/formatters';

export interface AccountingSuggestion {
  id: string;
  title: string;
  explanation: string;
  targetClassification: string;
  targetDescription: string;
  targetCode: number;
  suggestedField?: 'debitAmount' | 'creditAmount' | 'initialBalance';
  suggestedValue?: number;
}

export class AccountingAdvisor {
  public static analyzeChange(
    targetAccount: AccountingBalance,
    changedField: string,
    newValue: number,
    allBalances: AccountingBalance[]
  ): AccountingSuggestion[] {
    const suggestions: AccountingSuggestion[] = [];
    const classification = targetAccount.classification;
    const isDebit = changedField === 'debitAmount';
    const isCredit = changedField === 'creditAmount';

    // 1. Alteração no Ativo (Disponível / Aplicações)
    if (classification.startsWith('1-1-01') || classification.startsWith('1-1-02') || classification.startsWith('1-1-03')) {
      if (isDebit) {
        suggestions.push({
          id: 'sug-caixa-receita',
          title: 'Entrada de Caixa / Recebimento de Vendas',
          explanation: `A entrada de R$ ${formatCurrency(newValue)} no Ativo Disponível normalmente decorre de vendas à vista ou liquidação de cartões. Lance a contrapartida a crédito na Revenda de Mercadorias.`,
          targetClassification: '3-1-01-03',
          targetDescription: 'Revenda de mercadorias',
          targetCode: 1211,
          suggestedField: 'creditAmount',
          suggestedValue: newValue,
        });
      } else if (isCredit) {
        suggestions.push({
          id: 'sug-caixa-fornecedor',
          title: 'Pagamento de Fornecedores / Despesas',
          explanation: `A saída de R$ ${formatCurrency(newValue)} da conta bancária costuma quitar obrigações com fornecedores. Lance a contrapartida a débito no Passivo Circulante.`,
          targetClassification: '2-1-02-06',
          targetDescription: 'Fornecedores (Passivo Circulante)',
          targetCode: 1729,
          suggestedField: 'debitAmount',
          suggestedValue: newValue,
        });
      }
    }

    // 2. Alteração em Contas a Receber (Clientes)
    if (classification.startsWith('1-1-04')) {
      if (isDebit) {
        suggestions.push({
          id: 'sug-clientes-vendas',
          title: 'Faturamento a Prazo / Cartões a Receber',
          explanation: `O acréscimo de R$ ${formatCurrency(newValue)} em clientes a receber reflete vendas parceladas ou vouchers de cartão de crédito. Contrapartida a crédito em Receita de Vendas.`,
          targetClassification: '3-1-01-03',
          targetDescription: 'Revenda de mercadorias',
          targetCode: 1211,
          suggestedField: 'creditAmount',
          suggestedValue: newValue,
        });
      }
    }

    // 3. Alteração no Imobilizado (Ativo Não Circulante)
    if (classification.startsWith('1-2-03')) {
      if (isDebit) {
        suggestions.push({
          id: 'sug-imob-financiamento',
          title: 'Aquisição de Ativo Imobilizado a Longo Prazo',
          explanation: `Novos investimentos em máquinas, instalações ou veículos (CAPEX) de R$ ${formatCurrency(newValue)} devem ser financiados via capital próprio ou dívida de Longo Prazo.`,
          targetClassification: '2-2-01-10',
          targetDescription: 'Fornecedores / Financiamentos Longo Prazo',
          targetCode: 2615,
          suggestedField: 'creditAmount',
          suggestedValue: newValue,
        });
      }
    }

    // 4. Alteração em Despesas Operacionais (Grupo 4-1)
    if (classification.startsWith('4-1')) {
      if (isDebit) {
        suggestions.push({
          id: 'sug-despesa-banco',
          title: 'Reconhecimento de Despesa Operacional',
          explanation: `O lançamento de R$ ${formatCurrency(newValue)} em despesas exige contrapartida na saída financeira ou na provisão a pagar do Passivo Circulante.`,
          targetClassification: '2-1-04-01',
          targetDescription: 'Ordenados e salários a pagar / Provisões',
          targetCode: 819,
          suggestedField: 'creditAmount',
          suggestedValue: newValue,
        });
      }
    }

    return suggestions;
  }
}