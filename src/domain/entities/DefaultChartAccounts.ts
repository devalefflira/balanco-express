import { ChartAccount } from './ChartAccount';

export const DEFAULT_CHART_OF_ACCOUNTS: ChartAccount[] = [
  // ==========================================
  // 1. ATIVO
  // ==========================================
  { codeReduced: 7, classification: '1', description: 'Ativo', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 1 },
  { codeReduced: 14, classification: '1-1', description: 'Ativo Circulante', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 2 },
  
  // 1-1-01 Disponível
  { codeReduced: 42, classification: '1-1-01', description: 'Disponível', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 35, classification: '1-1-01-01', description: 'Caixa', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  
  // 1-1-02 Banco Conta Movimento
  { codeReduced: 21, classification: '1-1-02', description: 'Banco conta movimento', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 91, classification: '1-1-02-02', description: 'Bradesco S/A.', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 1932, classification: '1-1-02-04', description: 'Banco Santander', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2191, classification: '1-1-02-05', description: 'Sicoob', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2985, classification: '1-1-02-10', description: 'Banco Tribanco', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-1-03 Banco Conta Aplicação
  { codeReduced: 70, classification: '1-1-03', description: 'Banco conta aplicação', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 63, classification: '1-1-03-02', description: 'Bradesco S/A', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1946, classification: '1-1-03-04', description: 'Banco Santander', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2998, classification: '1-1-03-10', description: 'Banco Tribanco', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-1-04 Clientes
  { codeReduced: 98, classification: '1-1-04', description: 'Clientes', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 2238, classification: '1-1-04-05', description: 'Clientes a receber', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-1-06 Contas Correntes Empregados
  { codeReduced: 112, classification: '1-1-06', description: 'Contas correntes empregados', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 119, classification: '1-1-06-01', description: 'Adiantamento 13º Salário', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 126, classification: '1-1-06-03', description: 'Adiantamento salários', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-1-07 Crédito de Sócios
  { codeReduced: 168, classification: '1-1-07', description: 'Crédito de sócios', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 3107, classification: '1-1-07-46', description: 'Jose Carlos Machado Dias', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 1-1-09 Impostos a Recuperar
  { codeReduced: 196, classification: '1-1-09', description: 'Impostos a recuperar', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 203, classification: '1-1-09-01', description: 'ICMS a recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 217, classification: '1-1-09-03', description: 'IRRF a recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 224, classification: '1-1-09-05', description: 'INSS a Recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 231, classification: '1-1-09-12', description: 'CSLL a Recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 525, classification: '1-1-09-13', description: 'PIS a Recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1764, classification: '1-1-09-14', description: 'COFINS a Recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 238, classification: '1-1-09-16', description: 'IRPJ a recuperar', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-1-10 Estoques
  { codeReduced: 280, classification: '1-1-10', description: 'Estoques', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 287, classification: '1-1-10-01', description: 'Mercadorias p/ Revenda', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 1-2 ATIVO NÃO CIRCULANTE
  { codeReduced: 511, classification: '1-2', description: 'Ativo não circulante', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 2 },
  { codeReduced: 420, classification: '1-2-03', description: 'Imobilizado', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 434, classification: '1-2-03-02', description: 'Móveis e utensilios', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 441, classification: '1-2-03-03', description: 'Instalações', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 448, classification: '1-2-03-04', description: 'Máquinas, equip. e ferramentas', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 455, classification: '1-2-03-05', description: 'Veículos', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 462, classification: '1-2-03-06', description: 'Consórcio de veículos', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  { codeReduced: 469, classification: '1-2-04', description: 'Depreciação', statementGroup: 'ATIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 476, classification: '1-2-04-01', description: 'Deprec. móveis e utensílios', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 483, classification: '1-2-04-02', description: 'Deprec. instalações', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 490, classification: '1-2-04-03', description: 'Deprec. máquinas, equip. e ferramentas', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 504, classification: '1-2-04-05', description: 'Deprec, veículos', statementGroup: 'ATIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // ==========================================
  // 2. PASSIVO
  // ==========================================
  { codeReduced: 644, classification: '2', description: 'Passivo', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 1 },
  { codeReduced: 651, classification: '2-1', description: 'Passivo Circulante', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 2 },

  // 2-1-01 Empréstimo p/ Capital de Giro
  { codeReduced: 658, classification: '2-1-01', description: 'Empréstimo p/ capital de giro', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 672, classification: '2-1-01-02', description: 'Bradesco S/A.', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 705, classification: '2-1-01-07', description: 'Banco Santander', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 711, classification: '2-1-01-08', description: 'Banco Sicoob', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 717, classification: '2-1-01-09', description: 'Banco Tribanco', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 723, classification: '2-1-01-10', description: 'Crédito Consignado - Intermédio CEF/FGTS', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-1-02 Fornecedores
  { codeReduced: 700, classification: '2-1-02', description: 'Fornecedores', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1729, classification: '2-1-02-06', description: 'Fornecedores', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-1-03 Imposto a pagar/recolher
  { codeReduced: 728, classification: '2-1-03', description: 'Imposto a pagar/recolher', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 735, classification: '2-1-03-01', description: 'ICMS a recolher', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 742, classification: '2-1-03-04', description: 'IRRF S/salário/pro-labore', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 749, classification: '2-1-03-09', description: 'CSLL a recolher', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 756, classification: '2-1-03-12', description: 'IRPJ a recolher', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-1-04 Salários e contribuições previdenciárias
  { codeReduced: 812, classification: '2-1-04', description: 'Salários e contribuições previdenciárias', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 819, classification: '2-1-04-01', description: 'Ordenados e salários a pagar', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 826, classification: '2-1-04-02', description: 'Pró-labore a pagar', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 833, classification: '2-1-04-03', description: 'INSS a recolher', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 840, classification: '2-1-04-05', description: 'FGTS a recolher', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 855, classification: '2-1-04-08', description: 'Rescisões a pagar', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-1-08 Provisões
  { codeReduced: 910, classification: '2-1-08', description: 'Provisões', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 917, classification: '2-1-08-01', description: '13º Salário a pagar', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 924, classification: '2-1-08-02', description: 'Férias a pagar', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-1-09 Outras Contas
  { codeReduced: 2632, classification: '2-1-09', description: 'Outras Contas', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 2681, classification: '2-1-09-06', description: 'Parcelamento INSS - PGFN', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2688, classification: '2-1-09-07', description: 'Parcelamento INSS', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 2-1-11 Parcelamentos
  { codeReduced: 3103, classification: '2-1-11', description: 'Parcelamentos', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 3109, classification: '2-1-11-01', description: 'Parcelamento DARF', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // 2-2 PASSIVO NÃO CIRCULANTE
  { codeReduced: 2569, classification: '2-2', description: 'Passivo não Circulante', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 2 },
  { codeReduced: 2576, classification: '2-2-01', description: 'Empréstimo Bancário a longo prazo', statementGroup: 'PASSIVO', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 2607, classification: '2-2-01-05', description: 'Empréstimo Sicoob', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 2613, classification: '2-2-01-09', description: 'Empréstimo Tribanco', statementGroup: 'PASSIVO', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // 2-4 PATRIMÔNIO LÍQUIDO
  { codeReduced: 931, classification: '2-4', description: 'Patrimônio líquido', statementGroup: 'PL', accountType: 'SINTETICA', nature: 'C', level: 2 },
  { codeReduced: 938, classification: '2-4-01', description: 'Capital Social', statementGroup: 'PL', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 939, classification: '2-4-01-01', description: 'Capital Social', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 966, classification: '2-4-04', description: 'Reserva de capital', statementGroup: 'PL', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1939, classification: '2-4-04-03', description: 'Fundo p/Aumento de Capital', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 1008, classification: '2-4-06', description: 'Reservas de lucros', statementGroup: 'PL', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 2471, classification: '2-4-06-04', description: 'Reserva Legal', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 2478, classification: '2-4-06-05', description: 'Reserva para Contingências', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1023, classification: '2-4-08', description: 'Prejuízos acumulados', statementGroup: 'PL', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1029, classification: '2-4-08-01', description: 'Lucro', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'C', level: 4 },
  { codeReduced: 1043, classification: '2-4-08-02', description: 'Prejuízo Acumulado', statementGroup: 'PL', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // ==========================================
  // 3. RECEITAS E CUSTOS (DRE / BALANCETE)
  // ==========================================
  { codeReduced: 1176, classification: '3', description: 'Receita', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 1 },
  { codeReduced: 1183, classification: '3-1', description: 'Receita bruta s/ vendas e serviços', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 2 },
  { codeReduced: 1190, classification: '3-1-01', description: 'Receita bruta de venda', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1211, classification: '3-1-01-03', description: 'Revenda de mercadorias', statementGroup: 'RECEITA', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // Deduções e Custo
  { codeReduced: 1232, classification: '3-2', description: 'Dedução de receita bruta vendas/serviços', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'D', level: 2 },
  { codeReduced: 1239, classification: '3-2-01', description: 'Dedução de receita bruta de vendas', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 1260, classification: '3-2-01-03', description: 'ICMS', statementGroup: 'RECEITA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1280, classification: '3-2-01-06', description: 'Devolução de Mercadoria', statementGroup: 'RECEITA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  
  { codeReduced: 1967, classification: '3-2-03', description: 'Custo Mercadoria Vendida', statementGroup: 'CUSTO', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 1974, classification: '3-2-03-03', description: 'Custo Mercadoria Vendida', statementGroup: 'CUSTO', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // Receitas Operacionais e Financeiras
  { codeReduced: 1295, classification: '3-4', description: 'Receita operacional', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 2 },
  { codeReduced: 1302, classification: '3-4-01', description: 'Receita financeira', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1357, classification: '3-4-01-01', description: 'Receita invest facil/ CDB', statementGroup: 'RECEITA', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // Receitas Não Operacionais
  { codeReduced: 1421, classification: '3-5', description: 'Receitas não operacionais', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 2 },
  { codeReduced: 1428, classification: '3-5-01', description: 'Rendas eventuais', statementGroup: 'RECEITA', accountType: 'SINTETICA', nature: 'C', level: 3 },
  { codeReduced: 1442, classification: '3-5-01-02', description: 'Bonificação em mercadoria', statementGroup: 'RECEITA', accountType: 'ANALITICA', nature: 'C', level: 4 },

  // ==========================================
  // 4. DESPESAS OPERACIONAIS (DRE / BALANCETE)
  // ==========================================
  { codeReduced: 1449, classification: '4', description: 'Despesas Operacionais', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 1 },
  { codeReduced: 1456, classification: '4-1', description: 'Despesas Operacionais', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 2 },

  // Despesas C/Pessoal
  { codeReduced: 1463, classification: '4-1-01', description: 'Despesas C/Pessoal', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 1512, classification: '4-1-01-02', description: 'Salários e ordenados', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1540, classification: '4-1-01-06', description: 'Férias', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1547, classification: '4-1-01-07', description: '13º Salário', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1554, classification: '4-1-01-08', description: 'INSS', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1575, classification: '4-1-01-11', description: 'FGTS', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1472, classification: '4-1-01-18', description: 'Multa Rescisoria', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1474, classification: '4-1-01-20', description: 'Rescisão', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // Despesas Administrativas
  { codeReduced: 1477, classification: '4-1-02', description: 'Despesas Admistrativas', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 1848, classification: '4-1-02-04', description: 'Pró-labore', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1631, classification: '4-1-02-05', description: 'Combustível', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1624, classification: '4-1-02-06', description: 'Serviço de terceiros', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1743, classification: '4-1-02-08', description: 'Energia Eletrica', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1750, classification: '4-1-02-09', description: 'Telefone e Internet', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1757, classification: '4-1-02-10', description: 'Água / Esgoto', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1960, classification: '4-1-02-12', description: 'Materiais de consumo/diversos', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1482, classification: '4-1-02-21', description: 'Impostos e Taxas', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1488, classification: '4-1-02-26', description: 'Honorario Contabil', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1490, classification: '4-1-02-28', description: 'Devoluções', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 1492, classification: '4-1-02-29', description: 'Depreciacoes e Amortizacoes', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2345, classification: '4-1-02-50', description: 'Sistemas e Consultorias', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2954, classification: '4-1-02-51', description: 'Plano de Saúde', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // Despesas Tributárias
  { codeReduced: 2219, classification: '4-1-03', description: 'Despesas tributárias', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 2228, classification: '4-1-03-07', description: 'Multas e Juros', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2230, classification: '4-1-03-09', description: 'IRPJ', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
  { codeReduced: 2231, classification: '4-1-03-10', description: 'CSLL', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },

  // Despesas Financeiras
  { codeReduced: 1638, classification: '4-2', description: 'Despesa Financeira', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 2 },
  { codeReduced: 1680, classification: '4-2-03', description: 'Despesas Bancarias', statementGroup: 'DESPESA', accountType: 'SINTETICA', nature: 'D', level: 3 },
  { codeReduced: 1687, classification: '4-2-03-01', description: 'Juros e despesas bancárias', statementGroup: 'DESPESA', accountType: 'ANALITICA', nature: 'D', level: 4 },
];