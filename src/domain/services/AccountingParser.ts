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
    const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let corporateName = 'JC MACHADO DIAS';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';
    let startDate = '2025-01-01';
    let endDate = '2025-12-31';
    let description = 'Exercício 01/01/2025 a 31/12/2025';

    for (const line of rawLines) {
      if (line.includes('CNPJ:')) {
        const m = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
        if (m) cnpj = m[0];
      }
      if (line.includes('NIRE:')) {
        const m = line.match(/NIRE:\s*(\d+)/i);
        if (m) nire = m[1];
      }
      const dMatch = line.match(/(\d{2})\/(\d{2})\/(\d{4})\s*(?:a|até|-)\s*(\d{2})\/(\d{2})\/(\d{4})/i);
      if (dMatch) {
        const [, d1, m1, y1, d2, m2, y2] = dMatch;
        startDate = `${y1}-${m1}-${d1}`;
        endDate = `${y2}-${m2}-${d2}`;
        description = `Exercício ${d1}/${m1}/${y1} a ${d2}/${m2}/${y2}`;
      }
      if (line.includes('CRC:')) {
        const m = line.match(/CRC:\s*([A-Za-z0-9]+)/i);
        if (m) crc = m[1];
      }
    }

    const isBalancete = rawLines.some((l) => l.toLowerCase().includes('balancete'));
    const valueCurrencyRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;

    const valuesByCode = new Map<number, { amount: number; nature: 'D' | 'C' }>();
    const valuesByClass = new Map<string, { amount: number; nature: 'D' | 'C' }>();
    const balanceteMap = new Map<number, { initial: number; initialNat: 'D' | 'C'; deb: number; cred: number; final: number; finalNat: 'D' | 'C' }>();

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];

      // Balancete: [código]
      const bMatch = line.match(/\[(\d+)\]/);
      if (bMatch) {
        const code = parseInt(bMatch[1], 10);
        const chunk = rawLines.slice(i, i + 3).join(' ');
        const matches = chunk.match(valueCurrencyRegex);
        if (matches && matches.length >= 4) {
          balanceteMap.set(code, {
            initial: this.parseCurrency(matches[0]).amount,
            initialNat: this.parseCurrency(matches[0]).nature,
            deb: this.parseCurrency(matches[1]).amount,
            cred: this.parseCurrency(matches[2]).amount,
            final: this.parseCurrency(matches[3]).amount,
            finalNat: this.parseCurrency(matches[3]).nature,
          });
        }
      }

      // DRE: Classificação (3-x ou 4-x) + Código Reduzido + Valor
      const dreMatch = line.match(/([34]-[0-9]+(?:-[0-9]+)*)\s+(\d{3,5})\s+([*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?)/);
      if (dreMatch) {
        const cls = dreMatch[1].replace(/\./g, '-');
        const code = parseInt(dreMatch[2], 10);
        const val = this.parseCurrency(dreMatch[3]);
        valuesByClass.set(cls, val);
        valuesByCode.set(code, val);
      }

      // Balanço Patrimonial: Classificação
      const balClassMatch = line.match(/(?:^|\s)(1(?:-[0-9]+)*|2(?:-[0-9]+)*)(?:\s+|$)/);
      if (balClassMatch) {
        const cls = balClassMatch[1].replace(/\./g, '-');
        let valMatches = line.match(valueCurrencyRegex);
        if (!valMatches || valMatches.length === 0) {
          const nextBlock = rawLines.slice(i + 1, i + 4).join(' ');
          valMatches = nextBlock.match(valueCurrencyRegex);
        }
        if (valMatches && valMatches.length > 0) {
          valuesByClass.set(cls, this.parseCurrency(valMatches[0]));
        }
      }
    }

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;

      const normClass = acc.classification.replace(/\./g, '-');

      if (isBalancete && balanceteMap.has(acc.codeReduced)) {
        const b = balanceteMap.get(acc.codeReduced)!;
        initialBalance = b.initial;
        initialNature = b.initialNat;
        debitAmount = b.deb;
        creditAmount = b.cred;
        finalBalance = b.final;
        finalNature = b.finalNat;
      } else if (valuesByCode.has(acc.codeReduced)) {
        const v = valuesByCode.get(acc.codeReduced)!;
        finalBalance = v.amount;
        finalNature = v.nature;
      } else if (valuesByClass.has(normClass)) {
        const v = valuesByClass.get(normClass)!;
        finalBalance = v.amount;
        finalNature = v.nature;
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