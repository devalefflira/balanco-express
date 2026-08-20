import { createClient } from '@/infrastructure/supabase/client';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';

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
      isBalanced,
      sourceType = 'MANUAL',
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

    // 1. Cria ou atualiza o período contábil
    let targetPeriodId: string = periodId ?? '';

    if (!targetPeriodId || targetPeriodId === 'current-period' || targetPeriodId === 'imported-temp') {
      const { data: newPeriod, error: periodErr } = await this.supabase
        .from('accounting_periods')
        .insert({
          company_id: validCompanyId,
          accountant_id: validAccountantId,
          description,
          start_date: startDate,
          end_date: endDate,
          status: isBalanced ? 'BALANCED' : 'OPEN',
          source_type: sourceType,
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
          status: isBalanced ? 'BALANCED' : 'OPEN',
          source_type: sourceType,
        })
        .eq('id', targetPeriodId);

      if (updateErr) throw new Error(`Erro ao atualizar período: ${updateErr.message}`);
    }

    // 2. Busca contas existentes para esta empresa
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

    // 3. Cadastra as contas que ainda não existem
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

    // 4. Prepara o payload dos saldos garantindo UUIDs válidos
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
        updated_at: new Date().toISOString(),
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
      .order('created_at', { ascending: false });

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
        source_type: (item.source_type as 'MANUAL' | 'IMPORTED') || 'MANUAL',
        created_at: String(item.created_at || ''),
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
    const { error } = await this.supabase
      .from('accounting_periods')
      .delete()
      .eq('id', periodId);

    if (error) throw new Error(error.message);
  }
}