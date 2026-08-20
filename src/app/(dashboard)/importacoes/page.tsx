'use client';

import React, { useState } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingParser, ParsedAccountingData } from '@/domain/services/AccountingParser';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileText, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';

export default function ImportacoesPage() {
  const { importBalancesAndSave, isLoading } = useAccounting();
  const router = useRouter();

  const [rawText, setRawText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedAccountingData | null>(null);
  const [parsingPdf, setParsingPdf] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleProcessText = (textToProcess: string) => {
    if (!textToProcess.trim()) return;
    const parsed = AccountingParser.parseRawText(textToProcess);
    setParsedData(parsed);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      setParsingPdf(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao processar PDF');

        setRawText(data.text);
        handleProcessText(data.text);
      } catch (err: any) {
        console.error('Erro ao ler PDF:', err);
        alert('Não foi possível ler o PDF diretamente. Copie e cole o texto no campo abaixo.');
      } finally {
        setParsingPdf(false);
      }
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = (event.target?.result as string) || '';
        setRawText(content);
        handleProcessText(content);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;
    try {
      await importBalancesAndSave(parsedData.balances, parsedData.period, parsedData.company);
      setSuccessMsg('Balanço importado e salvo com sucesso!');
      setTimeout(() => {
        router.push('/lancamentos-salvos');
      }, 1200);
    } catch (err: any) {
      alert(`Falha ao importar: ${err.message}`);
    }
  };

  const nonZeroBalances = parsedData?.balances.filter((b) => b.finalBalance > 0 || b.debitAmount > 0) || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <UploadCloud className="w-6 h-6 text-blue-600" />
          Importação de Balanços e Balancetes
        </h1>
        <p className="text-xs text-gray-500">
          Envie o PDF ou cole o texto do demonstrativo para extrair automaticamente o período, contas e saldos.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Bloco 1: Upload / Entrada */}
        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-700">1. Arquivo ou Conteúdo do Relatório</h2>

          <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-gray-50/50">
            {parsingPdf ? (
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
            ) : (
              <UploadCloud className="w-8 h-8 text-blue-600 mb-2" />
            )}
            <span className="text-xs font-semibold text-gray-700">
              {parsingPdf ? 'Extraindo texto do PDF no servidor...' : 'Selecione o arquivo PDF ou TXT'}
            </span>
            <span className="text-[11px] text-gray-400">ou arraste e solte aqui</span>
            <input type="file" accept=".pdf,.txt,.csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Ou cole o texto do Balanço / Balancete:
            </label>
            <textarea
              rows={7}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole aqui o conteúdo contábil..."
              className="w-full p-3 border rounded-lg text-xs font-mono focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={() => handleProcessText(rawText)}
            disabled={!rawText || parsingPdf}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition disabled:opacity-50"
          >
            Processar e Mapear Dados
          </button>
        </div>

        {/* Bloco 2: Preview dos Dados Parseados */}
        <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-700">2. Prévia dos Dados Identificados</h2>

            {parsedData ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg space-y-1">
                  <p className="font-bold text-blue-900">{parsedData.company.corporateName}</p>
                  <p className="text-gray-600 font-mono">CNPJ: {parsedData.company.cnpj}</p>
                  <p className="text-gray-700 font-mono font-semibold">
                    Período: {parsedData.period.startDate.split('-').reverse().join('/')} a{' '}
                    {parsedData.period.endDate.split('-').reverse().join('/')}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border rounded-lg space-y-1 text-gray-700 font-mono text-[11px]">
                  <p>
                    <strong>Total de Contas Preenchidas:</strong> {nonZeroBalances.length} contas com valor
                  </p>
                  <p>
                    <strong>Responsável:</strong> {parsedData.accountant?.name || 'JAMAILA FONSECA'}
                  </p>
                  <p>
                    <strong>Origem da gravação:</strong> <span className="text-purple-600 font-bold">Importado</span>
                  </p>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-gray-50/30 text-[11px]">
                  <p className="font-bold text-gray-700 mb-1">Amostra de Saldos Identificados:</p>
                  {nonZeroBalances.slice(0, 5).map((b) => (
                    <div key={b.codeReduced} className="flex justify-between border-b py-0.5">
                      <span>{b.description}</span>
                      <span className="font-mono font-semibold">
                        {formatCurrency(b.finalBalance)} {b.finalNature}
                      </span>
                    </div>
                  ))}
                  {nonZeroBalances.length > 5 && (
                    <p className="text-gray-400 text-[10px] mt-1">+ {nonZeroBalances.length - 5} outras contas</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 space-y-2">
                <FileText className="w-10 h-10 text-gray-300" />
                <p className="text-xs">Nenhum dado processado ainda.</p>
              </div>
            )}
          </div>

          {parsedData && (
            <button
              onClick={handleConfirmImport}
              disabled={isLoading}
              className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50 shadow"
            >
              {isLoading ? 'Salvando no Banco...' : 'Confirmar e Salvar em Lançamentos'}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}