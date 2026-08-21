'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { AccountingEngine, BalanceSheetResult } from '@/domain/services/AccountingEngine';
import { AutoBalancer } from '@/domain/services/AutoBalancer';
import { AccountingRepository, SavedPeriodSummary } from '@/infrastructure/repositories/AccountingRepository';

export interface CompanyData {
  id?: string;
  code?: string;
  corporateName: string;
  tradeName?: string;
  cnpj: string;
  nire?: string;
  nireDate?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  representativeName: string;
  representativeCpf: string;
  representativeRole?: string;
}

export interface AccountantData {
  id?: string;
  name: string;
  crc: string;
  cpf: string;
  role?: string;
}

export interface AccountingPeriodData {
  id?: string;
  companyId?: string;
  accountantId?: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'OPEN' | 'BALANCED' | 'CLOSED';
  sourceType: 'MANUAL' | 'IMPORTED';
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
  updateBalance: (codeReduced: number, field: keyof AccountingBalance, value: any) => void;
  applyAutoBalance: () => void;
  resetBalances: () => void;
  saveCurrentBalances: () => Promise<string>;
  loadSavedPeriod: (periodId: string) => Promise<void>;
  loadPeriodById: (periodId: string) => Promise<void>;
  deleteSavedPeriod: (periodId: string) => Promise<void>;
  refreshSavedPeriods: () => Promise<void>;
  formatPeriodText: (startDate?: string, endDate?: string) => string;
  importBalancesAndSave: (
    importedBalances: AccountingBalance[],
    periodInfo: { description: string; startDate: string; endDate: string },
    companyInfo?: Partial<CompanyData>
  ) => Promise<string>;
}

const AccountingContext = createContext<AccountingContextType | undefined>(undefined);

const initialCompany: CompanyData = {
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
};

const initialAccountant: AccountantData = {
  name: 'JAMAILA FONSECA LOPES COSTA',
  crc: '0124650',
  cpf: '024.650.373-40',
  role: 'Contador',
};

