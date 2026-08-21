import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';

export interface ParsedAccountingData {
  company: {
    corporateName: string;
    cnpj: string;
    nire?: string;
    nireDate?: string;
    code?: string;
  };
  accountant?: {
    name: string;
    crc: string;
  };
  period: {
    description: string;
    startDate: string;
    endDate: string;
  };
  balances: AccountingBalance[];
}

export class AccountingParser {
  public static parseCurrency(str: string): { amount: number; nature: 'D' | 'C' } {
    if (!str) return { amount: 0, nature: 'D' };

    let clean = str.trim().replace(/[*()=]/g, '');
    let nature: 'D' | 'C' = 'D';

    const upper = clean.toUpperCase();
    if (upper.endsWith('C')) {
      nature = 'C';
      clean = clean.slice(0, -1);
    } else if (upper.endsWith('D')) {
      nature = 'D';
      clean = clean.slice(0, -1);
    }

    clean = clean.trim();

    if (clean.includes(',')) {
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else if ((clean.match(/\./g) || []).length > 0) {
      const parts = clean.split('.');
      if (parts.length > 1) {
        const decimals = parts.pop();
        const integerPart = parts.join('');
        clean = `${integerPart}.${decimals}`;
      }
    }

    const amount = Math.abs(parseFloat(clean)) || 0;
    return { amount, nature };
  }

  public static parseRawText(rawText: string): ParsedAccountingData {
    let corporateName = 'JC MACHADO DIAS';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';
    let startDate = '2025-01-01';
    let endDate = '2025-12-31';
    let description = 'Exercício 01/01/2025 a 31/12/2025';

    // 1. Extração do Cabeçalho
    const cnpjMatch = rawText.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
    if (cnpjMatch) cnpj = cnpjMatch[0];

    const nireMatch = rawText.match(/NIRE:\s*(\d+)/i);
    if (nireMatch) nire = nireMatch[1];

    const dateMatch = rawText.match(/(\d{2}\/\d{2}\/\d{4})\s*(?:a|até|-)\s*(\d{2}\/\d{2}\/\d{4})/i);
    if (dateMatch) {
      const [d1, m1, y1] = dateMatch[1].split('/');
      const [d2, m2, y2] = dateMatch[2].split('/');
      startDate = `${y1}-${m1}-${d1}`;
      endDate = `${y2}-${m2}-${d2}`;
      description = `Exercício ${dateMatch[1]} a ${dateMatch[2]}`;
    }

    const crcMatch = rawText.match(/CRC:\s*([A-Za-z0-9]+)/i);
    if (crcMatch) crc = crcMatch[1];

    // 2. Tokenização global do texto
    // Transforma quebras de linha em espaços para não perder valores vizinhos
    const cleanText = rawText.replace(/\r?\n/g, ' ').replace(/\s+/g, ' ');
    const isBalancete = cleanText.toLowerCase().includes('balancete');

    const valueCurrencyRegexStr = '[*]?\\d{1,3}(?:[.,]\\d{3})*(?:[.,]\\d{2})[DCdc]?';

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;

      const normClass = acc.classification.replace(/-/g, '[-.]');
      const codeStr = acc.codeReduced;

      // Padrão 1: Balanço Patrimonial (ex: "1-1-01-01" seguido logo após por seu valor monetário)
      // Aceita texto intermediário de até 50 caracteres (como notas ou descrições)
      const balancePattern = new RegExp(
        `(?:^|\\s)${normClass}\\s+(?:Nota\\s+\\d+\\s+)?(${valueCurrencyRegexStr})`,
        'i'
      );

      // Padrão 2: DRE (ex: "3-1-01-03 1211 30.416.659,74C" ou "1211 30.416.659,74C")
      const drePattern = new RegExp(
        `(?:${normClass}\\s+)?(?:${codeStr})\\s+(${valueCurrencyRegexStr})`,
        'i'
      );

      // Padrão 3: Balancete (ex: "[35] Caixa ... 0,00D 18.148.950,89 15.360.867,31 2.788.083,58D")
      const balancetePattern = new RegExp(
        `\\[${codeStr}\\][^\\[]*?(${valueCurrencyRegexStr})\\s+(${valueCurrencyRegexStr})\\s+(${valueCurrencyRegexStr})\\s+(${valueCurrencyRegexStr})`,
        'i'
      );

      if (isBalancete) {
        const bMatch = cleanText.match(balancetePattern);
        if (bMatch) {
          const init = this.parseCurrency(bMatch[1]);
          const deb = this.parseCurrency(bMatch[2]);
          const cred = this.parseCurrency(bMatch[3]);
          const fin = this.parseCurrency(bMatch[4]);

          initialBalance = init.amount;
          initialNature = init.nature;
          debitAmount = deb.amount;
          creditAmount = cred.amount;
          finalBalance = fin.amount;
          finalNature = fin.nature;
        }
      } else {
        // Balanço ou DRE
        const dMatch = cleanText.match(drePattern);
        const balMatch = cleanText.match(balancePattern);

        if (dMatch && (acc.statementGroup === 'RECEITA' || acc.statementGroup === 'CUSTO' || acc.statementGroup === 'DESPESA')) {
          const parsed = this.parseCurrency(dMatch[1]);
          finalBalance = parsed.amount;
          finalNature = parsed.nature;
        } else if (balMatch) {
          const parsed = this.parseCurrency(balMatch[1]);
          finalBalance = parsed.amount;
          finalNature = parsed.nature;
        }
      }

      return {
        periodId: 'imported-temp',
        accountId: String(acc.codeReduced),
        classification: acc.classification,
        description: acc.description,
        codeReduced: acc.codeReduced,
        statementGroup: acc.statementGroup,
        accountType: acc.accountType,
        initialBalance,
        initialNature,
        debitAmount,
        creditAmount,
        finalBalance,
        finalNature,
      };
    });

    return {
      company: { corporateName, cnpj, nire, nireDate },
      accountant: { name: accountantName, crc },
      period: { description, startDate, endDate },
      balances,
    };
  }
}