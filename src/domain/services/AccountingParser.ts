import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';
import * as XLSX from 'xlsx';

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
  public static parseCurrency(val: any): { amount: number; nature: 'D' | 'C' } {
    if (val === null || val === undefined) return { amount: 0, nature: 'D' };

    if (typeof val === 'number') {
      return { amount: Math.abs(val), nature: val < 0 ? 'C' : 'D' };
    }

    let clean = String(val).trim().replace(/[*()=]/g, '');
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

  private static extractDates(text: string, filenameHint: string = ''): { startDate: string; endDate: string; description: string } {
    const combined = `${filenameHint} ${text}`;

    const rangeMatch = combined.match(/(\d{2})[./\-](\d{2})[./\-](\d{4})\s*(?:a|até|ate|-)\s*(\d{2})[./\-](\d{2})[./\-](\d{4})/i);
    if (rangeMatch) {
      const [, d1, m1, y1, d2, m2, y2] = rangeMatch;
      return {
        startDate: `${y1}-${m1}-${d1}`,
        endDate: `${y2}-${m2}-${d2}`,
        description: `Exercício ${d1}/${m1}/${y1} a ${d2}/${m2}/${y2}`,
      };
    }

    const trimMatch = combined.match(/([1-4])\s*(?:T|trimestre|º\s*trimestre|o\s*trimestre)[_\-\s]*(\d{4})/i);
    if (trimMatch) {
      const quarter = parseInt(trimMatch[1], 10);
      const year = trimMatch[2];
      const ranges: Record<number, { start: string; end: string; dEnd: string; mEnd: string }> = {
        1: { start: `${year}-01-01`, end: `${year}-03-31`, dEnd: '31', mEnd: '03' },
        2: { start: `${year}-04-01`, end: `${year}-06-30`, dEnd: '30', mEnd: '06' },
        3: { start: `${year}-07-01`, end: `${year}-09-30`, dEnd: '30', mEnd: '09' },
        4: { start: `${year}-10-01`, end: `${year}-12-31`, dEnd: '31', mEnd: '12' },
      };
      const q = ranges[quarter] || ranges[1];
      return {
        startDate: q.start,
        endDate: q.end,
        description: `${quarter}º Trimestre 01/01/${year} a ${q.dEnd}/${q.mEnd}/${year}`,
      };
    }

    const singleMatch = combined.match(/(?:encerrado em|posi[cç][aã]o em|at[eé])\s*(\d{2})[./\-](\d{2})[./\-](\d{4})/i);
    if (singleMatch) {
      const [, d, m, y] = singleMatch;
      const startM = m === '03' ? '01' : (m === '06' ? '04' : (m === '09' ? '07' : '01'));
      return {
        startDate: `${y}-${startM}-01`,
        endDate: `${y}-${m}-${d}`,
        description: `Exercício 01/${startM}/${y} a ${d}/${m}/${y}`,
      };
    }

    const yearMatch = combined.match(/(?:^|[^\d])(20\d{2})(?:[^\d]|$)/);
    if (yearMatch) {
      const y = yearMatch[1];
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        description: `Exercício 01/01/${y} a 31/12/${y}`,
      };
    }

    return {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
      description: 'Exercício 01/01/2025 a 31/12/2025',
    };
  }

  public static parseExcelBuffer(buffer: ArrayBuffer, fileName: string = ''): ParsedAccountingData {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let corporateName = 'JC MACHADO DIAS';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';

    const fullText = rawMatrix.map((row) => row.join(' ')).join('\n');
    const { startDate, endDate, description } = this.extractDates(fullText, fileName);

    for (const row of rawMatrix) {
      const rowStr = row.join(' ');
      if (rowStr.includes('CNPJ')) {
        const m = rowStr.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
        if (m) cnpj = m[0];
      }
      if (rowStr.includes('NIRE')) {
        const m = rowStr.match(/NIRE:\s*(\d+)/i);
        if (m) nire = m[1];
      }
    }

    const balanceteMap = new Map<number, { initial: number; initialNat: 'D' | 'C'; deb: number; cred: number; final: number; finalNat: 'D' | 'C' }>();
    const valueCurrencyRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;

    for (const row of rawMatrix) {
      const rowStr = row.join(' ');
      const codeMatch = rowStr.match(/\[(\d+)\]/);
      if (codeMatch) {
        const code = parseInt(codeMatch[1], 10);
        const numbers = rowStr.match(valueCurrencyRegex);
        if (numbers && numbers.length >= 4) {
          const init = this.parseCurrency(numbers[0]);
          const deb = this.parseCurrency(numbers[1]);
          const cred = this.parseCurrency(numbers[2]);
          const fin = this.parseCurrency(numbers[3]);
          balanceteMap.set(code, {
            initial: init.amount,
            initialNat: init.nature,
            deb: deb.amount,
            cred: cred.amount,
            final: fin.amount,
            finalNat: fin.nature,
          });
        }
      }
    }

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;

      const found = balanceteMap.get(acc.codeReduced);
      if (found) {
        initialBalance = found.initial;
        initialNature = found.initialNat;
        debitAmount = found.deb;
        creditAmount = found.cred;

        // Calcula o saldo final matematicamente respeitando a regra de zeramento
        const calc = AccountingEngine.calculateFinalBalance(
          initialBalance,
          initialNature,
          debitAmount,
          creditAmount,
          acc.nature
        );
        finalBalance = calc.balance;
        finalNature = calc.nature;
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

  public static parseRawText(rawText: string, fileName: string = ''): ParsedAccountingData {
    const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let corporateName = 'JC MACHADO DIAS';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';

    const { startDate, endDate, description } = this.extractDates(rawText, fileName);

    for (const line of rawLines) {
      if (line.includes('CNPJ:')) {
        const m = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
        if (m) cnpj = m[0];
      }
      if (line.includes('NIRE:')) {
        const m = line.match(/NIRE:\s*(\d+)/i);
        if (m) nire = m[1];
      }
      if (line.includes('CRC:')) {
        const m = line.match(/CRC:\s*([A-Za-z0-9]+)/i);
        if (m) crc = m[1];
      }
    }

    const valueCurrencyRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;
    const balanceteMap = new Map<number, { initial: number; initialNat: 'D' | 'C'; deb: number; cred: number; final: number; finalNat: 'D' | 'C' }>();

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
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
    }

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;

      const found = balanceteMap.get(acc.codeReduced);
      if (found) {
        initialBalance = found.initial;
        initialNature = found.initialNat;
        debitAmount = found.deb;
        creditAmount = found.cred;

        const calc = AccountingEngine.calculateFinalBalance(
          initialBalance,
          initialNature,
          debitAmount,
          creditAmount,
          acc.nature
        );
        finalBalance = calc.balance;
        finalNature = calc.nature;
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