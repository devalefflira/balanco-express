'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine, BalanceSheetResult } from '@/domain/services/AccountingEngine';
import { AutoBalancer } from '@/domain/services/AutoBalancer';
import { AccountingRepository, SavedPeriodSummary } from '@/infrastructure/repositories/AccountingRepository';

export interface CompanyData {
  id?: string;
  code: string;
  corporateName: string;
  tradeName: string;
  cnpj: string;
  nire: string;
  nireDate: string;
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  representativeName: string;
  representativeCpf: string;
  representativeRole: string;
}

export interface AccountantData {
  id?: string;
  name: string;
  crc: string;
  cpf: string;
  role: string;
}

export interface AccountingPeriodData {
  id?: string;
  description: string;
  startDate: string;
  endDate: string;
  sourceType?: 'MANUAL' | 'IMPORTED';
}

interface AccountingContextType {
  balances: AccountingBalance[];
  period: AccountingPeriodData;
  company: CompanyData;
  accountant: AccountantData;
  balanceSheet: BalanceSheetResult;
  savedPeriods: SavedPeriodSummary[];
  isLoading: boolean;
  setPeriod: (period: AccountingPeriodData) => void;
  setCompany: (company: CompanyData) => void;
  setAccountant: (accountant: AccountantData) => void;
  updateBalance: (codeReduced: number, field: 'initialBalance' | 'debitAmount' | 'creditAmount' | 'finalBalance', value: number) => void;
  applyAutoBalance: (targetClassification?: string) => void;
  resetBalances: () => void;
  formatPeriodText: (format?: 'balance' | 'balancete') => string;
  saveCurrentBalances: (sourceType?: 'MANUAL' | 'IMPORTED') => Promise<string>;
  importBalancesAndSave: (importedBalances: AccountingBalance[], periodMeta: { description: string; startDate: string; endDate: string }, companyMeta?: any) => Promise<string>;
  loadPeriodById: (periodId: string) => Promise<void>;
  fetchSavedPeriods: () => Promise<void>;
  deleteSavedPeriod: (periodId: string) => Promise<void>;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repository = new AccountingRepository();
  const [isLoading, setIsLoading] = useState(false);
  const [savedPeriods, setSavedPeriods] = useState<SavedPeriodSummary[]>([]);

  const [company, setCompany] = useState<CompanyData>({
    code: '00463',
    corporateName: 'JC MACHADO DIAS',
    tradeName: 'PRIME DISTRIBUIDORA',
    cnpj: '24.905.673/0001-59',
    nire: '21201532287',
    nireDate: '2016-05-31',
    address: 'AVENIDA JK, 1208, Lote 1 A 4, Quadra 4 Fundos',
    neighborhood: 'Vila Santa Luzia',
    city: 'Bom Jesus das Selvas',
    state: 'MA',
    zipCode: '65395-000',
    representativeName: 'JOSE CARLOS MACHADO DIAS',
    representativeCpf: '196.018.244-72',
    representativeRole: 'Administrador',
  });

  const [accountant, setAccountant] = useState<AccountantData>({
    name: 'JAMAILA FONSECA LOPES COSTA',
    crc: '0124650',
    cpf: '024.650.373-40',
    role: 'Contador',
  });

  const [period, setPeriod] = useState<AccountingPeriodData>({
    description: 'Exercício 2025',
    startDate: '2025-01-01',
    endDate: '2025-12-31',
    sourceType: 'MANUAL',
  });

