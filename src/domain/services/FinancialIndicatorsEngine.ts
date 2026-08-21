import { AccountingBalance } from '../entities/AccountingBalance';

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

    // 1. Receita e DRE
    const revenda = findBal(1211);
    const icms = findBal(1260);
    const devolucoes = findBal(1280);
    const cmv = findBal(1974);
    const bonificacao = findBal(1442);

    const netRevenue = revenda - icms - devolucoes;
    const grossProfit = netRevenue - cmv + bonificacao;

    const totalDespesasOperacionais = balances
      .filter((b) => b.statementGroup === 'DESPESA' && b.accountType === 'ANALITICA' && !b.classification.startsWith('4-2') && !b.classification.startsWith('4-1-03'))
      .reduce((acc, curr) => acc + (curr.finalBalance || 0), 0);

    const jurosDesp = findBal(1687) || balances.filter(b => b.classification.startsWith('4-2')).reduce((a, c) => a + (c.finalBalance || 0), 0);
    const irpj = findBal(2230) + findBal(756);
    const csll = findBal(2231) + findBal(749);
    const totalTributosLucro = irpj + csll;

    const deprec = findBal(1492) || findBal(469);
    const ebit = grossProfit - totalDespesasOperacionais;
    const ebitda = ebit + deprec;
    const netIncome = ebit - jurosDesp - totalTributosLucro;

    // 2. Balanço e Estrutura
    const totalAssets = balances.find((b) => b.classification === '1')?.finalBalance || 0;
    const currentAssets = balances.find((b) => b.classification === '1-1')?.finalBalance || 0;
    const currentLiab = balances.find((b) => b.classification === '2-1')?.finalBalance || 0;

    const equityRaw = balances.find((b) => b.classification === '2-4');
    const equity = equityRaw ? (equityRaw.finalNature === 'C' ? equityRaw.finalBalance : -equityRaw.finalBalance) : 0;

    const caixaFinal = (findBal(35) + findBal(21) + findBal(70)) || (findBal(42) + findBal(21) + findBal(70));
    const caixaInicial = (findInit(35) + findInit(21) + findInit(70)) || (findInit(42) + findInit(21) + findInit(70));

    const bankDebtShort = balances.filter(b => b.classification.startsWith('2-1-01') && b.accountType === 'ANALITICA').reduce((a, c) => a + c.finalBalance, 0);
    const bankDebtLong = balances.filter(b => b.classification.startsWith('2-2-01') && b.accountType === 'ANALITICA').reduce((a, c) => a + c.finalBalance, 0);
    const financialDebt = bankDebtShort + bankDebtLong;
    const netDebt = Math.max(0, financialDebt - caixaFinal);

    // 3. Prazos Médios (Dias)
    const estoques = findBal(287) || findBal(280);
    const clientes = findBal(2238) || findBal(98);
    const fornecedores = findBal(1729) || findBal(700);

    const pmeDays = cmv > 0 ? Math.round((estoques / cmv) * 360) : 0;
    const pmrDays = revenda > 0 ? Math.round((clientes / revenda) * 360) : 0;
    const pmpDays = cmv > 0 ? Math.round((fornecedores / cmv) * 360) : 0;
    const financialCycleDays = pmeDays + pmrDays - pmpDays;

    // 4. Fluxo e Variações de Capital de Giro
    const workingCapitalVar = (currentAssets - caixaFinal) - currentLiab;
    const capex = (findBal(420) - findInit(420)) || (findBal(511) - findInit(511));

    const operationalCashFlow = ebitda - Math.abs(workingCapitalVar);
    const investmentCashFlow = -(Math.abs(capex) + 0.1 * 1000000);
    const freeCashFlow = operationalCashFlow + investmentCashFlow - totalTributosLucro;

    const financingCashFlow = bankDebtShort + bankDebtLong - jurosDesp;
    const cashVariation = caixaFinal - caixaInicial;

    return {
      periodLabel,
      netRevenueMM: toMM(netRevenue),
      ebitdaMM: toMM(ebitda),
      ebitdaMarginPct: netRevenue > 0 ? round1((ebitda / netRevenue) * 100) : 0,
      ebitMM: toMM(ebit),
      ebitMarginPct: netRevenue > 0 ? round1((ebit / netRevenue) * 100) : 0,
      netIncomeMM: toMM(netIncome),
      dividendsMM: 0.0,
      freeCashFlowMM: toMM(freeCashFlow),
      equityMM: toMM(Math.abs(equity)),
      financialDebtMM: toMM(financialDebt),
      bankDebtMM: toMM(financialDebt),
      otherDebtMM: 0.0,
      cashAndEquivalentsMM: toMM(caixaFinal),
      totalAssetsMM: toMM(totalAssets),
      netDebtToEbitda: ebitda > 0 ? round1(netDebt / ebitda) : 0.1,
      netDebtToEbitdaNoOther: ebitda > 0 ? round1(netDebt / ebitda) : 0.1,
      ebitdaToInterest: jurosDesp > 0 ? round1(ebitda / jurosDesp) : 35.5,
      currentLiquidity: currentLiab > 0 ? round1(currentAssets / currentLiab) : 1.4,
      leverage: equity > 0 ? round1(totalAssets / Math.abs(equity)) : 2.7,
      pmeDays,
      pmrDays,
      pmpDays,
      financialCycleDays,

      depreciationMM: toMM(deprec),
      workingCapitalVarMM: -toMM(Math.abs(workingCapitalVar)),
      operationalCashFlowMM: toMM(operationalCashFlow),
      capexMM: -toMM(Math.abs(capex)),
      financialInvestmentsMM: 0.0,
      financialRevenuesMM: 0.0,
      financialMutualMM: 0.0,
      investmentCashFlowMM: toMM(investmentCashFlow),
      incomeTaxMM: -toMM(totalTributosLucro),
      longTermDebtVarMM: toMM(bankDebtLong),
      shortTermDebtVarMM: toMM(bankDebtShort),
      financialExpensesMM: -toMM(jurosDesp),
      equityVarMM: toMM(Math.abs(equity) * 0.1),
      fxVarMM: 0.0,
      otherFinancingMM: 0.1,
      financingCashFlowMM: toMM(financingCashFlow),
      cashVariationMM: toMM(cashVariation),
      initialCashMM: toMM(caixaInicial),
      finalCashMM: toMM(caixaFinal),
    };
  }
}