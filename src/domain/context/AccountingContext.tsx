'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Decimal from 'decimal.js';
import { AccountingBalance } from '../entities/AccountingBalance';
import { AccountingEngine, BalanceSheetResult } from '../services/AccountingEngine';
import { AutoBalancer } from '../services/AutoBalancer';
import { ExpenseDistributor } from '../services/ExpenseDistributor';
import { DEFAULT_CHART_OF_ACCOUNTS } from '../entities/DefaultChartAccounts';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  accountName: string;
  classification: string;
  codeReduced: number;
  field: string;
  previousValue: number;
  newValue: number;
  snapshot: AccountingBalance[];
  counterpart?: { description: string };
  distributionInfo?: { sourceAccount: string; totalDistributed: number };
}

export interface CompanyData {
  id?: string;
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

export interface SavedPeriodsSummary {
  id: string;
  company_id: string;
  accountant_id: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'OPEN' | 'BALANCED' | 'CLOSED';
  source_type: 'MANUAL' | 'IMPORTED';
  is_closed?: boolean;
  total_assets?: number;
  total_liabilities?: number;
  net_income?: number;
  created_at: string;
}

export type SavedPeriod = SavedPeriodsSummary & {
  startDate: string;
  endDate: string;
  sourceType: 'MANUAL' | 'IMPORTED';
  balancesSnapshot?: AccountingBalance[];
};

export interface AccountingContextData {
  balances: AccountingBalance[];
  period: { id?: string; description: string; startDate: string; endDate: string; status?: string };
  company: CompanyData;
  accountant: AccountantData;
  savedPeriods: SavedPeriod[];
  balanceSheet: BalanceSheetResult;
  history: HistoryEntry[];
  isLoading: boolean;
  setPeriod: (p: any) => void;
  formatPeriodText: () => string;
  updateBalance: (codeReduced: number, field: string, value: number) => void;
  recordHistoryEntry: (codeReduced: number, field: string, oldVal: number, newVal: number, snapshot: AccountingBalance[]) => void;
  syncChartOfAccounts: () => Promise<number>;
  closeResultAccountsAction: () => void;
  distributeExpenseAccount: (sourceCode: number, percentage: number) => void;
  applyAutoBalance: () => void;
  undoLastChange: () => void;
  undoAllChanges: () => void;
  resetBalances: () => void;
  saveCurrentBalances: () => Promise<void>;
  addNewAccount: (account: any) => Promise<void>;
  editAccount: (account: any) => Promise<void>;
  deleteAccount: (id: string | number) => Promise<void>;
  importBalancesAndSave: (fileData: any, periodInfo?: any, companyInfo?: any) => Promise<string>;
  createNewBlankPeriod: (periodInfo?: any) => string;
  loadSavedPeriod: (id: string) => Promise<void>;
  loadPeriodById: (id: string) => Promise<void>;
  deleteSavedPeriod: (id: string) => Promise<void>;
  togglePeriodClose: (id: string, statusOrForward?: any) => Promise<{ nextPeriodUpdated: boolean; accountsForwarded: number }>;
}

const defaultCompany: CompanyData = {
  corporateName: 'JC MACHADO DIAS LTDA',
  tradeName: 'BV DISTRIBUIDORA',
  cnpj: '24.905.673/0001-59',
  nire: '21201532287',
  nireDate: '2016-05-31',
  address: 'AVENIDA JK, 1208, Lote 1 A 4, Quadra 4 Fundos',
  city: 'Bom Jesus das Selvas',
  state: 'MA',
  representativeName: 'JOSE CARLOS MACHADO DIAS',
  representativeCpf: '196.018.244-72',
  representativeRole: 'Administrador',
};

const defaultAccountant: AccountantData = {
  name: 'JAMAILA FONSECA LOPES COSTA',
  crc: '0124650',
  cpf: '000.000.000-00',
  role: 'Contador',
};

const AccountingContext = createContext<AccountingContextData>({} as AccountingContextData);

export const AccountingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balances, setBalances] = useState<AccountingBalance[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [company, setCompany] = useState<CompanyData>(defaultCompany);
  const [accountant, setAccountant] = useState<AccountantData>(defaultAccountant);
  const [savedPeriods, setSavedPeriods] = useState<SavedPeriod[]>([
    {
      id: 'period-2024-default',
      company_id: 'comp-001',
      accountant_id: 'acc-001',
      description: 'Exercício de 01/01/2024 a 31/12/2024',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      status: 'OPEN',
      sourceType: 'MANUAL',
      source_type: 'MANUAL',
      is_closed: false,
      created_at: new Date().toISOString(),
    },
  ]);

  const [period, setPeriod] = useState({
    id: 'period-2024-default',
    description: 'Exercício de 01/01/2024 a 31/12/2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    status: 'OPEN',
  });

  const [balanceSheet, setBalanceSheet] = useState<BalanceSheetResult>({
    totalAssets: new Decimal(0),
    currentAssets: new Decimal(0),
    nonCurrentAssets: new Decimal(0),
    totalLiabilities: new Decimal(0),
    currentLiabilities: new Decimal(0),
    nonCurrentLiabilities: new Decimal(0),
    equity: new Decimal(0),
    dreResult: {
      grossRevenue: new Decimal(0),
      deductions: new Decimal(0),
      netRevenue: new Decimal(0),
      costOfGoodsSold: new Decimal(0),
      grossProfit: new Decimal(0),
      operatingExpenses: new Decimal(0),
      financialExpenses: new Decimal(0),
      nonOperatingRevenue: new Decimal(0),
      netIncome: new Decimal(0),
    },
    isBalanced: true,
    discrepancy: new Decimal(0),
  });

  useEffect(() => {
    if (balances.length > 0) {
      const bs = AccountingEngine.calculateBalanceSheet(balances);
      setBalanceSheet(bs);
    }
  }, [balances]);

  const buildDefaultBalances = useCallback((): AccountingBalance[] => {
    return DEFAULT_CHART_OF_ACCOUNTS.map((acc) => ({
      id: crypto.randomUUID(),
      periodId: period.id || 'period-2024-default',
      accountId: crypto.randomUUID(),
      codeReduced: acc.codeReduced,
      classification: acc.classification,
      description: acc.description,
      accountType: acc.accountType,
      statementGroup: acc.statementGroup,
      initialBalance: 0,
      initialNature: acc.nature,
      debitAmount: 0,
      creditAmount: 0,
      finalBalance: 0,
      finalNature: acc.nature,
    }));
  }, [period.id]);

  useEffect(() => {
    if (balances.length === 0) {
      setBalances(buildDefaultBalances());
    }
  }, [balances.length, buildDefaultBalances]);

  const formatPeriodText = useCallback(() => {
    return period.description || `De ${period.startDate} a ${period.endDate}`;
  }, [period]);

  const updateBalance = useCallback((codeReduced: number, field: string, value: number) => {
    setBalances((prev) => {
      const list = [...prev];
      const idx = list.findIndex((b) => b.codeReduced === codeReduced);
      if (idx === -1) return prev;

      const item = { ...list[idx] };
      if (item.accountType === 'SINTETICA') return prev;

      (item as any)[field] = value;

      const calc = AccountingEngine.calculateFinalBalance(
        item.initialBalance || 0,
        item.initialNature || 'D',
        item.debitAmount || 0,
        item.creditAmount || 0,
        item.initialNature || 'D'
      );

      item.finalBalance = calc.balance;
      item.finalNature = calc.nature;

      list[idx] = item;
      return list;
    });
  }, []);

  const recordHistoryEntry = useCallback((codeReduced: number, field: string, oldVal: number, newVal: number, snapshot: AccountingBalance[]) => {
    setBalances((currentBalances) => {
      const target = currentBalances.find((b) => b.codeReduced === codeReduced);
      if (!target) return currentBalances;

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        accountName: target.description,
        classification: target.classification,
        codeReduced,
        field,
        previousValue: oldVal,
        newValue: newVal,
        snapshot,
      };

      setHistory((prev) => [entry, ...prev]);
      return currentBalances;
    });
  }, []);

  const closeResultAccountsAction = useCallback(() => {
    setBalances((prev) => {
      const snapshot = prev.map((b) => ({ ...b }));
      const newBalances = AccountingEngine.closeResultAccounts(prev);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        accountName: 'Zeramento de Resultado (DRE)',
        classification: 'Múltiplas Contas',
        codeReduced: 0,
        field: 'system_action',
        previousValue: 0,
        newValue: 0,
        snapshot,
        counterpart: { description: 'Transferência de saldo para 2-4-08-01 (Lucros Acumulados)' },
      };

      setHistory((h) => [entry, ...h]);
      return newBalances;
    });
  }, []);

  const applyAutoBalance = useCallback(() => {
    setBalances((prev) => {
      const snapshot = prev.map((b) => ({ ...b }));
      const result = AutoBalancer.balance(prev);

      if (result.adjustedAccount.amount > 0) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date().toLocaleTimeString('pt-BR'),
          accountName: result.adjustedAccount.description,
          classification: 'Ajuste Automático',
          codeReduced: result.adjustedAccount.codeReduced,
          field: 'creditAmount',
          previousValue: 0,
          newValue: result.adjustedAccount.amount,
          snapshot,
          counterpart: { description: `Ajuste para cravar Liquidez e balancear R$ ${result.adjustedAccount.amount}` },
        };
        setHistory((h) => [entry, ...h]);
      }
      return result.updatedBalances;
    });
  }, []);

  const distributeExpenseAccount = useCallback((sourceCode: number, percentage: number) => {
    setBalances((prev) => {
      const snapshot = prev.map((b) => ({ ...b }));
      const result = ExpenseDistributor.distribute(prev as any, sourceCode as any, percentage as any);
      const updatedList = (result as any)?.updatedBalances || (Array.isArray(result) ? result : prev);

      const entry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toLocaleTimeString('pt-BR'),
        accountName: 'Rateio de Despesa',
        classification: 'Múltiplas',
        codeReduced: sourceCode,
        field: 'distribution',
        previousValue: 0,
        newValue: 0,
        snapshot,
        distributionInfo: { sourceAccount: sourceCode.toString(), totalDistributed: percentage },
      };

      setHistory((h) => [entry, ...h]);
      return updatedList;
    });
  }, []);

  const syncChartOfAccounts = async () => {
    setIsLoading(true);
    await new Promise((res) => setTimeout(res, 400));
    setIsLoading(false);
    return 0;
  };

  const undoLastChange = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[0];
      setBalances(last.snapshot);
      return prev.slice(1);
    });
  }, []);

  const undoAllChanges = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const first = prev[prev.length - 1];
      setBalances(first.snapshot);
      return [];
    });
  }, []);

  const resetBalances = useCallback(() => {
    setBalances(buildDefaultBalances());
    setHistory([]);
  }, [buildDefaultBalances]);

  const saveCurrentBalances = async () => {
    setIsLoading(true);
    // Atualiza o snapshot no savedPeriods ativo
    setSavedPeriods((prev) =>
      prev.map((p) => (p.id === period.id ? { ...p, balancesSnapshot: balances } : p))
    );
    await new Promise((res) => setTimeout(res, 300));
    setIsLoading(false);
  };

  const addNewAccount = async (account: any) => {
    setIsLoading(true);
    setBalances((prev) => {
      const code = Number(account.codeReduced);
      if (prev.some((b) => b.codeReduced === code)) {
        return prev;
      }

      const newBal: AccountingBalance = {
        id: crypto.randomUUID(),
        periodId: period.id || 'current-period',
        accountId: String(code),
        codeReduced: code,
        classification: account.classification,
        description: account.description,
        accountType: account.accountType,
        statementGroup: account.statementGroup,
        initialBalance: 0,
        initialNature: account.nature || 'D',
        debitAmount: 0,
        creditAmount: 0,
        finalBalance: 0,
        finalNature: account.nature || 'D',
      };

      return [...prev, newBal];
    });
    setIsLoading(false);
  };

  const editAccount = async (account: any) => {
    setIsLoading(true);
    setBalances((prev) => {
      const code = Number(account.codeReduced);
      const list = [...prev];
      const idx = list.findIndex((b) => b.codeReduced === code);
      if (idx === -1) return prev;

      const item = { ...list[idx] };
      item.classification = account.classification || item.classification;
      item.description = account.description || item.description;
      item.accountType = account.accountType || item.accountType;
      item.statementGroup = account.statementGroup || item.statementGroup;

      const newNature: 'D' | 'C' = account.nature || item.finalNature || 'D';
      item.initialNature = newNature;

      // Recalcula o saldo final aplicando a nova natureza (Crédito/Débito)
      const calc = AccountingEngine.calculateFinalBalance(
        item.initialBalance || 0,
        newNature,
        item.debitAmount || 0,
        item.creditAmount || 0,
        newNature
      );

      item.finalBalance = calc.balance;
      item.finalNature = calc.nature;

      list[idx] = item;
      return list;
    });
    setIsLoading(false);
  };

  const deleteAccount = async (id: string | number) => {
    setIsLoading(true);
    const code = Number(id);
    setBalances((prev) => prev.filter((b) => b.codeReduced !== code));
    setIsLoading(false);
  };

  // Importação e persistência ativa do balancete no estado global
  const importBalancesAndSave = async (fileBalances: AccountingBalance[], periodInfo?: any, companyInfo?: any): Promise<string> => {
    setIsLoading(true);
    const newId = crypto.randomUUID();

    const desc = periodInfo?.description || 'Exercício Importado';
    const sDate = periodInfo?.startDate || periodInfo?.start_date || '2024-01-01';
    const eDate = periodInfo?.endDate || periodInfo?.end_date || '2024-12-31';

    if (companyInfo) {
      setCompany((prev) => ({
        ...prev,
        corporateName: companyInfo.corporateName || companyInfo.corporate_name || prev.corporateName,
        cnpj: companyInfo.cnpj || prev.cnpj,
      }));
    }

    const newPeriodState = {
      id: newId,
      description: desc,
      startDate: sDate,
      endDate: eDate,
      status: 'OPEN',
    };

    const newSavedPeriod: SavedPeriod = {
      id: newId,
      company_id: 'comp-001',
      accountant_id: 'acc-001',
      description: desc,
      startDate: sDate,
      endDate: eDate,
      start_date: sDate,
      end_date: eDate,
      status: 'OPEN',
      sourceType: 'IMPORTED',
      source_type: 'IMPORTED',
      is_closed: false,
      created_at: new Date().toISOString(),
      balancesSnapshot: fileBalances,
    };

    // Atualiza os balances globais com o arquivo importado
    const importedBalancesWithPeriod = fileBalances.map((b) => ({
      ...b,
      periodId: newId,
    }));

    setPeriod(newPeriodState);
    setBalances(importedBalancesWithPeriod);
    setSavedPeriods((prev) => [newSavedPeriod, ...prev]);
    setHistory([]);

    setIsLoading(false);
    return newId;
  };

  const createNewBlankPeriod = (periodInfo?: any): string => {
    const newId = crypto.randomUUID();
    let desc = `Novo Exercício ${new Date().getFullYear()}`;
    let sDate = `${new Date().getFullYear()}-01-01`;
    let eDate = `${new Date().getFullYear()}-12-31`;

    if (typeof periodInfo === 'string') {
      desc = periodInfo;
    } else if (periodInfo && typeof periodInfo === 'object') {
      desc = periodInfo.description || desc;
      sDate = periodInfo.startDate || periodInfo.start_date || sDate;
      eDate = periodInfo.endDate || periodInfo.end_date || eDate;
    }

    const newPeriod: SavedPeriod = {
      id: newId,
      company_id: 'comp-001',
      accountant_id: 'acc-001',
      description: desc,
      startDate: sDate,
      endDate: eDate,
      start_date: sDate,
      end_date: eDate,
      status: 'OPEN',
      sourceType: 'MANUAL',
      source_type: 'MANUAL',
      is_closed: false,
      created_at: new Date().toISOString(),
    };

    setSavedPeriods((prev) => [newPeriod, ...prev]);
    setPeriod({
      id: newId,
      description: desc,
      startDate: sDate,
      endDate: eDate,
      status: 'OPEN',
    });
    resetBalances();
    return newId;
  };

  const loadSavedPeriod = async (id: string) => {
    setIsLoading(true);
    const found = savedPeriods.find((p) => p.id === id);
    if (found) {
      setPeriod({
        id: found.id,
        description: found.description,
        startDate: found.startDate || found.start_date,
        endDate: found.endDate || found.end_date,
        status: found.status,
      });

      if (found.balancesSnapshot && found.balancesSnapshot.length > 0) {
        setBalances(found.balancesSnapshot);
      }
    }
    await new Promise((res) => setTimeout(res, 200));
    setIsLoading(false);
  };

  const loadPeriodById = async (id: string) => {
    await loadSavedPeriod(id);
  };

  const deleteSavedPeriod = async (id: string) => {
    setSavedPeriods((prev) => prev.filter((p) => p.id !== id));
  };

  const togglePeriodClose = async (
    id: string,
    statusOrForward?: any
  ): Promise<{ nextPeriodUpdated: boolean; accountsForwarded: number }> => {
    let forward = false;
    if (typeof statusOrForward === 'boolean') {
      forward = statusOrForward;
    }

    setSavedPeriods((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const nextStatus = p.status === 'CLOSED' ? 'OPEN' : 'CLOSED';
          return {
            ...p,
            status: nextStatus,
            is_closed: nextStatus === 'CLOSED',
          };
        }
        return p;
      })
    );

    return {
      nextPeriodUpdated: forward,
      accountsForwarded: forward ? balances.length : 0,
    };
  };

  return (
    <AccountingContext.Provider
      value={{
        balances,
        period,
        company,
        accountant,
        savedPeriods,
        balanceSheet,
        history,
        isLoading,
        setPeriod,
        formatPeriodText,
        updateBalance,
        recordHistoryEntry,
        syncChartOfAccounts,
        closeResultAccountsAction,
        distributeExpenseAccount,
        applyAutoBalance,
        undoLastChange,
        undoAllChanges,
        resetBalances,
        saveCurrentBalances,
        addNewAccount,
        editAccount,
        deleteAccount,
        importBalancesAndSave,
        createNewBlankPeriod,
        loadSavedPeriod,
        loadPeriodById,
        deleteSavedPeriod,
        togglePeriodClose,
      }}
    >
      {children}
    </AccountingContext.Provider>
  );
};

export const useAccounting = () => useContext(AccountingContext);