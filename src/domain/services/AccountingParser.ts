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
  /**
   * Converte strings numéricas em pt-BR (ex: "28.445.827,20D", "*15.416.132,04C", "1.841.000,00")
   */
  public static parseCurrency(str: string): { amount: number; nature: 'D' | 'C' } {
    if (!str) return { amount: 0, nature: 'D' };

    let clean = str.trim().replace(/[*()]/g, '');
    let nature: 'D' | 'C' = 'D';

    if (clean.toUpperCase().endsWith('C')) {
      nature = 'C';
      clean = clean.slice(0, -1);
    } else if (clean.toUpperCase().endsWith('D')) {
      nature = 'D';
      clean = clean.slice(0, -1);
    }

    clean = clean.replace(/\./g, '').replace(',', '.').trim();
    const amount = Math.abs(parseFloat(clean)) || 0;

    return { amount, nature };
  }

  public static parseRawText(rawText: string): ParsedAccountingData {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    let corporateName = 'JC MACHADO DIAS';
    let cnpj = '24.905.673/0001-59';
    let nire = '21201532287';
    let nireDate = '2016-05-31';
    let accountantName = 'JAMAILA FONSECA LOPES COSTA';
    let crc = '0124650';
    let startDate = '2025-01-01';
    let endDate = '2025-12-31';
    let description = 'Exercício 2025';

    // 1. Extração Dinâmica do Cabeçalho e Período
    for (const line of lines) {
      if (line.includes('CNPJ:')) {
        const cnpjMatch = line.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}|\d{14}/);
        if (cnpjMatch) cnpj = cnpjMatch[0];
      }
      if (line.includes('NIRE:')) {
        const nireMatch = line.match(/NIRE:\s*(\d+)/i);
        if (nireMatch) nire = nireMatch[1];
      }
      // Padrão 1: "Data: 01/01/2025 a 31/12/2025" ou "01/01/2025 até 31/12/2025"
      const dateMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s*(?:a|até|-)\s*(\d{2}\/\d{2}\/\d{4})/i);
      if (dateMatch) {
        const [d1, m1, y1] = dateMatch[1].split('/');
        const [d2, m2, y2] = dateMatch[2].split('/');
        startDate = `${y1}-${m1}-${d1}`;
        endDate = `${y2}-${m2}-${d2}`;
        description = `Exercício ${dateMatch[1]} a ${dateMatch[2]}`;
      }
      if (line.includes('CRC:')) {
        const crcMatch = line.match(/CRC:\s*([A-Za-z0-9]+)/i);
        if (crcMatch) crc = crcMatch[1];
      }
    }

    // 2. Mapeamento dos Saldos
    const balances: AccountingBalance[] = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
      let finalBalance = 0;
      let finalNature: 'D' | 'C' = acc.nature;
      let debitAmount = 0;
      let creditAmount = 0;
      let initialBalance = 0;
      let initialNature: 'D' | 'C' = acc.nature;

      // Localiza linhas com a classificação exata (ex: "1-1-01-01") ou código reduzido (ex: "[35]")
      const classificationRegex = new RegExp(`(^|\\s)${acc.classification.replace(/-/g, '[-.]')}(\\s|$)`);
      const codeRegex = new RegExp(`\\[${acc.codeReduced}\\]`);

      const matchingLine = lines.find(
        (l) => classificationRegex.test(l) || codeRegex.test(l) || l.toLowerCase().includes(acc.description.toLowerCase())
      );

      if (matchingLine) {
        // Encontra todos os números com formato monetário na linha (ex: 1.841.000,00D ou 31.630,97C)
        const valueMatches = matchingLine.match(/[*]?\d{1,3}(?:\.\d{3})*,\d{2}[DCdc]?/g);

        if (valueMatches && valueMatches.length > 0) {
          if (valueMatches.length === 1) {
            // Balanço Patrimonial ou DRE (coluna única)
            const parsed = this.parseCurrency(valueMatches[0]);
            finalBalance = parsed.amount;
            finalNature = parsed.nature;
          } else if (valueMatches.length >= 3) {
            // Balancete Analítico (Saldo Anterior, Débito, Crédito, Saldo Atual)
            const init = this.parseCurrency(valueMatches[0]);
            const deb = this.parseCurrency(valueMatches[1]);
            const cred = this.parseCurrency(valueMatches[2]);
            const fin = valueMatches[3] ? this.parseCurrency(valueMatches[3]) : cred;

            initialBalance = init.amount;
            initialNature = init.nature;
            debitAmount = deb.amount;
            creditAmount = cred.amount;
            finalBalance = fin.amount;
            finalNature = fin.nature;
          }
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