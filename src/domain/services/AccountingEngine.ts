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
    const initial = new Decimal(initialBalance);
    const deb = new Decimal(debit);
    const cred = new Decimal(credit);

    let netValue = new Decimal(0);

    if (initialNature === 'D') {
      netValue = initial.plus(deb).minus(cred);
    } else {
      netValue = initial.plus(cred).minus(deb);
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
      const val = new Decimal(item.finalBalance || 0);

      if (item.classification.startsWith('3-1')) {
        grossRevenue = grossRevenue.plus(val);
      } else if (item.classification.startsWith('3-2-01')) {
        deductions = deductions.plus(val);
      } else if (item.classification.startsWith('3-2-03')) {
        costOfGoodsSold = costOfGoodsSold.plus(val);
      } else if (item.classification.startsWith('3-5') || item.classification.startsWith('3-3')) {
        nonOperatingRevenue = nonOperatingRevenue.plus(val);
      } else if (item.classification.startsWith('4-2')) {
        financialExpenses = financialExpenses.plus(val);
      } else if (item.classification.startsWith('4-1')) {
        operatingExpenses = operatingExpenses.plus(val);
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

    const hasRecordedPeriodResult = analytical.some(
      b => b.classification.startsWith('2-4-08') && (b.finalBalance || 0) > 0
    );

    for (const item of analytical) {
      const val = new Decimal(item.finalBalance || 0);

      if (item.classification.startsWith('1-1')) {
        if (item.finalNature === 'C') {
          currentAssets = currentAssets.minus(val);
        } else {
          currentAssets = currentAssets.plus(val);
        }
      } else if (item.classification.startsWith('1-2')) {
        if (item.finalNature === 'C') {
          nonCurrentAssets = nonCurrentAssets.minus(val);
        } else {
          nonCurrentAssets = nonCurrentAssets.plus(val);
        }
      } else if (item.classification.startsWith('2-1')) {
        if (item.finalNature === 'D') {
          currentLiabilities = currentLiabilities.minus(val);
        } else {
          currentLiabilities = currentLiabilities.plus(val);
        }
      } else if (item.classification.startsWith('2-2')) {
        if (item.finalNature === 'D') {
          nonCurrentLiabilities = nonCurrentLiabilities.minus(val);
        } else {
          nonCurrentLiabilities = nonCurrentLiabilities.plus(val);
        }
      } else if (item.classification.startsWith('2-4')) {
        if (item.finalNature === 'D') {
          equity = equity.minus(val);
        } else {
          equity = equity.plus(val);
        }
      }
    }

    const totalAssets = currentAssets.plus(nonCurrentAssets);
    const totalLiabilities = currentLiabilities.plus(nonCurrentLiabilities);
    const totalEquity = hasRecordedPeriodResult ? equity : equity.plus(dreResult.netIncome);

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
}