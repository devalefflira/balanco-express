import Decimal from 'decimal.js';
import { AccountingBalance } from '../entities/AccountingBalance';

export interface DREResult {
  grossRevenue: Decimal;
  deductions: Decimal;
  netRevenue: Decimal;
  costOfGoodsSold: Decimal;
  grossProfit: Decimal;
  operatingExpenses: Decimal;
  financialExpenses: Decimal;
  nonOperatingRevenue: Decimal;
  netIncome: Decimal;
}

export interface BalanceSheetResult {
  totalAssets: Decimal;
  currentAssets: Decimal;
  nonCurrentAssets: Decimal;
  totalLiabilities: Decimal;
  currentLiabilities: Decimal;
  nonCurrentLiabilities: Decimal;
  equity: Decimal;
  dreResult: DREResult;
  isBalanced: boolean;
  discrepancy: Decimal;
}

export class AccountingEngine {
  public static calculateFinalBalance(
    initialBalance: number,
    initialNature: 'D' | 'C',
    debit: number,
    credit: number,
    accountNature: 'D' | 'C'
  ): { balance: number; nature: 'D' | 'C' } {
    const initial = new Decimal(initialBalance || 0);
    const deb = new Decimal(debit || 0);
    const cred = new Decimal(credit || 0);

    let netValue = new Decimal(0);

    if (initialNature === 'D') {
      netValue = initial.plus(deb).minus(cred);
    } else {
      netValue = initial.plus(cred).minus(deb);
    }

    if (netValue.abs().lessThan(0.0001)) {
      return { balance: 0, nature: accountNature };
    }

    if (accountNature === 'D') {
      if (netValue.isNegative()) {
        return { balance: netValue.abs().toNumber(), nature: 'C' };
      }
      return { balance: netValue.toNumber(), nature: 'D' };
    } else {
      if (netValue.isNegative()) {
        return { balance: netValue.abs().toNumber(), nature: 'D' };
      }
      return { balance: netValue.toNumber(), nature: 'C' };
    }
  }

  public static calculateDRE(balances: AccountingBalance[]): DREResult {
    let grossRevenue = new Decimal(0);
    let deductions = new Decimal(0);
    let costOfGoodsSold = new Decimal(0);
    let operatingExpenses = new Decimal(0);
    let financialExpenses = new Decimal(0);
    let nonOperatingRevenue = new Decimal(0);

    const analytical = balances.filter(b => b.accountType === 'ANALITICA');

    for (const item of analytical) {
      const movVal = new Decimal(
        item.statementGroup === 'RECEITA'
          ? (item.creditAmount || item.finalBalance || 0)
          : (item.debitAmount || item.finalBalance || 0)
      );

      if (item.classification.startsWith('3-1')) {
        grossRevenue = grossRevenue.plus(movVal);
      } else if (item.classification.startsWith('3-2-01')) {
        deductions = deductions.plus(movVal);
      } else if (item.classification.startsWith('3-2-03')) {
        costOfGoodsSold = costOfGoodsSold.plus(movVal);
      } else if (item.classification.startsWith('3-5') || item.classification.startsWith('3-3')) {
        nonOperatingRevenue = nonOperatingRevenue.plus(movVal);
      } else if (item.classification.startsWith('4-2')) {
        financialExpenses = financialExpenses.plus(movVal);
      } else if (item.classification.startsWith('4-1')) {
        operatingExpenses = operatingExpenses.plus(movVal);
      }
    }

    const netRevenue = grossRevenue.minus(deductions);
    const grossProfit = netRevenue.minus(costOfGoodsSold);
    const totalExpenses = operatingExpenses.plus(financialExpenses);
    const netIncome = grossProfit.plus(nonOperatingRevenue).minus(totalExpenses);

    return {
      grossRevenue,
      deductions,
      netRevenue,
      costOfGoodsSold,
      grossProfit,
      operatingExpenses,
      financialExpenses,
      nonOperatingRevenue,
      netIncome
    };
  }

