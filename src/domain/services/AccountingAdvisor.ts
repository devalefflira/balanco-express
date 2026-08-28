import { AccountingBalance } from '../entities/AccountingBalance';
import { formatCurrency } from '@/lib/formatters';

export interface AccountingSuggestion {
  id: string;
  type: 'COUNTERPART' | 'TAX_WARNING' | 'EQUITY_RULE' | 'CLOSING_RULE';
  targetCode: number;
  targetDescription: string;
  targetClassification: string;
  title: string;
  explanation: string;
  suggestedActionText: string;
  suggestedField?: 'debitAmount' | 'creditAmount' | 'initialBalance';
  suggestedValue?: number;
}

export class AccountingAdvisor {
  public static analyzeChange(
    changedAccount: AccountingBalance,
    field: string,
    newValue: number,
    allBalances: AccountingBalance[]
  ): AccountingSuggestion[] {
    const suggestions: AccountingSuggestion[] = [];
    if (!changedAccount || !changedAccount.classification) return suggestions;

    const cls = changedAccount.classification;
    const val = Number(newValue) || 0;

    // 1. Receitas de Vendas (Grupo 3-1)
    if (cls.startsWith('3-1') || changedAccount.statementGroup === 'RECEITA') {
      suggestions.push({
        id: 'rev-contra',
        type: 'COUNTERPART',
        targetCode: 2238,
        targetDescription: 'Clientes a receber (1-1-04-05)',
        targetClassification: '1-1-04-05',
        title: 'Entrada de Receita (Partidas Dobradas)',
        explanation: `Ao creditar R$ ${formatCurrency(val)} em Receita, a contrapartida contábil exige um débito no Ativo Circulante (Clientes ou Caixa/Bancos) para reconhecer a entrada dos recursos operacionais.`,
        suggestedActionText: 'Lançar Débito em Clientes a Receber',
        suggestedField: 'debitAmount',
        suggestedValue: val,
      });

      suggestions.push({
        id: 'tax-icms',
        type: 'TAX_WARNING',
        targetCode: 735,
        targetDescription: 'ICMS a recolher (2-1-03-01)',
        targetClassification: '2-1-03-01',
        title: 'Tributação Incidente s/ Vendas',
        explanation: 'O faturamento gera apuração de ICMS, PIS e COFINS nas deduções da receita (3-2) e impostos a recolher no Passivo (2-1-03).',
        suggestedActionText: 'Verificar alíquotas de tributos incidentes',
      });
    }

    // 2. Custo das Mercadorias Vendidas - CMV (Grupo 3-2-03)
    else if (cls.startsWith('3-2-03') || changedAccount.statementGroup === 'CUSTO') {
      suggestions.push({
        id: 'cmv-stock',
        type: 'COUNTERPART',
        targetCode: 287,
        targetDescription: 'Mercadorias p/ Revenda (1-1-10-01)',
        targetClassification: '1-1-10-01',
        title: 'Baixa de Estoque por Venda',
        explanation: `O reconhecimento do CMV (R$ ${formatCurrency(val)}) representa a saída física do estoque. A contrapartida obrigatória é o crédito no Ativo em Estoques.`,
        suggestedActionText: 'Lançar Crédito em Mercadorias p/ Revenda',
        suggestedField: 'creditAmount',
        suggestedValue: val,
      });
    }

    // 3. Despesas com Pessoal / Folha (Grupo 4-1-01)
    else if (cls.startsWith('4-1-01')) {
      suggestions.push({
        id: 'payroll-prov',
        type: 'COUNTERPART',
        targetCode: 819,
        targetDescription: 'Ordenados e salários a pagar (2-1-04-01)',
        targetClassification: '2-1-04-01',
        title: 'Apropriação da Folha de Pagamento',
        explanation: `Despesas com salários (R$ ${formatCurrency(val)}) devem ser provisionadas no Passivo Circulante antes da liquidação financeira (Princípio da Competência).`,
        suggestedActionText: 'Lançar Crédito em Salários a Pagar',
        suggestedField: 'creditAmount',
        suggestedValue: val,
      });
    }

    // 4. Depreciações e Amortizações (Grupo 4-1-02-29)
    else if (cls.startsWith('4-1-02-29')) {
      suggestions.push({
        id: 'deprec-contra',
        type: 'COUNTERPART',
        targetCode: 469,
        targetDescription: 'Depreciação Acumulada (1-2-04)',
        targetClassification: '1-2-04',
        title: 'Desgaste do Imobilizado',
        explanation: `A despesa de depreciação (R$ ${formatCurrency(val)}) reduz contabilmente o valor contábil dos ativos não circulantes via conta redutora credora no Ativo.`,
        suggestedActionText: 'Creditar Depreciação Acumulada',
        suggestedField: 'creditAmount',
        suggestedValue: val,
      });
    }

    // 5. Outras Despesas Operacionais e Administrativas (Grupo 4-1)
    else if (cls.startsWith('4-1') || cls.startsWith('4-2') || changedAccount.statementGroup === 'DESPESA') {
      suggestions.push({
        id: 'expense-provider',
        type: 'COUNTERPART',
        targetCode: 1729,
        targetDescription: 'Fornecedores (2-1-02-06)',
        targetClassification: '2-1-02-06',
        title: 'Provisão de Despesa Operacional',
        explanation: `Ao lançar débito na despesa (R$ ${formatCurrency(val)}), você pode provisionar a obrigação no Passivo em Fornecedores ou liquidar com saída de Caixa/Banco.`,
        suggestedActionText: 'Lançar Crédito em Fornecedores',
        suggestedField: 'creditAmount',
        suggestedValue: val,
      });

      suggestions.push({
        id: 'closing-hint',
        type: 'CLOSING_RULE',
        targetCode: 1029,
        targetDescription: 'Lucro / Prejuízo do Período (2-4-08-01)',
        targetClassification: '2-4-08-01',
        title: 'Impacto no Lucro Líquido',
        explanation: `Despesas reduzem o resultado do exercício. Ao terminar as edições, clique no botão "Zerar Resultado (DRE)" para sincronizar com o Balanço.`,
        suggestedActionText: 'Zerar Resultado ao Finalizar',
      });
    }

    // 6. Ativo Circulante (Contas de Banco / Caixa / Clientes - Grupo 1-1)
    else if (cls.startsWith('1-1')) {
      suggestions.push({
        id: 'asset-bank-contra',
        type: 'COUNTERPART',
        targetCode: 1211,
        targetDescription: 'Revenda de mercadorias (3-1-01-03)',
        targetClassification: '3-1-01-03',
        title: 'Origem dos Recursos do Ativo',
        explanation: `Movimentações no Ativo (R$ ${formatCurrency(val)}) originam-se de Receitas de Vendas (3-1), aporte de Capital Social (2-4-01) ou Empréstimos Bancários (2-1-01).`,
        suggestedActionText: 'Conferir contrapartida no Passivo ou DRE',
      });
    }

    // 7. Passivo Circulante (Fornecedores / Empréstimos - Grupo 2-1)
    else if (cls.startsWith('2-1')) {
      suggestions.push({
        id: 'liab-contra',
        type: 'COUNTERPART',
        targetCode: 287,
        targetDescription: 'Mercadorias p/ Revenda (1-1-10-01)',
        targetClassification: '1-1-10-01',
        title: 'Obrigação com Terceiros',
        explanation: `Contas a pagar no Passivo (R$ ${formatCurrency(val)}) têm contrapartida em Compras de Estoque (Ativo) ou Despesas Administrativas incorridas (DRE).`,
        suggestedActionText: 'Conferir entrada em Estoques ou Despesas',
      });
    }

    return suggestions;
  }
}