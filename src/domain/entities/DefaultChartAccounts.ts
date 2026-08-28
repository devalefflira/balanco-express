import { ChartAccount } from './ChartAccount';

export const DEFAULT_CHART_OF_ACCOUNTS: Omit<ChartAccount, 'id' | 'companyId'>[] = [
  // ==========================================
  // 1. ATIVO
  // ==========================================
  { codeReduced: 7, classification: '1', description: 'Ativo', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 1 },
  { codeReduced: 14, classification: '1-1', description: 'Ativo Circulante', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 2 },
  
  // 1-1-01 Disponível
  { codeReduced: 42, classification: '1-1-01', description: 'Disponível', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 35, classification: '1-1-01-01', description: 'Caixa', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  
  // 1-1-02 Banco Conta Movimento
  { codeReduced: 21, classification: '1-1-02', description: 'Banco conta movimento', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 91, classification: '1-1-02-02', description: 'Bradesco S/A.', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 1932, classification: '1-1-02-04', description: 'Banco Santander', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 2191, classification: '1-1-02-05', description: 'Sicoob', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 2985, classification: '1-1-02-10', description: 'Banco Tribanco', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-03 Banco Conta Aplicação
  { codeReduced: 70, classification: '1-1-03', description: 'Banco conta aplicação', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 63, classification: '1-1-03-02', description: 'Bradesco S/A', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 1946, classification: '1-1-03-04', description: 'Banco Santander', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 2998, classification: '1-1-03-10', description: 'Banco Tribanco', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-04 Clientes
  { codeReduced: 98, classification: '1-1-04', description: 'Clientes', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 2238, classification: '1-1-04-05', description: 'Clientes a receber', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-06 Contas Correntes Empregados
  { codeReduced: 112, classification: '1-1-06', description: 'Contas correntes empregados', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 119, classification: '1-1-06-01', description: 'Adiantamento 13º Salário', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 126, classification: '1-1-06-03', description: 'Adiantamento salários', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-07 Crédito de Sócios
  { codeReduced: 168, classification: '1-1-07', description: 'Crédito de sócios', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 3107, classification: '1-1-07-46', description: 'Jose Carlos Machado Dias', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-09 Impostos a Recuperar
  { codeReduced: 196, classification: '1-1-09', description: 'Impostos a recuperar', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 203, classification: '1-1-09-01', description: 'ICMS a recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 217, classification: '1-1-09-03', description: 'IRRF a recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 224, classification: '1-1-09-05', description: 'INSS a Recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 231, classification: '1-1-09-12', description: 'CSLL a Recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 525, classification: '1-1-09-13', description: 'PIS a Recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 1764, classification: '1-1-09-14', description: 'COFINS a Recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 238, classification: '1-1-09-16', description: 'IRPJ a recuperar', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-1-10 Estoques
  { codeReduced: 280, classification: '1-1-10', description: 'Estoques', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 287, classification: '1-1-10-01', description: 'Mercadorias p/ Revenda', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },

  // 1-2. ATIVO NÃO CIRCULANTE
  { codeReduced: 511, classification: '1-2', description: 'Ativo não circulante', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 2 },
  { codeReduced: 420, classification: '1-2-03', description: 'Imobilizado', accountType: 'SINTETICA', nature: 'D', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 434, classification: '1-2-03-02', description: 'Móveis e utensilios', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 441, classification: '1-2-03-03', description: 'Instalações', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 448, classification: '1-2-03-04', description: 'Máquinas, equip. e ferramentas', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 455, classification: '1-2-03-05', description: 'Veículos', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 462, classification: '1-2-03-06', description: 'Consórcio de veículos', accountType: 'ANALITICA', nature: 'D', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 469, classification: '1-2-04', description: 'Depreciação', accountType: 'SINTETICA', nature: 'C', statementGroup: 'ATIVO', level: 3 },
  { codeReduced: 476, classification: '1-2-04-01', description: 'Deprec. móveis e utensílios', accountType: 'ANALITICA', nature: 'C', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 483, classification: '1-2-04-02', description: 'Deprec. instalações', accountType: 'ANALITICA', nature: 'C', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 490, classification: '1-2-04-03', description: 'Deprec. máquinas, equip. e ferramentas', accountType: 'ANALITICA', nature: 'C', statementGroup: 'ATIVO', level: 4 },
  { codeReduced: 504, classification: '1-2-04-05', description: 'Deprec, veículos', accountType: 'ANALITICA', nature: 'C', statementGroup: 'ATIVO', level: 4 },

  // ==========================================
  // 2. PASSIVO
  // ==========================================
  { codeReduced: 644, classification: '2', description: 'Passivo', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 1 },
  { codeReduced: 651, classification: '2-1', description: 'Passivo Circulante', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 2 },
  { codeReduced: 658, classification: '2-1-01', description: 'Empréstimo p/ capital de giro', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 672, classification: '2-1-01-02', description: 'Bradesco S/A.', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 705, classification: '2-1-01-07', description: 'Banco Santander', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 711, classification: '2-1-01-08', description: 'Banco Sicoob', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 717, classification: '2-1-01-09', description: 'Banco Tribanco', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 723, classification: '2-1-01-10', description: 'Crédito Consignado - Intermédio CEF/FGTS', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 700, classification: '2-1-02', description: 'Fornecedores', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 1729, classification: '2-1-02-06', description: 'Fornecedores', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 728, classification: '2-1-03', description: 'Imposto a pagar/recolher', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 735, classification: '2-1-03-01', description: 'ICMS a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 742, classification: '2-1-03-04', description: 'IRRF S/salário/pro-labore', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 770, classification: '2-1-03-06', description: 'PIS s/ receita bruta', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 777, classification: '2-1-03-07', description: 'COFINS a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 749, classification: '2-1-03-09', description: 'CSLL a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 756, classification: '2-1-03-12', description: 'IRPJ a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 812, classification: '2-1-04', description: 'Salários e contribuições previdenciárias', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 819, classification: '2-1-04-01', description: 'Ordenados e salários a pagar', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 826, classification: '2-1-04-02', description: 'Pró-labore a pagar', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 833, classification: '2-1-04-03', description: 'INSS a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 840, classification: '2-1-04-05', description: 'FGTS a recolher', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 855, classification: '2-1-04-08', description: 'Rescisões a pagar', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 910, classification: '2-1-08', description: 'Provisões', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 917, classification: '2-1-08-01', description: '13º Salário a pagar', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 924, classification: '2-1-08-02', description: 'Férias a pagar', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 2632, classification: '2-1-09', description: 'Outras Contas', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 2681, classification: '2-1-09-06', description: 'Parcelamento INSS - PGFN', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 2688, classification: '2-1-09-07', description: 'Parcelamento INSS', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 3103, classification: '2-1-11', description: 'Parcelamentos', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 3109, classification: '2-1-11-01', description: 'Parcelamento DARF', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },

  // 2-2. PASSIVO NÃO CIRCULANTE
  { codeReduced: 2569, classification: '2-2', description: 'Passivo não Circulante', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 2 },
  { codeReduced: 2576, classification: '2-2-01', description: 'Empréstimo Bancário a longo prazo', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PASSIVO', level: 3 },
  { codeReduced: 2607, classification: '2-2-01-05', description: 'Empréstimo Sicoob', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 2614, classification: '2-2-01-08', description: 'Empréstimo Bradesco', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 2613, classification: '2-2-01-09', description: 'Empréstimo Tribanco', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },
  { codeReduced: 2615, classification: '2-2-01-10', description: 'Fornecedores / Financiamentos Longo Prazo', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PASSIVO', level: 4 },

  // 2-4. PATRIMÔNIO LÍQUIDO
  { codeReduced: 931, classification: '2-4', description: 'Patrimônio líquido', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PL', level: 2 },
  { codeReduced: 938, classification: '2-4-01', description: 'Capital Social', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PL', level: 3 },
  { codeReduced: 939, classification: '2-4-01-01', description: 'Capital Social', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PL', level: 4 },
  { codeReduced: 966, classification: '2-4-04', description: 'Reserva de capital', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PL', level: 3 },
  { codeReduced: 1939, classification: '2-4-04-03', description: 'Fundo p/Aumento de Capital', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PL', level: 4 },
  { codeReduced: 1008, classification: '2-4-06', description: 'Reservas de lucros', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PL', level: 3 },
  { codeReduced: 2471, classification: '2-4-06-04', description: 'Reserva Legal', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PL', level: 4 },
  { codeReduced: 2478, classification: '2-4-06-05', description: 'Reserva para Contingências', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PL', level: 4 },
  { codeReduced: 1023, classification: '2-4-08', description: 'Prejuízos acumulados', accountType: 'SINTETICA', nature: 'C', statementGroup: 'PL', level: 3 },
  { codeReduced: 1029, classification: '2-4-08-01', description: 'Lucro / Prejuízo do Período', accountType: 'ANALITICA', nature: 'C', statementGroup: 'PL', level: 4 },
  { codeReduced: 1043, classification: '2-4-08-02', description: 'Prejuízo Acumulado', accountType: 'ANALITICA', nature: 'D', statementGroup: 'PL', level: 4 },

  // ==========================================
  // 3. RECEITAS (DRE)
  // ==========================================
  { codeReduced: 1176, classification: '3', description: 'Receita', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 1 },
  { codeReduced: 1183, classification: '3-1', description: 'Receita bruta s/ vendas e serviços', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 2 },
  { codeReduced: 1190, classification: '3-1-01', description: 'Receita bruta de venda', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 3 },
  { codeReduced: 1211, classification: '3-1-01-03', description: 'Revenda de mercadorias', accountType: 'ANALITICA', nature: 'C', statementGroup: 'RECEITA', level: 4 },

  // Deduções da Receita Bruta (Exclusivo Tributos e Devoluções)
  { codeReduced: 1232, classification: '3-2', description: 'Dedução de receita bruta vendas/serviços', accountType: 'SINTETICA', nature: 'D', statementGroup: 'RECEITA', level: 2 },
  { codeReduced: 1239, classification: '3-2-01', description: 'Dedução de receita bruta de vendas', accountType: 'SINTETICA', nature: 'D', statementGroup: 'RECEITA', level: 3 },
  { codeReduced: 1260, classification: '3-2-01-03', description: 'ICMS', accountType: 'ANALITICA', nature: 'D', statementGroup: 'RECEITA', level: 4 },
  { codeReduced: 1267, classification: '3-2-01-04', description: 'COFINS', accountType: 'ANALITICA', nature: 'D', statementGroup: 'RECEITA', level: 4 },
  { codeReduced: 1274, classification: '3-2-01-05', description: 'PIS s/ vendas e servicos', accountType: 'ANALITICA', nature: 'D', statementGroup: 'RECEITA', level: 4 },
  { codeReduced: 1280, classification: '3-2-01-06', description: 'Devolução de Mercadoria', accountType: 'ANALITICA', nature: 'D', statementGroup: 'RECEITA', level: 4 },

  // ==========================================
  // 4. CUSTO DAS MERCADORIAS VENDIDAS (CUSTO)
  // ==========================================
  { codeReduced: 1967, classification: '3-3', description: 'Custo Mercadoria Vendida', accountType: 'SINTETICA', nature: 'D', statementGroup: 'CUSTO', level: 2 },
  { codeReduced: 1974, classification: '3-3-01', description: 'Custo Mercadoria Vendida', accountType: 'ANALITICA', nature: 'D', statementGroup: 'CUSTO', level: 3 },

  // Receitas Operacionais e Não Operacionais
  { codeReduced: 1295, classification: '3-4', description: 'Receita operacional', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 2 },
  { codeReduced: 1302, classification: '3-4-01', description: 'Receita financeira', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 3 },
  { codeReduced: 1357, classification: '3-4-01-01', description: 'Receita invest facil/ CDB', accountType: 'ANALITICA', nature: 'C', statementGroup: 'RECEITA', level: 4 },
  { codeReduced: 1421, classification: '3-5', description: 'Receitas não operacionais', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 2 },
  { codeReduced: 1428, classification: '3-5-01', description: 'Rendas eventuais', accountType: 'SINTETICA', nature: 'C', statementGroup: 'RECEITA', level: 3 },
  { codeReduced: 1442, classification: '3-5-01-02', description: 'Bonificação em mercadoria', accountType: 'ANALITICA', nature: 'C', statementGroup: 'RECEITA', level: 4 },

  // ==========================================
  // 5. DESPESAS OPERACIONAIS
  // ==========================================
  { codeReduced: 1449, classification: '4', description: 'Despesas Operacionais', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 1 },
  { codeReduced: 1456, classification: '4-1', description: 'Despesas Operacionais', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 2 },
  { codeReduced: 1463, classification: '4-1-01', description: 'Despesas C/Pessoal', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 3 },
  { codeReduced: 1512, classification: '4-1-01-02', description: 'Salários e ordenados', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1540, classification: '4-1-01-06', description: 'Férias', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1547, classification: '4-1-01-07', description: '13º Salário', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1554, classification: '4-1-01-08', description: 'INSS', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1575, classification: '4-1-01-11', description: 'FGTS', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1472, classification: '4-1-01-18', description: 'Multa Rescisoria', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1474, classification: '4-1-01-20', description: 'Rescisão', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },

  // Despesas Administrativas
  { codeReduced: 1477, classification: '4-1-02', description: 'Despesas Administrativas', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 3 },
  { codeReduced: 1848, classification: '4-1-02-04', description: 'Pró-labore', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1631, classification: '4-1-02-05', description: 'Combustível', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1624, classification: '4-1-02-06', description: 'Serviço de terceiros', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1743, classification: '4-1-02-08', description: 'Energia Elétrica', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1750, classification: '4-1-02-09', description: 'Telefone e Internet', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1757, classification: '4-1-02-10', description: 'Água / Esgoto', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1960, classification: '4-1-02-12', description: 'Materiais de consumo/diversos', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1482, classification: '4-1-02-21', description: 'Impostos e Taxas', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1488, classification: '4-1-02-26', description: 'Honorario Contabil', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1490, classification: '4-1-02-28', description: 'Devoluções', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 1492, classification: '4-1-02-29', description: 'Depreciações e Amortizações', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 2345, classification: '4-1-02-50', description: 'Sistemas e Consultorias', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 2954, classification: '4-1-02-51', description: 'Plano de Saúde', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },

  // Despesas Tributárias
  { codeReduced: 2219, classification: '4-1-03', description: 'Despesas Tributárias', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 3 },
  { codeReduced: 2228, classification: '4-1-03-07', description: 'Multas e Juros', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 2230, classification: '4-1-03-09', description: 'IRPJ', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
  { codeReduced: 2231, classification: '4-1-03-10', description: 'CSLL', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },

  // Despesas Financeiras
  { codeReduced: 1638, classification: '4-2', description: 'Despesa Financeira', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 2 },
  { codeReduced: 1680, classification: '4-2-03', description: 'Despesas Bancarias', accountType: 'SINTETICA', nature: 'D', statementGroup: 'DESPESA', level: 3 },
  { codeReduced: 1687, classification: '4-2-03-01', description: 'Juros e despesas bancárias', accountType: 'ANALITICA', nature: 'D', statementGroup: 'DESPESA', level: 4 },
];