const initialPeriod: AccountingPeriodData = {
  description: 'Exercício 01/01/2024 a 31/12/2024',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  status: 'OPEN',
  sourceType: 'MANUAL',
};

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const repository = new AccountingRepository();

  const [company, setCompany] = useState<CompanyData>(initialCompany);
  const [accountant, setAccountant] = useState<AccountantData>(initialAccountant);
  const [period, setPeriod] = useState<AccountingPeriodData>(initialPeriod);
  const [savedPeriods, setSavedPeriods] = useState<SavedPeriodSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [balances, setBalances] = useState<AccountingBalance[]>(() => {
    return DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      periodId: 'initial',
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

  const refreshSavedPeriods = useCallback(async () => {
    try {
      const list = await repository.getSavedPeriods();
      setSavedPeriods(list);
    } catch (e) {
      console.error('Erro ao carregar períodos salvos:', e);
    }
  }, []);

  useEffect(() => {
    refreshSavedPeriods();
  }, [refreshSavedPeriods]);

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

        if (syn.statementGroup === 'ATIVO') {
          if (child.finalNature === 'D') {
            totalFinal += child.finalBalance || 0;
          } else {
            totalFinal -= child.finalBalance || 0;
          }
        } else if (syn.statementGroup === 'PASSIVO' || syn.statementGroup === 'PL') {
          if (child.finalNature === 'C') {
            totalFinal += child.finalBalance || 0;
          } else {
            totalFinal -= child.finalBalance || 0;
          }
        } else if (syn.statementGroup === 'RECEITA') {
          if (child.finalNature === 'C') {
            totalFinal += child.finalBalance || 0;
          } else {
            totalFinal -= child.finalBalance || 0;
          }
        } else {
          if (child.finalNature === 'D') {
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

        if (syn.statementGroup === 'ATIVO') {
          target.finalNature = totalFinal < 0 ? 'C' : 'D';
        } else if (syn.statementGroup === 'PASSIVO' || syn.statementGroup === 'PL' || syn.statementGroup === 'RECEITA') {
          target.finalNature = totalFinal < 0 ? 'D' : 'C';
        } else {
          target.finalNature = totalFinal < 0 ? 'C' : 'D';
        }
      }
    }

    return list;
  };

  const updateBalance = (codeReduced: number, field: keyof AccountingBalance, value: any) => {
    setBalances((prev) => {
      const updated = prev.map((item) => {
        if (item.codeReduced === codeReduced) {
          const newItem = { ...item, [field]: value };
          if (field === 'initialBalance' || field === 'debitAmount' || field === 'creditAmount') {
            const calculated = AccountingEngine.calculateFinalBalance(
              Number(newItem.initialBalance || 0),
              newItem.initialNature,
              Number(newItem.debitAmount || 0),
              Number(newItem.creditAmount || 0),
              newItem.initialNature
            );
            newItem.finalBalance = calculated.balance;
            newItem.finalNature = calculated.nature;
          }
          return newItem;
        }
        return item;
      });
      return recalculateTree(updated);
    });
  };

  const applyAutoBalance = () => {
    const result = AutoBalancer.autoBalance(balances);
    setBalances(recalculateTree(result.updatedBalances));
  };

  const resetBalances = () => {
    const blank = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      periodId: 'new',
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
    setBalances(blank);
    setPeriod({ ...initialPeriod, id: undefined });
  };

  const balanceSheet = AccountingEngine.calculateBalanceSheet(balances);

  const formatPeriodText = (startDate?: string, endDate?: string): string => {
    const s = startDate || period.startDate;
    const e = endDate || period.endDate;
    if (!s || !e) return '01/01/2024 a 31/12/2024';

    const formatSafe = (d: string) => {
      if (d.includes('/')) return d;
      const p = d.split('-');
      return p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : d;
    };

    return `${formatSafe(s)} a ${formatSafe(e)}`;
  };

  const saveCurrentBalances = async (): Promise<string> => {
    setIsLoading(true);
    try {
      const targetPeriodId = await repository.savePeriodWithBalances({
        periodId: period.id,
        companyId: company.id,
        accountantId: accountant.id,
        companyData: company,
        accountantData: accountant,
        description: period.description,
        startDate: period.startDate,
        endDate: period.endDate,
        isBalanced: balanceSheet.isBalanced,
        sourceType: period.sourceType,
        balances,
      });

      setPeriod((prev) => ({
        ...prev,
        id: targetPeriodId,
        status: balanceSheet.isBalanced ? 'BALANCED' : 'OPEN',
      }));

      await refreshSavedPeriods();
      return targetPeriodId;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedPeriod = async (periodId: string) => {
    setIsLoading(true);
    try {
      const data = await repository.getPeriodDetails(periodId);

      if (data.period) {
        setPeriod({
          id: data.period.id,
          companyId: data.period.company_id,
          accountantId: data.period.accountant_id,
          description: data.period.description,
          startDate: data.period.start_date,
          endDate: data.period.end_date,
          status: data.period.status,
          sourceType: data.period.source_type,
        });

        if (data.period.companies) {
          setCompany({
            id: data.period.companies.id,
            code: data.period.companies.code,
            corporateName: data.period.companies.corporate_name,
            tradeName: data.period.companies.trade_name,
            cnpj: data.period.companies.cnpj,
            nire: data.period.companies.nire,
            nireDate: data.period.companies.nire_date,
            address: data.period.companies.address,
            neighborhood: data.period.companies.neighborhood,
            city: data.period.companies.city,
            state: data.period.companies.state,
            zipCode: data.period.companies.zip_code,
            representativeName: data.period.companies.representative_name,
            representativeCpf: data.period.companies.representative_cpf,
            representativeRole: data.period.companies.representative_role,
          });
        }

        if (data.period.accountants) {
          setAccountant({
            id: data.period.accountants.id,
            name: data.period.accountants.name,
            crc: data.period.accountants.crc,
            cpf: data.period.accountants.cpf,
            role: data.period.accountants.role,
          });
        }
      }

      if (data.balances && data.balances.length > 0) {
        const mappedBalances = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
          const found = data.balances.find((b: any) => b.codeReduced === acc.codeReduced);
          if (found) return found;
          return {
            periodId: data.period.id,
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
        setBalances(recalculateTree(mappedBalances));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSavedPeriod = async (periodId: string) => {
    setIsLoading(true);
    try {
      await repository.deletePeriod(periodId);
      await refreshSavedPeriods();
      if (period.id === periodId) {
        resetBalances();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const importBalancesAndSave = async (
    importedBalances: AccountingBalance[],
    periodInfo: { description: string; startDate: string; endDate: string },
    companyInfo?: Partial<CompanyData>
  ): Promise<string> => {
    setIsLoading(true);
    try {
      const merged = DEFAULT_CHART_OF_ACCOUNTS.map((acc) => {
        const fromImport = importedBalances.find((b) => b.codeReduced === acc.codeReduced);
        const fromCurrent = balances.find((b) => b.codeReduced === acc.codeReduced);

        if (fromImport && (fromImport.finalBalance > 0 || fromImport.debitAmount > 0 || fromImport.creditAmount > 0)) {
          return fromImport;
        }
        if (fromCurrent && (fromCurrent.finalBalance > 0 || fromCurrent.debitAmount > 0 || fromCurrent.creditAmount > 0)) {
          return fromCurrent;
        }
        return (
          fromImport || {
            periodId: 'imported-temp',
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
          }
        );
      });

      const updatedBalances = recalculateTree(merged);
      setBalances(updatedBalances);

      const newPeriodState: AccountingPeriodData = {
        ...period,
        description: periodInfo.description,
        startDate: periodInfo.startDate,
        endDate: periodInfo.endDate,
        sourceType: 'IMPORTED',
      };
      setPeriod(newPeriodState);

      if (companyInfo) {
        setCompany((prev) => ({ ...prev, ...companyInfo }));
      }

      const calculated = AccountingEngine.calculateBalanceSheet(updatedBalances);

      const savedPeriodId = await repository.savePeriodWithBalances({
        companyData: { ...company, ...(companyInfo || {}) },
        accountantData: accountant,
        description: periodInfo.description,
        startDate: periodInfo.startDate,
        endDate: periodInfo.endDate,
        isBalanced: calculated.isBalanced,
        sourceType: 'IMPORTED',
        balances: updatedBalances,
      });

      setPeriod((prev) => ({
        ...prev,
        id: savedPeriodId,
        status: calculated.isBalanced ? 'BALANCED' : 'OPEN',
      }));

      await refreshSavedPeriods();
      return savedPeriodId;
    } finally {
      setIsLoading(false);
    }
  };

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
        saveCurrentBalances,
        loadSavedPeriod,
        loadPeriodById: loadSavedPeriod,
        deleteSavedPeriod,
        refreshSavedPeriods,
        formatPeriodText,
        importBalancesAndSave,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = (): AccountingContextType => {
  const context = useContext(AccountingContext);
  if (!context) {
    throw new Error('useAccounting deve ser usado dentro de um AccountingProvider');
  }
  return context;
};