  const [balances, setBalances] = useState<AccountingBalance[]>(() => {
    return DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      periodId: 'current-period',
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
    }));
  });

  const fetchSavedPeriods = async () => {
    try {
      const list = await repository.getSavedPeriods();
      setSavedPeriods(list);
    } catch (err) {
      console.error('Erro ao listar períodos:', err);
    }
  };

  useEffect(() => {
    fetchSavedPeriods();
  }, []);

  const recalculateTree = (items: AccountingBalance[]): AccountingBalance[] => {
    const list = items.map((b) => ({ ...b }));

    const synthetics = list
      .filter((b) => b.accountType === 'SINTETICA')
      .sort((a, b) => b.classification.length - a.classification.length);

    for (const syn of synthetics) {
      const children = list.filter(
        (c) =>
          c.classification.startsWith(syn.classification + '-') &&
          c.classification !== syn.classification &&
          c.accountType === 'ANALITICA'
      );

      let totalFinal = 0;
      let totalDebit = 0;
      let totalCredit = 0;
      let totalInitial = 0;

      for (const child of children) {
        totalDebit += child.debitAmount || 0;
        totalCredit += child.creditAmount || 0;
        totalInitial += child.initialBalance || 0;

        // Se a conta analítica possui a mesma natureza da sintética, SOMA; se for contrária (C no Ativo ou D no Passivo), SUBTRAI
        if (syn.statementGroup === 'ATIVO') {
          if (child.finalNature === 'D') {
            totalFinal += child.finalBalance || 0;
          } else {
            totalFinal -= child.finalBalance || 0;
          }
        } else {
          if (child.finalNature === 'C') {
            totalFinal += child.finalBalance || 0;
          } else {
            totalFinal -= child.finalBalance || 0;
          }
        }
      }

      const target = list.find((b) => b.codeReduced === syn.codeReduced);
      if (target) {
        target.debitAmount = totalDebit;
        target.creditAmount = totalCredit;
        target.initialBalance = totalInitial;
        target.finalBalance = Math.abs(totalFinal);
        target.finalNature = totalFinal < 0 ? (syn.statementGroup === 'ATIVO' ? 'C' : 'D') : (syn.statementGroup === 'ATIVO' ? 'D' : 'C');
      }
    }

    return list;
  };

  const updateBalance = (
    codeReduced: number,
    field: 'initialBalance' | 'debitAmount' | 'creditAmount' | 'finalBalance',
    value: number
  ) => {
    setBalances((prev) => {
      const updated = prev.map((item) => {
        if (item.codeReduced === codeReduced) {
          const mod = { ...item, [field]: value };
          if (field !== 'finalBalance') {
            const res = AccountingEngine.calculateFinalBalance(
              mod.initialBalance,
              mod.initialNature,
              mod.debitAmount,
              mod.creditAmount,
              mod.finalNature
            );
            mod.finalBalance = res.balance;
            mod.finalNature = res.nature;
          }
          return mod;
        }
        return item;
      });
      return recalculateTree(updated);
    });
  };

  const applyAutoBalance = (targetClassification: string = '2-4-08-01') => {
    const result = AutoBalancer.autoBalance(balances, targetClassification);
    setBalances(recalculateTree(result.updatedBalances));
  };

  const resetBalances = () => {
    setPeriod({
      id: undefined,
      description: 'Novo Exercício',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      sourceType: 'MANUAL',
    });
    setBalances(
      DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
        periodId: 'current-period',
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
      }))
    );
  };

  const saveCurrentBalances = async (sourceType: 'MANUAL' | 'IMPORTED' = 'MANUAL'): Promise<string> => {
    setIsLoading(true);
    try {
      const balanceSheetRes = AccountingEngine.calculateBalanceSheet(balances);

      const savedId = await repository.savePeriodWithBalances({
        periodId: period.id,
        companyId: company.id,
        accountantId: accountant.id,
        companyData: company,
        accountantData: accountant,
        description: period.description,
        startDate: period.startDate,
        endDate: period.endDate,
        isBalanced: balanceSheetRes.isBalanced,
        sourceType,
        balances,
      });

      setPeriod((prev) => ({ ...prev, id: savedId, sourceType }));
      await fetchSavedPeriods();
      return savedId;
    } finally {
      setIsLoading(false);
    }
  };

  const importBalancesAndSave = async (
    importedBalances: AccountingBalance[],
    periodMeta: { description: string; startDate: string; endDate: string },
    companyMeta?: any
  ): Promise<string> => {
    setIsLoading(true);
    try {
      const fullCalculated = recalculateTree(importedBalances);
      const balanceSheetRes = AccountingEngine.calculateBalanceSheet(fullCalculated);

      const savedId = await repository.savePeriodWithBalances({
        companyId: company.id,
        accountantId: accountant.id,
        companyData: companyMeta || company,
        accountantData: accountant,
        description: periodMeta.description,
        startDate: periodMeta.startDate,
        endDate: periodMeta.endDate,
        isBalanced: balanceSheetRes.isBalanced,
        sourceType: 'IMPORTED',
        balances: fullCalculated,
      });

      await fetchSavedPeriods();
      return savedId;
    } finally {
      setIsLoading(false);
    }
  };

  const loadPeriodById = async (periodId: string) => {
    setIsLoading(true);
    try {
      const details = await repository.getPeriodDetails(periodId);
      setPeriod({
        id: details.period.id,
        description: details.period.description,
        startDate: details.period.start_date,
        endDate: details.period.end_date,
        sourceType: details.period.source_type || 'MANUAL',
      });

      if (details.period.companies) {
        const c = details.period.companies;
        setCompany({
          id: c.id,
          code: c.code || '',
          corporateName: c.corporate_name,
          tradeName: c.trade_name || '',
          cnpj: c.cnpj,
          nire: c.nire || '',
          nireDate: c.nire_date || '',
          address: c.address || '',
          neighborhood: c.neighborhood || '',
          city: c.city || '',
          state: c.state || '',
          zipCode: c.zip_code || '',
          representativeName: c.representative_name,
          representativeCpf: c.representative_cpf,
          representativeRole: c.representative_role || 'Administrador',
        });
      }

      if (details.period.accountants) {
        const a = details.period.accountants;
        setAccountant({
          id: a.id,
          name: a.name,
          crc: a.crc,
          cpf: a.cpf,
          role: a.role || 'Contador',
        });
      }

      if (details.balances && details.balances.length > 0) {
        const merged = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
          const found = details.balances.find((b: any) => b.codeReduced === acc.codeReduced);
          if (found) return found;
          return {
            periodId,
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
          };
        });
        setBalances(recalculateTree(merged));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedPeriod = async (periodId: string) => {
    await repository.deletePeriod(periodId);
    await fetchSavedPeriods();
    if (period.id === periodId) {
      resetBalances();
    }
  };

  const formatPeriodText = (type: 'balance' | 'balancete' = 'balance') => {
    if (!period.startDate || !period.endDate) return '';
    const [y1, m1, d1] = period.startDate.split('-');
    const [y2, m2, d2] = period.endDate.split('-');
    const formattedStart = `${d1}/${m1}/${y1}`;
    const formattedEnd = `${d2}/${m2}/${y2}`;

    if (type === 'balancete') {
      return `de ${formattedStart} até ${formattedEnd}`;
    }
    return `Data: ${formattedStart} a ${formattedEnd}`;
  };

  const balanceSheet = AccountingEngine.calculateBalanceSheet(balances);

  return (
    <AccountingContext.Provider
      value={{
        balances,
        period,
        company,
        accountant,
        balanceSheet,
        savedPeriods,
        isLoading,
        setPeriod,
        setCompany,
        setAccountant,
        updateBalance,
        applyAutoBalance,
        resetBalances,
        formatPeriodText,
        saveCurrentBalances,
        importBalancesAndSave,
        loadPeriodById,
        fetchSavedPeriods,
        deleteSavedPeriod,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting must be used within an AccountingProvider');
  }
  return context;
};