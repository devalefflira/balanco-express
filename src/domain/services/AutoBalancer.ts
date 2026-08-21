import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export interface BalancingAction {
  id: string;
  timestamp: string;
  sourceAccount: string;
  sourceClassification: string;
  targetAccount: string;
  targetClassification: string;
  targetCodeReduced: number;
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'BALANCE';
  description: string;
}

export interface AutoBalanceResult {
  updatedBalances: AccountingBalance[];
  adjustmentMade: boolean;
  adjustmentValue: number;
  actionDetails?: BalancingAction;
}

export class AutoBalancer {
  public static autoBalance(balances: AccountingBalance[]): AutoBalanceResult {
    const calculation = AccountingEngine.calculateBalanceSheet(balances);

    if (calculation.isBalanced) {
      return {
        updatedBalances: balances,
        adjustmentMade: false,
        adjustmentValue: 0,
      };
    }

    const discrepancy = calculation.discrepancy.toNumber();
    const round = (val: number) => Math.round(val * 100) / 100;
    const diff = round(discrepancy);

    const updated = balances.map((b) => ({ ...b }));

    // Conta preferencial para contrapartida: [1029] Lucro / Prejuízo do Período (PL)
    let targetAcc = updated.find((b) => b.codeReduced === 1029 && b.accountType === 'ANALITICA');

    // Fallback: [939] Capital Social ou [1939] Fundo de Reserva
    if (!targetAcc) {
      targetAcc = updated.find((b) => b.statementGroup === 'PL' && b.accountType === 'ANALITICA');
    }

    if (!targetAcc) {
      return {
        updatedBalances: balances,
        adjustmentMade: false,
        adjustmentValue: 0,
      };
    }

    const initialTargetBalance = Number(targetAcc.finalBalance || 0);
    const initialTargetNat = targetAcc.finalNature;

    let newBalance = initialTargetBalance;
    let newNat: 'D' | 'C' = initialTargetNat;

    // Se Ativo > Passivo+PL (diff > 0), precisamos aumentar o PL com Crédito (+diff)
    // Se Ativo < Passivo+PL (diff < 0), precisamos reduzir o PL com Débito (-diff)
    let signedValue = initialTargetNat === 'C' ? initialTargetBalance : -initialTargetBalance;
    signedValue += diff;

    if (signedValue >= 0) {
      newBalance = round(signedValue);
      newNat = 'C';
    } else {
      newBalance = round(Math.abs(signedValue));
      newNat = 'D';
    }

    targetAcc.finalBalance = newBalance;
    targetAcc.finalNature = newNat;
    targetAcc.creditAmount = round((targetAcc.creditAmount || 0) + (diff > 0 ? diff : 0));
    targetAcc.debitAmount = round((targetAcc.debitAmount || 0) + (diff < 0 ? Math.abs(diff) : 0));

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const actionDetails: BalancingAction = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: timeStr,
      sourceAccount: 'Discrepância Geral do Balanço',
      sourceClassification: 'Ajuste Automático',
      targetAccount: targetAcc.description,
      targetClassification: targetAcc.classification,
      targetCodeReduced: targetAcc.codeReduced,
      amount: Math.abs(diff),
      type: diff > 0 ? 'CREDIT' : 'DEBIT',
      description: `Contrapartida de ${diff > 0 ? 'Crédito' : 'Débito'} aplicada em ${targetAcc.classification} - ${targetAcc.description}`,
    };

    return {
      updatedBalances: updated,
      adjustmentMade: true,
      adjustmentValue: Math.abs(diff),
      actionDetails,
    };
  }
}