  public static calculateBalanceSheet(balances: AccountingBalance[]): BalanceSheetResult {
    let currentAssets = new Decimal(0);
    let nonCurrentAssets = new Decimal(0);
    let currentLiabilities = new Decimal(0);
    let nonCurrentLiabilities = new Decimal(0);
    let equity = new Decimal(0);

    const analytical = balances.filter(b => b.accountType === 'ANALITICA');
    const dreResult = this.calculateDRE(balances);

    const recordedPeriodResult = analytical.find(b => b.classification.startsWith('2-4-08-01'));
    const hasRecordedResult = recordedPeriodResult && (recordedPeriodResult.finalBalance || 0) > 0;

    for (const item of analytical) {
      const val = new Decimal(item.finalBalance || 0);

      if (item.classification.startsWith('1-1')) {
        currentAssets = item.finalNature === 'C' ? currentAssets.minus(val) : currentAssets.plus(val);
      } else if (item.classification.startsWith('1-2')) {
        nonCurrentAssets = item.finalNature === 'C' ? nonCurrentAssets.minus(val) : nonCurrentAssets.plus(val);
      } else if (item.classification.startsWith('2-1')) {
        currentLiabilities = item.finalNature === 'D' ? currentLiabilities.minus(val) : currentLiabilities.plus(val);
      } else if (item.classification.startsWith('2-2')) {
        nonCurrentLiabilities = item.finalNature === 'D' ? nonCurrentLiabilities.minus(val) : nonCurrentLiabilities.plus(val);
      } else if (item.classification.startsWith('2-4')) {
        equity = item.finalNature === 'D' ? equity.minus(val) : equity.plus(val);
      }
    }

    const totalAssets = currentAssets.plus(nonCurrentAssets);
    const totalLiabilities = currentLiabilities.plus(nonCurrentLiabilities);
    const totalEquity = hasRecordedResult ? equity : equity.plus(dreResult.netIncome);

    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);
    const discrepancy = totalAssets.minus(totalLiabilitiesAndEquity);
    const isBalanced = discrepancy.abs().lessThan(0.01);

    return {
      totalAssets,
      currentAssets,
      nonCurrentAssets,
      totalLiabilities,
      currentLiabilities,
      nonCurrentLiabilities,
      equity: totalEquity,
      dreResult,
      isBalanced,
      discrepancy
    };
  }

  /**
   * Realiza o Zeramento de Resultado: iguala o Crédito ao Débito em Despesas/Custos
   * e o Débito ao Crédito em Receitas, transferindo a contrapartida para o PL (2-4-08-01).
   */
  public static closeResultAccounts(balances: AccountingBalance[]): AccountingBalance[] {
    const list = balances.map(b => ({ ...b }));
    const dreResult = this.calculateDRE(list);

    for (const item of list) {
      if (item.statementGroup === 'DESPESA' || item.statementGroup === 'CUSTO') {
        if (item.accountType === 'ANALITICA') {
          const deb = item.debitAmount || item.finalBalance || 0;
          item.creditAmount = deb;
          item.finalBalance = 0;
          item.finalNature = 'D';
        }
      } else if (item.statementGroup === 'RECEITA') {
        if (item.accountType === 'ANALITICA') {
          const cred = item.creditAmount || item.finalBalance || 0;
          item.debitAmount = cred;
          item.finalBalance = 0;
          item.finalNature = 'C';
        }
      }
    }

    // Amarra o Lucro/Prejuízo Líquido na conta 2-4-08-01
    const resultAcc = list.find(b => b.classification.startsWith('2-4-08-01') || b.codeReduced === 1029);
    if (resultAcc) {
      const netVal = dreResult.netIncome.toNumber();
      resultAcc.creditAmount = netVal >= 0 ? netVal : 0;
      resultAcc.debitAmount = netVal < 0 ? Math.abs(netVal) : 0;
      resultAcc.finalBalance = Math.abs(netVal);
      resultAcc.finalNature = netVal >= 0 ? 'C' : 'D';
    }

    return list;
  }
}