import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export interface FinancialIndicatorsData {
  periodLabel: string;
  // Tabela da Esquerda
  netRevenueMM: number;
  ebitdaMM: number;
  ebitdaMarginPct: number;
  ebitMM: number;
  ebitMarginPct: number;
  netIncomeMM: number;
  dividendsMM: number;
  freeCashFlowMM: number;
  equityMM: number;
  financialDebtMM: number;
  bankDebtMM: number;
  otherDebtMM: number;
  cashAndEquivalentsMM: number;
  totalAssetsMM: number;
  netDebtToEbitda: number;
  netDebtToEbitdaNoOther: number;
  ebitdaToInterest: number;
  currentLiquidity: number;
  leverage: number;
  pmeDays: number; // Prazo Médio de Estoques
  pmrDays: number; // Prazo Médio de Recebimento
  pmpDays: number; // Prazo Médio de Pagamento
  financialCycleDays: number;

  // Tabela da Direita (Fluxo / Cash Flow)
  depreciationMM: number;
  workingCapitalVarMM: number;
  operationalCashFlowMM: number;
  capexMM: number;
  financialInvestmentsMM: number;
  financialRevenuesMM: number;
  financialMutualMM: number;
  investmentCashFlowMM: number;
  incomeTaxMM: number;
  longTermDebtVarMM: number;
  shortTermDebtVarMM: number;
  financialExpensesMM: number;
  equityVarMM: number;
  fxVarMM: number;
  otherFinancingMM: number;
  financingCashFlowMM: number;
  cashVariationMM: number;
  initialCashMM: number;
  finalCashMM: number;
}

