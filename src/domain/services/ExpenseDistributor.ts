import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export interface ExpenseDistributionTarget {
  codeReduced: number;
  description: string;
  classification: string;
  allocatedAmount: number;
  percentage: number;
}

export interface ExpenseDistributionResult {
  updatedBalances: AccountingBalance[];
  sourceAccount: {
    codeReduced: number;
    description: string;
    classification: string;
    originalAmount: number;
    retainedAmount: number;
    distributedAmount: number;
  };
  targets: ExpenseDistributionTarget[];
  totalDistributed: number;
}

export class ExpenseDistributor {
  /**
   * Padrão de pesos ponderados de distribuição de despesas operacionais corporativas
   */
  private static DEFAULT_WEIGHTS: Record<number, number> = {
    1960: 0.35, // Materiais de consumo / diversos (35%)
    1631: 0.15, // Combustível (15%)
    1743: 0.12, // Energia Elétrica (12%)
    1492: 0.10, // Depreciações e Amortizações (10%)
    1490: 0.08, // Devoluções (8%)
    1488: 0.05, // Honorários Contábeis (5%)
    2954: 0.05, // Plano de Saúde (5%)
    2345: 0.04, // Sistemas e Consultorias (4%)
    1750: 0.03, // Telefone e Internet (3%)
    1482: 0.02, // Impostos e Taxas (2%)
    1757: 0.01, // Água / Esgoto (1%)
  };

  /**
   * Detecta contas de despesa com concentração atípica
   */
  public static detectOutlierExpenses(balances: AccountingBalance[]): AccountingBalance[] {
    const expenses = balances.filter(
      (b) => b.statementGroup === 'DESPESA' && b.accountType === 'ANALITICA' && (b.debitAmount > 0 || b.finalBalance > 0)
    );

    const totalExpense = expenses.reduce((acc, curr) => acc + (curr.debitAmount || curr.finalBalance || 0), 0);
    if (totalExpense === 0) return [];

    return expenses.filter((e) => {
      const val = e.debitAmount || e.finalBalance || 0;
      return val >= 500000 && (val / totalExpense >= 0.4 || val >= 1000000);
    });
  }

  /**
   * Distribui o montante selecionado de uma conta de despesa para as demais
   */
  public static distribute(
    balances: AccountingBalance[],
    sourceCodeReduced: number,
    percentageToDistribute: number = 80 // Distribuir ex: 80% do valor e reter 20%
  ): ExpenseDistributionResult {
    const updated = balances.map((b) => ({ ...b }));
    const source = updated.find((b) => b.codeReduced === sourceCodeReduced);

    if (!source) {
      throw new Error('Conta de despesa de origem não encontrada.');
    }

    const originalAmount = source.debitAmount || source.finalBalance || 0;
    const totalToDistribute = Math.round(originalAmount * (percentageToDistribute / 100) * 100) / 100;
    const retainedAmount = Math.round((originalAmount - totalToDistribute) * 100) / 100;

    // Ajusta a conta de origem
    source.debitAmount = retainedAmount;
    const calcSource = AccountingEngine.calculateFinalBalance(
      source.initialBalance,
      source.initialNature,
      retainedAmount,
      source.creditAmount,
      source.finalNature
    );
    source.finalBalance = calcSource.balance;
    source.finalNature = calcSource.nature;

    // Filtra contas analíticas de despesa elegíveis (exceto a própria origem)
    const eligibleTargets = updated.filter(
      (b) => b.statementGroup === 'DESPESA' && b.accountType === 'ANALITICA' && b.codeReduced !== sourceCodeReduced
    );

    const targetDetails: ExpenseDistributionTarget[] = [];
    let allocatedSum = 0;

    // Normaliza os pesos das contas disponíveis
    let totalWeight = 0;
    eligibleTargets.forEach((t) => {
      totalWeight += this.DEFAULT_WEIGHTS[t.codeReduced] || 0.02;
    });

    eligibleTargets.forEach((target, idx) => {
      const weight = (this.DEFAULT_WEIGHTS[target.codeReduced] || 0.02) / totalWeight;
      let piece = Math.round(totalToDistribute * weight * 100) / 100;

      // Ajuste de arredondamento na última conta
      if (idx === eligibleTargets.length - 1) {
        piece = Math.round((totalToDistribute - allocatedSum) * 100) / 100;
      }

      allocatedSum += piece;
      target.debitAmount = Math.round(((target.debitAmount || 0) + piece) * 100) / 100;

      const calcTarget = AccountingEngine.calculateFinalBalance(
        target.initialBalance,
        target.initialNature,
        target.debitAmount,
        target.creditAmount,
        target.finalNature
      );
      target.finalBalance = calcTarget.balance;
      target.finalNature = calcTarget.nature;

      targetDetails.push({
        codeReduced: target.codeReduced,
        description: target.description,
        classification: target.classification,
        allocatedAmount: piece,
        percentage: Math.round(weight * 100 * 10) / 10,
      });
    });

    return {
      updatedBalances: updated,
      sourceAccount: {
        codeReduced: source.codeReduced,
        description: source.description,
        classification: source.classification,
        originalAmount,
        retainedAmount,
        distributedAmount: totalToDistribute,
      },
      targets: targetDetails.filter((t) => t.allocatedAmount > 0),
      totalDistributed: totalToDistribute,
    };
  }
}