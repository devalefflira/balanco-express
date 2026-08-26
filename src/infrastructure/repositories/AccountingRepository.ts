import { createClient } from '@/infrastructure/supabase/client';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';
import { ChartAccount } from '@/domain/entities/ChartAccount';
import { AccountingEngine } from '@/domain/services/AccountingEngine';

export interface SavedPeriodSummary {
  id: string;
  company_id: string;
  accountant_id: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'OPEN' | 'BALANCED' | 'CLOSED';
  source_type: 'MANUAL' | 'IMPORTED';
  created_at: string;
  updated_at?: string;
  company?: {
    corporate_name: string;
    cnpj: string;
    code?: string;
  };
  accountant?: {
    name: string;
    crc: string;
  };
}

export class AccountingRepository {
  private supabase = createClient();

  async ensureCompany(companyData?: any): Promise<string> {
    const { data: existing } = await this.supabase
      .from('companies')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: created, error } = await this.supabase
      .from('companies')
      .insert({
        code: companyData?.code || '00463',
        corporate_name: companyData?.corporateName || 'JC MACHADO DIAS',
        trade_name: companyData?.tradeName || 'PRIME DISTRIBUIDORA',
        cnpj: companyData?.cnpj || '24.905.673/0001-59',
        nire: companyData?.nire || '21201532287',
        nire_date: companyData?.nireDate || '2016-05-31',
        address: companyData?.address || 'AVENIDA JK, 1208, Lote 1 A 4, Quadra 4 Fundos',
        neighborhood: companyData?.neighborhood || 'Vila Santa Luzia',
        city: companyData?.city || 'Bom Jesus das Selvas',
        state: companyData?.state || 'MA',
        zip_code: companyData?.zipCode || '65395-000',
        representative_name: companyData?.representativeName || 'JOSE CARLOS MACHADO DIAS',
        representative_cpf: companyData?.representativeCpf || '196.018.244-72',
        representative_role: companyData?.representativeRole || 'Administrador',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao registrar empresa: ${error.message}`);
    return created.id;
  }

  async ensureAccountant(accountantData?: any): Promise<string> {
    const { data: existing } = await this.supabase
      .from('accountants')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing?.id) return existing.id;

    const { data: created, error } = await this.supabase
      .from('accountants')
      .insert({
        name: accountantData?.name || 'JAMAILA FONSECA LOPES COSTA',
        crc: accountantData?.crc || '0124650',
        cpf: accountantData?.cpf || '024.650.373-40',
        role: accountantData?.role || 'Contador',
      })
      .select('id')
      .single();

    if (error) throw new Error(`Erro ao registrar contabilista: ${error.message}`);
    return created.id;
  }

  async getCompany(): Promise<any> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) console.error('Erro ao buscar empresa:', error);
    return data;
  }

  async getAccountant(): Promise<any> {
    const { data, error } = await this.supabase
      .from('accountants')
      .select('*')
      .limit(1)
      .maybeSingle();

    if (error) console.error('Erro ao buscar contador:', error);
    return data;
  }

  async updatePeriodStatus(periodId: string, status: 'OPEN' | 'BALANCED' | 'CLOSED'): Promise<void> {
    const { error } = await this.supabase
      .from('accounting_periods')
      .update({ status, created_at: new Date().toISOString() })
      .eq('id', periodId);

    if (error) throw new Error(`Erro ao atualizar status do período: ${error.message}`);
  }

  async forwardBalancesToNextPeriod(closedPeriodId: string): Promise<{ success: boolean; nextPeriodDescription?: string; accountsForwarded: number }> {
    const { data: closedPeriod, error: pErr } = await this.supabase
      .from('accounting_periods')
      .select('*')
      .eq('id', closedPeriodId)
      .single();

    if (pErr || !closedPeriod) return { success: false, accountsForwarded: 0 };

    const { data: nextPeriod } = await this.supabase
      .from('accounting_periods')
      .select('*')
      .eq('company_id', closedPeriod.company_id)
      .gt('start_date', closedPeriod.start_date)
      .order('start_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!nextPeriod) {
      return { success: true, accountsForwarded: 0 };
    }

    const { balances: closedBalances } = await this.getPeriodDetails(closedPeriodId);
    const { balances: nextBalances } = await this.getPeriodDetails(nextPeriod.id);

    const closedMap = new Map<number, AccountingBalance>();
    closedBalances.forEach((b: AccountingBalance) => closedMap.set(b.codeReduced, b));

    let forwardedCount = 0;

    for (const nb of nextBalances) {
      const prevAcc = closedMap.get(nb.codeReduced);
      if (!prevAcc) continue;

      if (nb.statementGroup === 'ATIVO' || nb.statementGroup === 'PASSIVO' || nb.statementGroup === 'PL') {
        const newInitial = prevAcc.finalBalance || 0;
        const newInitialNat = prevAcc.finalNature || 'D';

        const calc = AccountingEngine.calculateFinalBalance(
          newInitial,
          newInitialNat,
          nb.debitAmount || 0,
          nb.creditAmount || 0,
          newInitialNat
        );

        await this.supabase
          .from('account_balances')
          .update({
            initial_balance: newInitial,
            initial_balance_nature: newInitialNat,
            final_balance: calc.balance,
            final_balance_nature: calc.nature,
            updated_at: new Date().toISOString(),
          })
          .eq('period_id', nextPeriod.id)
          .eq('account_id', nb.accountId);

        forwardedCount++;
      }
    }

    return {
      success: true,
      nextPeriodDescription: nextPeriod.description,
      accountsForwarded: forwardedCount,
    };
  }

  async savePeriodWithBalances(params: {
    periodId?: string;
    companyId?: string;
    accountantId?: string;
    companyData?: any;
    accountantData?: any;
    description: string;
    startDate: string;
    endDate: string;
    isBalanced: boolean;
    sourceType?: 'MANUAL' | 'IMPORTED';
    status?: 'OPEN' | 'BALANCED' | 'CLOSED';
    balances: AccountingBalance[];
  }): Promise<string> {
    const {
      periodId,
      companyId,
      accountantId,
      companyData,
      accountantData,
      description,
      startDate,
      endDate,
      sourceType = 'MANUAL',
      status,
      balances,
    } = params;

    const validCompanyId =
      companyId && companyId.length === 36 && companyId !== '00000000-0000-0000-0000-000000000000'
        ? companyId
        : await this.ensureCompany(companyData);

    const validAccountantId =
      accountantId && accountantId.length === 36
        ? accountantId
        : await this.ensureAccountant(accountantData);

    let targetPeriodId: string = periodId ?? '';
    const nowIso = new Date().toISOString();

    const dbStatus: 'OPEN' | 'BALANCED' | 'CLOSED' = status
      ? status
      : sourceType === 'IMPORTED' && (!periodId || periodId === 'imported-temp')
      ? 'OPEN'
      : 'BALANCED';

    if (!targetPeriodId || targetPeriodId === 'current-period' || targetPeriodId === 'imported-temp' || targetPeriodId === 'initial' || targetPeriodId === 'new') {
      const { data: newPeriod, error: periodErr } = await this.supabase
        .from('accounting_periods')
        .insert({
          company_id: validCompanyId,
          accountant_id: validAccountantId,
          description,
          start_date: startDate,
          end_date: endDate,
          status: dbStatus,
          source_type: sourceType,
          created_at: nowIso,
        })
        .select('id')
        .single();

      if (periodErr) throw new Error(`Erro ao criar período: ${periodErr.message}`);
      targetPeriodId = String(newPeriod.id);
    } else {
      const { error: updateErr } = await this.supabase
        .from('accounting_periods')
        .update({
          company_id: validCompanyId,
          accountant_id: validAccountantId,
          description,
          start_date: startDate,
          end_date: endDate,
          status: dbStatus,
          source_type: sourceType,
          created_at: nowIso,
        })
        .eq('id', targetPeriodId);

      if (updateErr) throw new Error(`Erro ao atualizar período: ${updateErr.message}`);
    }

    const { data: existingAccounts } = await this.supabase
      .from('chart_of_accounts')
      .select('id, code_reduced')
      .eq('company_id', validCompanyId);

    const accountIdMap = new Map<number, string>();
    (existingAccounts || []).forEach((a: any) => {
      if (a?.code_reduced && a?.id) {
        accountIdMap.set(Number(a.code_reduced), String(a.id));
      }
    });

    const missingAccounts = balances
      .filter((b) => !accountIdMap.has(b.codeReduced))
      .map((b) => ({
        company_id: validCompanyId,
        code_reduced: b.codeReduced,
        classification: b.classification,
        description: b.description,
        account_type: b.accountType,
        nature: b.finalNature,
        statement_group: b.statementGroup,
      }));

    if (missingAccounts.length > 0) {
      const { data: insertedAccounts, error: accInsertErr } = await this.supabase
        .from('chart_of_accounts')
        .insert(missingAccounts)
        .select('id, code_reduced');

      if (!accInsertErr && insertedAccounts) {
        insertedAccounts.forEach((a: any) => {
          accountIdMap.set(Number(a.code_reduced), String(a.id));
        });
      }
    }

    const balancesPayload = balances
      .filter((b) => accountIdMap.has(b.codeReduced))
      .map((b) => ({
        period_id: targetPeriodId,
        account_id: accountIdMap.get(b.codeReduced)!,
        initial_balance: Number(b.initialBalance) || 0,
        initial_balance_nature: b.initialNature,
        debit_amount: Number(b.debitAmount) || 0,
        credit_amount: Number(b.creditAmount) || 0,
        final_balance: Number(b.finalBalance) || 0,
        final_balance_nature: b.finalNature,
        updated_at: nowIso,
      }));

    await this.supabase.from('account_balances').delete().eq('period_id', targetPeriodId);

    if (balancesPayload.length > 0) {
      const { error: balErr } = await this.supabase
        .from('account_balances')
        .insert(balancesPayload);

      if (balErr) throw new Error(`Erro ao salvar saldos: ${balErr.message}`);
    }

    return targetPeriodId;
  }

  async syncAllPeriodsWithChartOfAccounts(customAccounts: Omit<ChartAccount, 'id' | 'companyId'>[] = []): Promise<number> {
    const allAccounts = [...DEFAULT_CHART_OF_ACCOUNTS, ...customAccounts];
    const { data: periods, error: pErr } = await this.supabase
      .from('accounting_periods')
      .select('id, company_id');

    if (pErr || !periods || periods.length === 0) return 0;

    let totalAdded = 0;

    for (const period of periods) {
      const { data: existingBalances } = await this.supabase
        .from('account_balances')
        .select('account_id, chart_of_accounts ( code_reduced )')
        .eq('period_id', period.id);

      const presentCodes = new Set<number>();
      (existingBalances || []).forEach((b: any) => {
        if (b.chart_of_accounts?.code_reduced) {
          presentCodes.add(Number(b.chart_of_accounts.code_reduced));
        }
      });

      const missing = allAccounts.filter((a) => !presentCodes.has(a.codeReduced));
      if (missing.length === 0) continue;

      for (const m of missing) {
        const { data: existAcc } = await this.supabase
          .from('chart_of_accounts')
          .select('id')
          .eq('code_reduced', m.codeReduced)
          .maybeSingle();

        let accId = existAcc?.id;
        if (!accId) {
          const { data: createdAcc } = await this.supabase
            .from('chart_of_accounts')
            .insert({
              company_id: period.company_id,
              code_reduced: m.codeReduced,
              classification: m.classification,
              description: m.description,
              account_type: m.accountType,
              nature: m.nature,
              statement_group: m.statementGroup,
            })
            .select('id')
            .single();
          accId = createdAcc?.id;
        }

        if (accId) {
          await this.supabase.from('account_balances').insert({
            period_id: period.id,
            account_id: accId,
            initial_balance: 0,
            initial_balance_nature: m.nature,
            debit_amount: 0,
            credit_amount: 0,
            final_balance: 0,
            final_balance_nature: m.nature,
            updated_at: new Date().toISOString(),
          });
          totalAdded++;
        }
      }
    }

    return totalAdded;
  }

  async getSavedPeriods(): Promise<SavedPeriodSummary[]> {
    const { data, error } = await this.supabase
      .from('accounting_periods')
      .select(`
        id,
        company_id,
        accountant_id,
        description,
        start_date,
        end_date,
        status,
        source_type,
        created_at,
        companies ( corporate_name, cnpj, code ),
        accountants ( name, crc )
      `)
      .order('start_date', { ascending: false });

    if (error) throw new Error(error.message);

    const result: SavedPeriodSummary[] = [];

    for (const item of (data as any[] || [])) {
      const comp = Array.isArray(item.companies) ? item.companies[0] : item.companies;
      const acc = Array.isArray(item.accountants) ? item.accountants[0] : item.accountants;

      const record: SavedPeriodSummary = {
        id: String(item.id || ''),
        company_id: String(item.company_id || ''),
        accountant_id: String(item.accountant_id || ''),
        description: String(item.description || ''),
        start_date: String(item.start_date || ''),
        end_date: String(item.end_date || ''),
        status: (item.status as 'OPEN' | 'BALANCED' | 'CLOSED') || 'OPEN',
        source_type: (item.source_type as any) || 'MANUAL',
        created_at: String(item.created_at || ''),
        updated_at: String(item.created_at || ''),
      };

      if (comp) {
        record.company = {
          corporate_name: String(comp.corporate_name || ''),
          cnpj: String(comp.cnpj || ''),
          code: comp.code ? String(comp.code) : undefined,
        };
      }

      if (acc) {
        record.accountant = {
          name: String(acc.name || ''),
          crc: String(acc.crc || ''),
        };
      }

      result.push(record);
    }

    return result;
  }

  async getPeriodDetails(periodId: string): Promise<any> {
    const { data: period, error: pErr } = await this.supabase
      .from('accounting_periods')
      .select(`
        *,
        companies (*),
        accountants (*)
      `)
      .eq('id', periodId)
      .single();

    if (pErr) throw new Error(`Período não encontrado: ${pErr.message}`);

    const { data: balances, error: bErr } = await this.supabase
      .from('account_balances')
      .select(`
        *,
        chart_of_accounts (*)
      `)
      .eq('period_id', periodId);

    if (bErr) throw new Error(`Erro ao buscar saldos: ${bErr.message}`);

    return {
      period,
      balances: (balances || []).map((b: any) => ({
        id: String(b.id || ''),
        periodId: String(b.period_id || ''),
        accountId: String(b.account_id || ''),
        classification: String(b.chart_of_accounts?.classification || ''),
        description: String(b.chart_of_accounts?.description || ''),
        codeReduced: Number(b.chart_of_accounts?.code_reduced) || 0,
        statementGroup: (b.chart_of_accounts?.statement_group as any) || 'ATIVO',
        accountType: (b.chart_of_accounts?.account_type as any) || 'ANALITICA',
        initialBalance: Number(b.initial_balance) || 0,
        initialNature: b.initial_balance_nature || 'D',
        debitAmount: Number(b.debit_amount) || 0,
        creditAmount: Number(b.credit_amount) || 0,
        finalBalance: Number(b.final_balance) || 0,
        finalNature: b.final_balance_nature || 'D',
      })),
    };
  }

  async deletePeriod(periodId: string): Promise<void> {
    const { error: bErr } = await this.supabase
      .from('account_balances')
      .delete()
      .eq('period_id', periodId);

    if (bErr) throw new Error(`Erro ao deletar saldos: ${bErr.message}`);

    const { error: pErr } = await this.supabase
      .from('accounting_periods')
      .delete()
      .eq('id', periodId);

    if (pErr) throw new Error(`Erro ao deletar período: ${pErr.message}`);
  }
}