import Decimal from 'decimal.js';
import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export interface BalanceAdjustmentSuggestion {
  targetAccountId: string;
  targetAccountDescription: string;
  suggestedDebit: number;
  suggestedCredit: number;
  adjustmentAmount: number;
  newFinalBalance: number;
  newFinalNature: 'D' | 'C';
}

export class AutoBalancer {
  /**
   * Recalcula a árvore de contas e aplica ajuste automático na conta balanceadora
   * @param balances Lista completa de saldos
   * @param balancingAccountClassification Classificação da conta de ajuste (ex: '1-1-07' Sócios, '2-4-08' Lucros Acumulados, ou '1-1-01-01' Caixa)
   */
  public static autoBalance(
    balances: AccountingBalance[],
    balancingAccountClassification: string = '2-4-08-01'
  ): { updatedBalances: AccountingBalance[]; adjustmentMade: boolean; adjustmentValue: number } {
    const report = AccountingEngine.calculateBalanceSheet(balances);

    if (report.isBalanced) {
      return { updatedBalances: balances, adjustmentMade: false, adjustmentValue: 0 };
    }

    const discrepancy = report.discrepancy; // Se positivo, Ativo > Passivo+PL. Se negativo, Ativo < Passivo+PL.
    const updated = balances.map(b => ({ ...b }));

    // Localiza a conta balanceadora analítica
    const targetIndex = updated.findIndex(
      b => b.classification.startsWith(balancingAccountClassification) && b.accountType === 'ANALITICA'
    );

    if (targetIndex === -1) {
      // Se não achar a conta padrão, procura Lucro Acumulado ou Crédito de Sócios
      const fallbackIndex = updated.findIndex(
        b => (b.classification.includes('2-4-08') || b.classification.includes('1-1-07')) && b.accountType === 'ANALITICA'
      );
      if (fallbackIndex === -1) {
        return { updatedBalances: balances, adjustmentMade: false, adjustmentValue: discrepancy.toNumber() };
      }
      return this.applyDiscrepancyToAccount(updated, fallbackIndex, discrepancy);
    }

    return this.applyDiscrepancyToAccount(updated, targetIndex, discrepancy);
  }

  private static applyDiscrepancyToAccount(
    balances: AccountingBalance[],
    targetIndex: number,
    discrepancy: Decimal
  ) {
    const target = balances[targetIndex];
    const currentFinal = new Decimal(target.finalBalance || 0);

    let newFinal: Decimal;
    let newNature: 'D' | 'C' = target.finalNature;

    // Se for conta de Passivo ou PL (Natureza Credora por padrão):
    if (target.statementGroup === 'PASSIVO' || target.statementGroup === 'PL') {
      const net = (target.finalNature === 'C' ? currentFinal : currentFinal.negated()).plus(discrepancy);
      if (net.isNegative()) {
        newFinal = net.abs();
        newNature = 'D';
      } else {
        newFinal = net;
        newNature = 'C';
      }
    } 
    // Se for conta de Ativo (Natureza Devedora por padrão):
    else {
      const net = (target.finalNature === 'D' ? currentFinal : currentFinal.negated()).minus(discrepancy);
      if (net.isNegative()) {
        newFinal = net.abs();
        newNature = 'C';
      } else {
        newFinal = net;
        newNature = 'D';
      }
    }

    balances[targetIndex] = {
      ...target,
      finalBalance: newFinal.toDecimalPlaces(2).toNumber(),
      finalNature: newNature
    };

    return {
      updatedBalances: balances,
      adjustmentMade: true,
      adjustmentValue: discrepancy.toDecimalPlaces(2).toNumber()
    };
  }
}