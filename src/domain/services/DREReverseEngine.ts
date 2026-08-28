import { AccountingBalance } from '../entities/AccountingBalance';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../entities/DefaultChartAccounts';
import { AccountingEngine } from './AccountingEngine';

export interface ReverseGenerationOptions {
  receivableRatio?: number; // % que foi a prazo (Clientes) vs à vista (Bancos/Caixa)
  payableRatio?: number;    // % de despesas a pagar (Fornecedores) vs liquidadas
  periodOpeningBalances?: AccountingBalance[]; // Saldos anteriores se houver
}

export class DREReverseEngine {
  public static generateBalancesFromDRE(
    dreAccounts: { codeReduced?: number; classification?: string; amount: number; description?: string }[],
    options: ReverseGenerationOptions = {}
  ): AccountingBalance[] {
    const receivableRatio = options.receivableRatio ?? 0.30; // 30% a prazo
    const payableRatio = options.payableRatio ?? 0.20;       // 20% a pagar

    // Mapa base com todas as contas zeradas
    const balanceMap = new Map<number, AccountingBalance>();
    DEFAULT_CHART_OF_ACCOUNTS.forEach((acc) => {
      balanceMap.set(acc.codeReduced, {
        periodId: 'reverse-gen',
        accountId: String(acc.codeReduced),
        classification: acc.classification,
        description: acc.description,
        codeReduced: acc.codeReduced,
        statementGroup: acc.statementGroup,
        accountType: acc.accountType,
        initialBalance: 0,
        initialNature: acc.nature,
        debitAmount: 0,
        creditAmount: 0,
        finalBalance: 0,
        finalNature: acc.nature,
      });
    });

    let totalRevenue = 0;
    let totalICMS = 0;
    let totalPIS = 0;
    let totalCOFINS = 0;
    let totalCMV = 0;
    let totalDepreciation = 0;
    let totalPayrollExpenses = 0;
    let totalAdminExpenses = 0;

    // 1. Mapear valores da DRE para as contas de Resultado
    for (const item of dreAccounts) {
      let target = item.codeReduced ? balanceMap.get(item.codeReduced) : undefined;
      if (!target && item.classification) {
        target = Array.from(balanceMap.values()).find((b) => b.classification === item.classification);
      }

      if (target) {
        if (target.statementGroup === 'RECEITA') {
          target.creditAmount = item.amount;
          totalRevenue += item.amount;
        } else {
          target.debitAmount = item.amount;
          if (target.classification.startsWith('3-2-01-03')) totalICMS += item.amount;
          else if (target.classification.startsWith('3-2-01-04')) totalCOFINS += item.amount;
          else if (target.classification.startsWith('3-2-01-05')) totalPIS += item.amount;
          else if (target.classification.startsWith('3-2-03')) totalCMV += item.amount;
          else if (target.classification.startsWith('4-1-02-29')) totalDepreciation += item.amount;
          else if (target.classification.startsWith('4-1-01')) totalPayrollExpenses += item.amount;
          else if (target.classification.startsWith('4-1-02')) totalAdminExpenses += item.amount;
        }
      }
    }

    // 2. Partidas Dobradas: Ativo
    const cashAndBank = totalRevenue * (1 - receivableRatio);
    const customers = totalRevenue * receivableRatio;

    // Bancos / Aplicação
    const bankAcc = balanceMap.get(70);
    if (bankAcc) bankAcc.debitAmount = Math.max(cashAndBank - (totalPayrollExpenses + totalAdminExpenses * 0.5), 0);

    // Clientes a Receber
    const custAcc = balanceMap.get(2238) || balanceMap.get(98);
    if (custAcc) custAcc.debitAmount = customers;

    // Estoques (Saída de CMV)
    const stockAcc = balanceMap.get(287) || balanceMap.get(280);
    if (stockAcc) {
      stockAcc.initialBalance = totalCMV * 1.25; // Suposição de estoque inicial
      stockAcc.creditAmount = totalCMV;
    }

    // Depreciação Acumulada
    if (totalDepreciation > 0) {
      const depAcc = balanceMap.get(469);
      if (depAcc) depAcc.creditAmount = totalDepreciation;
    }

    // 3. Partidas Dobradas: Passivo
    // Impostos a Recolher (ICMS, PIS, COFINS)
    const icmsRec = balanceMap.get(735);
    if (icmsRec) icmsRec.creditAmount = totalICMS;

    const pisRec = balanceMap.get(770);
    if (pisRec) pisRec.creditAmount = totalPIS;

    const cofinsRec = balanceMap.get(777);
    if (cofinsRec) cofinsRec.creditAmount = totalCOFINS;

    // Fornecedores
    const provAcc = balanceMap.get(1729) || balanceMap.get(700);
    if (provAcc) provAcc.creditAmount = (totalCMV + totalAdminExpenses) * payableRatio;

    // Salários a Pagar
    const salAcc = balanceMap.get(819) || balanceMap.get(812);
    if (salAcc) salAcc.creditAmount = totalPayrollExpenses * 0.15;

    // 4. Apurar Lucro Líquido e transferir para o PL
    const balancesList = Array.from(balanceMap.values());
    const dreResult = AccountingEngine.calculateDRE(balancesList);
    const netProfit = dreResult.netIncome.toNumber();

    const plResultAcc = balanceMap.get(1029); // 2-4-08-01 Lucro/Prejuízo do Período
    if (plResultAcc) {
      if (netProfit >= 0) {
        plResultAcc.creditAmount = netProfit;
        plResultAcc.finalNature = 'C';
      } else {
        plResultAcc.debitAmount = Math.abs(netProfit);
        plResultAcc.finalNature = 'D';
      }
      plResultAcc.finalBalance = Math.abs(netProfit);
    }

    // 5. Recalcular saldos finais de todas as contas
    balancesList.forEach((acc) => {
      if (acc.accountType === 'ANALITICA' && acc.codeReduced !== 1029) {
        const res = AccountingEngine.calculateFinalBalance(
          acc.initialBalance,
          acc.initialNature,
          acc.debitAmount,
          acc.creditAmount,
          acc.finalNature
        );
        acc.finalBalance = res.balance;
        acc.finalNature = res.nature;
      }
    });

    return balancesList;
  }
}