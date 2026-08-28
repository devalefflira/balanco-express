import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export class AutoBalancer {
  /**
   * Identifica a discrepância entre Ativo e Passivo+PL e ajusta a conta
   * de Longo Prazo correspondente para zerar a diferença preservando a Liquidez Corrente = 1,0x.
   */
  public static balance(balances: AccountingBalance[]): {
    updatedBalances: AccountingBalance[];
    adjustedAccount: { codeReduced: number; description: string; amount: number };
  } {
    const list = balances.map((b) => ({ ...b }));
    const bs = AccountingEngine.calculateBalanceSheet(list);

    const discrepancy = bs.discrepancy.toNumber(); // Ativo - (Passivo + PL)

    if (Math.abs(discrepancy) < 0.01) {
      return {
        updatedBalances: list,
        adjustedAccount: { codeReduced: 0, description: 'Balanço já equilibrado', amount: 0 },
      };
    }

    // Ajusta a conta de Passivo Não Circulante (Fornecedores / Financiamentos LP - 2615)
    let targetAcc = list.find((b) => b.codeReduced === 2615 || b.classification === '2-2-01-10');

    if (!targetAcc) {
      targetAcc = list.find((b) => b.classification.startsWith('2-2-01') && b.accountType === 'ANALITICA');
    }

    if (targetAcc) {
      const currentCred = targetAcc.creditAmount || targetAcc.finalBalance || 0;
      const newCred = Math.max(0, currentCred + discrepancy);

      targetAcc.creditAmount = newCred;
      targetAcc.finalBalance = newCred;
      targetAcc.finalNature = 'C';

      return {
        updatedBalances: list,
        adjustedAccount: {
          codeReduced: targetAcc.codeReduced,
          description: targetAcc.description,
          amount: discrepancy,
        },
      };
    }

    return {
      updatedBalances: list,
      adjustedAccount: { codeReduced: 0, description: 'Nenhuma conta elegível encontrada', amount: 0 },
    };
  }
}