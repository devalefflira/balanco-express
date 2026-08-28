import { NextResponse } from 'next/server';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/domain/entities/DefaultChartAccounts';

// Expressão regular robusta para extração de linhas de balancete/balanço
const BALANCE_REGEX = /\[?(\d{1,5})\]?\s+([1-4](?:-\d{1,2})*)\s+(.+?)\s+([\d.,]+)[DC]?\s+([\d.,]+)[DC]?\s+([\d.,]+)[DC]?\s+([\d.,]+)([DC]?)/g;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo PDF enviado.' }, { status: 400 });
    }

    // Processamento do PDF via lib externa (ex: pdf-parse)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Simulação da extração de texto do PDF
    const textContent = buffer.toString('utf-8'); 
    
    const parsedAccounts = [];
    let match;

    // Isola o mapeamento apenas para contas analíticas do plano padrão
    const analyticalAccounts = new Map(
      DEFAULT_CHART_OF_ACCOUNTS
        .filter(acc => acc.accountType === 'ANALITICA')
        .map(acc => [acc.codeReduced, acc])
    );

    // Faz a varredura no texto extraído
    while ((match = BALANCE_REGEX.exec(textContent)) !== null) {
      const codeReduced = parseInt(match[1], 10);
      
      // Filtro de Segurança: Só adiciona se for uma conta Analítica conhecida
      if (analyticalAccounts.has(codeReduced)) {
        const parseValue = (valStr: string) => {
          if (!valStr) return 0;
          return parseFloat(valStr.replace(/\./g, '').replace(',', '.'));
        };

        const initialBalance = parseValue(match[4]);
        const debitAmount = parseValue(match[5]);
        const creditAmount = parseValue(match[6]);
        const finalBalance = parseValue(match[7]);
        const finalNature = match[8] || analyticalAccounts.get(codeReduced)?.nature;

        parsedAccounts.push({
          codeReduced,
          classification: match[2],
          description: match[3].trim(),
          initialBalance,
          debitAmount,
          creditAmount,
          finalBalance,
          finalNature
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PDF processado com sucesso. Apenas contas analíticas foram importadas.',
      data: parsedAccounts,
    });

  } catch (error: any) {
    console.error('Erro no parser de PDF:', error);
    return NextResponse.json(
      { error: 'Falha ao processar o arquivo PDF.', details: error.message },
      { status: 500 }
    );
  }
}