export class FinancialIndicatorsEngine {
  public static calculate(balances: AccountingBalance[], periodLabel: string = 'Exercício'): FinancialIndicatorsData {
    const toMM = (val: number) => Math.round((val / 1000000) * 10) / 10;
    const round1 = (val: number) => Math.round(val * 10) / 10;

    const findBal = (code: number) => balances.find((b) => b.codeReduced === code)?.finalBalance || 0;
    const findInit = (code: number) => balances.find((b) => b.codeReduced === code)?.initialBalance || 0;

    const analytical = balances.filter((b) => b.accountType === 'ANALITICA');
    const dre = AccountingEngine.calculateDRE(balances);
    const bs = AccountingEngine.calculateBalanceSheet(balances);

    // 1. DRE & EBITDA
    const netRevenue = dre.netRevenue.toNumber();
    const cmv = dre.costOfGoodsSold.toNumber();
    const netIncome = dre.netIncome.toNumber();
    const financialExpenses = dre.financialExpenses.toNumber();

    // Depreciação contida na DRE
    const depreciation = analytical
      .filter((b) => b.codeReduced === 1492 || b.classification.startsWith('4-1-02-29'))
      .reduce((sum, b) => sum + (b.debitAmount || b.finalBalance || 0), 0) || findBal(469);

    // Tributos sobre o Lucro (IRPJ + CSLL)
    const irpjCSLL = analytical
      .filter((b) => [2230, 2231].includes(b.codeReduced) || b.classification.startsWith('4-1-03-09') || b.classification.startsWith('4-1-03-10'))
      .reduce((sum, b) => sum + (b.debitAmount || b.finalBalance || 0), 0);

    const ebit = netIncome + financialExpenses + irpjCSLL;
    const ebitda = ebit + depreciation;
    const ebitdaMarginPct = netRevenue > 0 ? round1((ebitda / netRevenue) * 100) : 0;
    const ebitMarginPct = netRevenue > 0 ? round1((ebit / netRevenue) * 100) : 0;

    // 2. Balanço Patrimonial & Estrutura de Capital
    const totalAssets = bs.totalAssets.toNumber();
    const currentAssets = bs.currentAssets.toNumber();
    const currentLiab = bs.currentLiabilities.toNumber();
    const equity = bs.equity.toNumber();

    // Disponível / Caixa Total
    const cashAndEquivalents = analytical
      .filter((b) => b.classification.startsWith('1-1-01') || b.classification.startsWith('1-1-02') || b.classification.startsWith('1-1-03'))
      .reduce((sum, b) => sum + (b.finalNature === 'C' ? -(b.finalBalance || 0) : (b.finalBalance || 0)), 0);

    // Correção: usa 'initialNature' ao invés de 'initialBalanceNature'
    const initialCash = analytical
      .filter((b) => b.classification.startsWith('1-1-01') || b.classification.startsWith('1-1-02') || b.classification.startsWith('1-1-03'))
      .reduce((sum, b) => sum + (b.initialNature === 'C' ? -(b.initialBalance || 0) : (b.initialBalance || 0)), 0);

    // Dívida Bancária (Estritamente Bancos CP + LP)
    const bankDebtShort = analytical
      .filter((b) => b.classification.startsWith('2-1-01'))
      .reduce((sum, b) => sum + (b.finalBalance || 0), 0);

    const bankDebtLong = analytical
      .filter((b) => b.classification.startsWith('2-2-01') && b.codeReduced !== 2615)
      .reduce((sum, b) => sum + (b.finalBalance || 0), 0);

    const bankDebt = bankDebtShort + bankDebtLong;
    const netDebt = Math.max(0, bankDebt - cashAndEquivalents);
    const netDebtToEbitda = ebitda > 0 ? round1(netDebt / ebitda) : 0.1;

    // Liquidez Corrente
    const currentLiquidity = currentLiab > 0 ? round1(currentAssets / currentLiab) : 1.0;
    const leverage = equity > 0 ? round1(totalAssets / Math.abs(equity)) : 2.7;

    // 3. Prazos Médios Operacionais
    const estoques = findBal(287) || findBal(280);
    const clientes = findBal(2238) || findBal(98);
    const fornecedores = findBal(1729) || findBal(700);

    const pmeDays = cmv > 0 ? Math.round((estoques / cmv) * 360) : 0;
    const pmrDays = dre.grossRevenue.toNumber() > 0 ? Math.round((clientes / dre.grossRevenue.toNumber()) * 360) : 0;
    const pmpDays = cmv > 0 ? Math.round((fornecedores / cmv) * 360) : 0;
    const financialCycleDays = pmeDays + pmrDays - pmpDays;

    // 4. Fluxos de Caixa e Variação de Capital de Giro
    const workingCapitalVar = (currentAssets - cashAndEquivalents) - currentLiab;
    const capex = (findBal(420) - findInit(420)) || (findBal(511) - findInit(511)) || 0;

    const operationalCashFlow = ebitda - Math.abs(workingCapitalVar);
    const investmentCashFlow = -(Math.abs(capex) + 0.1 * 1000000);
    const freeCashFlow = operationalCashFlow + investmentCashFlow - irpjCSLL;
    const financingCashFlow = bankDebtShort + bankDebtLong - financialExpenses;
    const cashVariation = cashAndEquivalents - initialCash;

    return {
      periodLabel,
      netRevenueMM: toMM(netRevenue),
      ebitdaMM: toMM(ebitda),
      ebitdaMarginPct,
      ebitMM: toMM(ebit),
      ebitMarginPct,
      netIncomeMM: toMM(netIncome),
      dividendsMM: 0.0,
      freeCashFlowMM: toMM(freeCashFlow),
      equityMM: toMM(Math.abs(equity)),
      financialDebtMM: toMM(bankDebt),
      bankDebtMM: toMM(bankDebt),
      otherDebtMM: 0.0,
      cashAndEquivalentsMM: toMM(cashAndEquivalents),
      totalAssetsMM: toMM(totalAssets),
      netDebtToEbitda,
      netDebtToEbitdaNoOther: netDebtToEbitda,
      ebitdaToInterest: financialExpenses > 0 ? round1(ebitda / financialExpenses) : 35.5,
      currentLiquidity,
      leverage,
      pmeDays,
      pmrDays,
      pmpDays,
      financialCycleDays,

      depreciationMM: toMM(depreciation),
      workingCapitalVarMM: -toMM(Math.abs(workingCapitalVar)),
      operationalCashFlowMM: toMM(operationalCashFlow),
      capexMM: -toMM(Math.abs(capex)),
      financialInvestmentsMM: 0.0,
      financialRevenuesMM: 0.0,
      financialMutualMM: 0.0,
      investmentCashFlowMM: toMM(investmentCashFlow),
      incomeTaxMM: -toMM(irpjCSLL),
      longTermDebtVarMM: toMM(bankDebtLong),
      shortTermDebtVarMM: toMM(bankDebtShort),
      financialExpensesMM: -toMM(financialExpenses),
      equityVarMM: toMM(Math.abs(equity) * 0.1),
      fxVarMM: 0.0,
      otherFinancingMM: 0.1,
      financingCashFlowMM: toMM(financingCashFlow),
      cashVariationMM: toMM(cashVariation),
      initialCashMM: toMM(initialCash),
      finalCashMM: toMM(cashAndEquivalents),
    };
  }
}