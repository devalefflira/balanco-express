import * as XLSX from 'xlsx';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine } from './AccountingEngine';

export interface SheetInfo {
  name: string;
  rowCount: number;
}

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
  recognizedCount: number;
  availableSheets?: SheetInfo[];
}

export interface ParsedDREItem {
  codeReduced?: number;
  classification?: string;
  description: string;
  amount: number;
}

export class AccountingParser {
  public static parseCurrency(val: any): { amount: number; nature: 'D' | 'C' } {
    if (val === null || val === undefined || val === '') return { amount: 0, nature: 'D' };

    if (typeof val === 'number') {
      return { amount: Math.abs(val), nature: val < 0 ? 'C' : 'D' };
    }

    let clean = String(val).trim().replace(/[*()=R$\s]/g, '');
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
    } else if ((clean.match(/\./g) || []).length > 1) {
      const parts = clean.split('.');
      const decimals = parts.pop();
      const integerPart = parts.join('');
      clean = `${integerPart}.${decimals}`;
    }

    const amount = Math.abs(parseFloat(clean)) || 0;
    return { amount, nature };
  }

  public static inspectExcelSheets(buffer: ArrayBuffer): SheetInfo[] {
    const workbook = XLSX.read(buffer, { type: 'array' });
    return workbook.SheetNames.map((name) => {
      const sheet = workbook.Sheets[name];
      const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      return {
        name,
        rowCount: data.length,
      };
    });
  }

  public static extractDates(text: string, filenameHint: string = '', sheetNameHint: string = ''): { startDate: string; endDate: string; description: string } {
    const combined = `${filenameHint} ${sheetNameHint} ${text}`;

    const rangeMatch = combined.match(/(\d{2})[./\-](\d{2})[./\-](\d{4})\s*(?:a|até|ate|-)\s*(\d{2})[./\-](\d{2})[./\-](\d{4})/i);
    if (rangeMatch) {
      const [, d1, m1, y1, d2, m2, y2] = rangeMatch;
      return {
        startDate: `${y1}-${m1}-${d1}`,
        endDate: `${y2}-${m2}-${d2}`,
        description: `Exercício de ${d1}/${m1}/${y1} a ${d2}/${m2}/${y2}`,
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
        description: `${quarter}º Trimestre de 01/01/${year} a ${q.dEnd}/${q.mEnd}/${year}`,
      };
    }

    const yearMatch = combined.match(/(?:^|[^\d])(20\d{2})(?:[^\d]|$)/);
    if (yearMatch) {
      const y = yearMatch[1];
      return {
        startDate: `${y}-01-01`,
        endDate: `${y}-12-31`,
        description: `Exercício de 01/01/${y} a 31/12/${y}`,
      };
    }

    return {
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      description: 'Exercício de 01/01/2024 a 31/12/2024',
    };
  }

  public static parseExcelBuffer(buffer: ArrayBuffer, fileName: string = '', targetSheetName?: string): ParsedAccountingData {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    const selectedSheet = targetSheetName && sheetNames.includes(targetSheetName) ? targetSheetName : sheetNames[0];
    const sheet = workbook.Sheets[selectedSheet];
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const availableSheets: SheetInfo[] = sheetNames.map((name) => ({
      name,
      rowCount: (XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }) as any[][]).length,
    }));

    let corporateName = 'JC MACHADO DIAS LTDA';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';

    const fullText = rawMatrix.map((row) => row.join(' ')).join('\n');
    const { startDate, endDate, description } = this.extractDates(fullText, fileName, selectedSheet);

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

    // Localiza linha de cabeçalho
    let headerIdx = -1;
    let colCode = -1;
    let colInit = -1;
    let colDeb = -1;
    let colCred = -1;
    let colFinal = -1;

    for (let i = 0; i < Math.min(rawMatrix.length, 10); i++) {
      const rowLower = rawMatrix[i].map((c) => String(c).toLowerCase().trim());
      const hasCode = rowLower.some((c) => c.includes('cód') || c.includes('cod') || c.includes('conta'));
      const hasDeb = rowLower.some((c) => c.includes('débito') || c.includes('debito'));
      const hasCred = rowLower.some((c) => c.includes('crédito') || c.includes('credito'));

      if (hasCode && (hasDeb || hasCred)) {
        headerIdx = i;
        rowLower.forEach((col, cIdx) => {
          if (col.includes('cód') || col.includes('cod')) colCode = cIdx;
          if (col.includes('saldo anterior') || col.includes('anterior')) colInit = cIdx;
          if (col.includes('débito') || col.includes('debito')) colDeb = cIdx;
          if (col.includes('crédito') || col.includes('credito')) colCred = cIdx;
          if (col.includes('saldo atual') || col.includes('atual') || col.includes('final')) colFinal = cIdx;
        });
        break;
      }
    }

    const balanceteMap = new Map<number, { initial: number; initialNat: 'D' | 'C'; deb: number; cred: number; final: number; finalNat: 'D' | 'C' }>();
    const valueCurrencyRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;

    const dataRows = headerIdx !== -1 ? rawMatrix.slice(headerIdx + 1) : rawMatrix;

    for (const row of dataRows) {
      if (!row || row.length === 0) continue;
      const rowStr = row.join(' ');

      let code: number | null = null;

      // 1. Extração por coluna mapeada
      if (colCode !== -1 && row[colCode] !== undefined && row[colCode] !== '') {
        const parsed = parseInt(String(row[colCode]).replace(/\D/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) code = parsed;
      }

      // 2. Fallback por regex [code] ou início numérico
      if (code === null) {
        const codeMatch = rowStr.match(/\[(\d+)\]/) || rowStr.match(/^(\d{1,5})\b/);
        if (codeMatch) code = parseInt(codeMatch[1], 10);
      }

      if (code !== null) {
        // Se temos colunas mapeadas por cabeçalho
        if (colDeb !== -1 && colCred !== -1) {
          const init = colInit !== -1 ? this.parseCurrency(row[colInit]) : { amount: 0, nature: 'D' as const };
          const deb = this.parseCurrency(row[colDeb]);
          const cred = this.parseCurrency(row[colCred]);
          const fin = colFinal !== -1 ? this.parseCurrency(row[colFinal]) : { amount: 0, nature: 'D' as const };

          balanceteMap.set(code, {
            initial: init.amount,
            initialNat: init.nature,
            deb: deb.amount,
            cred: cred.amount,
            final: fin.amount,
            finalNat: fin.nature,
          });
        } else {
          // Fallback por extração de valores em lote na linha
          const numbers = rowStr.match(valueCurrencyRegex);
          if (numbers && numbers.length >= 2) {
            const deb = this.parseCurrency(numbers[numbers.length - 2]);
            const cred = this.parseCurrency(numbers[numbers.length - 1]);
            balanceteMap.set(code, {
              initial: 0,
              initialNat: 'D',
              deb: deb.amount,
              cred: cred.amount,
              final: 0,
              finalNat: 'D',
            });
          }
        }
      }
    }

    let recognizedCount = 0;

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;

      const found = balanceteMap.get(acc.codeReduced);
      if (found) {
        recognizedCount++;
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
        finalBalance = found.final > 0 ? found.final : calc.balance;
        finalNature = found.finalNat || calc.nature;
      }

      return {
        id: crypto.randomUUID(),
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
      recognizedCount,
      availableSheets,
    };
  }

  public static parseDREExcel(buffer: ArrayBuffer, fileName: string = ''): {
    company: { corporateName: string; cnpj: string; nire?: string; nireDate?: string };
    accountant: { name: string; crc: string };
    period: { description: string; startDate: string; endDate: string };
    items: ParsedDREItem[];
  } {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawMatrix: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    const fullText = rawMatrix.map((r) => r.join(' ')).join('\n');
    const { startDate, endDate, description } = this.extractDates(fullText, fileName);

    let corporateName = 'JC MACHADO DIAS LTDA';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';

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

    const items: ParsedDREItem[] = [];
    const valueRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;

    for (const row of rawMatrix) {
      const rowStr = row.join(' ');
      const codeMatch = rowStr.match(/\[(\d+)\]/) || rowStr.match(/^(\d{3,5})\b/);
      const classMatch = rowStr.match(/([34]-[0-9-]+)/);

      const codeReduced = codeMatch ? parseInt(codeMatch[1], 10) : undefined;
      const classification = classMatch ? classMatch[1] : undefined;

      const matches = rowStr.match(valueRegex);
      if (matches && matches.length > 0) {
        const parsedVal = this.parseCurrency(matches[matches.length - 1]);
        if (parsedVal.amount > 0) {
          items.push({
            codeReduced,
            classification,
            description: row[0] ? String(row[0]).trim() : 'Conta DRE',
            amount: parsedVal.amount,
          });
        }
      }
    }

    return {
      company: { corporateName, cnpj, nire, nireDate },
      accountant: { name: 'JAMAILA FONSECA LOPES COSTA', crc: '0124650' },
      period: { description, startDate, endDate },
      items,
    };
  }

  public static parseRawText(rawText: string, fileName: string = ''): ParsedAccountingData {
    const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

    let corporateName = 'JC MACHADO DIAS LTDA';
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

    let recognizedCount = 0;

    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;

      const found = balanceteMap.get(acc.codeReduced);
      if (found) {
        recognizedCount++;
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
        id: crypto.randomUUID(),
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
      recognizedCount,
    };
  }

  public static parseDREText(rawText: string, fileName: string = ''): {
    company: { corporateName: string; cnpj: string; nire?: string; nireDate?: string };
    accountant: { name: string; crc: string };
    period: { description: string; startDate: string; endDate: string };
    items: ParsedDREItem[];
  } {
    const rawLines = rawText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const { startDate, endDate, description } = this.extractDates(rawText, fileName);

    let corporateName = 'JC MACHADO DIAS LTDA';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';

    for (const line of rawLines) {
      if (line.includes('CNPJ:')) {
        const m = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
        if (m) cnpj = m[0];
      }
      if (line.includes('NIRE:')) {
        const m = line.match(/NIRE:\s*(\d+)/i);
        if (m) nire = m[1];
      }
    }

    const items: ParsedDREItem[] = [];
    const valueRegex = /[*]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})[DCdc]?/g;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const classMatch = line.match(/([34]-[0-9-]+)/);
      const codeMatch = line.match(/\|\s*(\d{3,5})\s*\|/) || line.match(/\[(\d+)\]/);

      const classification = classMatch ? classMatch[1] : undefined;
      const codeReduced = codeMatch ? parseInt(codeMatch[1], 10) : undefined;

      const matches = line.match(valueRegex);
      if (matches && matches.length > 0) {
        const parsedVal = this.parseCurrency(matches[matches.length - 1]);
        if (parsedVal.amount > 0 && (classification || codeReduced)) {
          items.push({
            codeReduced,
            classification,
            description: line.split('|')[0]?.trim() || 'Conta DRE',
            amount: parsedVal.amount,
          });
        }
      }
    }

    return {
      company: { corporateName, cnpj, nire, nireDate },
      accountant: { name: 'JAMAILA FONSECA LOPES COSTA', crc: '0124650' },
      period: { description, startDate, endDate },
      items,
    };
  }
}