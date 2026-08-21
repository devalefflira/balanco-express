'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingParser, ParsedAccountingData } from '@/domain/services/AccountingParser';
import { AccountingBalance } from '@/domain/entities/AccountingBalance';
import { formatCurrency } from '@/lib/formatters';
import { UploadCloud, FileSpreadsheet, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function ImportacoesPage() {
  const router = useRouter();
  const { importBalancesAndSave, isLoading: contextLoading } = useAccounting();

  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedAccountingData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const parsed = AccountingParser.parseExcelBuffer(buffer, file.name);
        setParsedData(parsed);
        setRawText(`[Balancete Analítico Excel Carregado: ${file.name}]`);
      } else if (fileName.endsWith('.pdf')) {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || 'Falha ao extrair texto do PDF');
        }

        const data = await res.json();
        setRawText(data.text);
        const parsed = AccountingParser.parseRawText(data.text);
        setParsedData(parsed);
      } else {
        const text = await file.text();
        setRawText(text);
        const parsed = AccountingParser.parseRawText(text);
        setParsedData(parsed);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar o arquivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualProcess = () => {
    if (!rawText.trim()) {
      setErrorMessage('Cole ou envie o texto do demonstrativo antes de processar.');
      return;
    }
    setErrorMessage(null);
    try {
      const parsed = AccountingParser.parseRawText(rawText);
      setParsedData(parsed);
    } catch (err: any) {
      setErrorMessage('Falha ao processar o texto informado.');
    }
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    try {
      await importBalancesAndSave(
        parsedData.balances,
        parsedData.period,
        parsedData.company
      );
      router.push('/lancamentos');
    } catch (err: any) {
      setErrorMessage(`Erro ao salvar lançamentos: ${err.message}`);
    }
  };

  const filledAccounts = parsedData?.balances.filter(
    (b: AccountingBalance) => b.finalBalance > 0 || b.debitAmount > 0 || b.creditAmount > 0
  ) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
          Importação de Balancete Analítico
        </h1>
        <p className="text-xs text-gray-500">
          Envie o Balancete Analítico (.xlsx, .xls ou .pdf) para alimentar simultaneamente o Balanço Patrimonial, Balancete e DRE.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-800">1. Arquivo do Balancete</h2>

          <label className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer bg-emerald-50/20 hover:bg-emerald-50/50 transition">
            <UploadCloud className="w-8 h-8 text-emerald-600" />
            <span className="text-xs font-bold text-gray-700">Selecione o Balancete (.xlsx, .xls ou .pdf)</span>
            <span className="text-[11px] text-gray-400">ou arraste e solte aqui</span>
            <input
              type="file"
              accept=".xlsx,.xls,.pdf,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-gray-600">
              Ou cole o texto do Balancete Analítico:
            </label>
            <textarea
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Cole o texto do Balancete aqui..."
              className="w-full p-3 border rounded-xl font-mono text-[11px] bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleManualProcess}
            disabled={isProcessing}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            Processar Balancete
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-gray-800">2. Prévia dos Demonstrativos Gerados</h2>

            {parsedData ? (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-emerald-50/60 border border-emerald-100 rounded-xl space-y-1">
                  <p className="font-bold text-emerald-950">{parsedData.company.corporateName}</p>
                  <p className="text-[11px] text-emerald-800">CNPJ: {parsedData.company.cnpj}</p>
                  <p className="text-[11px] text-emerald-800">
                    Período: {parsedData.period.startDate.split('-').reverse().join('/')} a {parsedData.period.endDate.split('-').reverse().join('/')}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 border rounded-xl space-y-1 text-[11px] text-gray-600">
                  <p><span className="font-semibold text-gray-800">Total de Contas Processadas:</span> {filledAccounts.length} contas</p>
                  <p><span className="font-semibold text-gray-800">Demonstrativos Gerados:</span> Balanço Patrimonial, Balancete e DRE</p>
                </div>

                <div className="border rounded-xl p-3 bg-white space-y-2">
                  <p className="font-bold text-gray-800 text-[11px]">Amostra de Saldos Identificados:</p>
                  <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 font-mono text-[11px]">
                    {filledAccounts.slice(0, 6).map((item: AccountingBalance) => (
                      <div key={item.codeReduced} className="py-1 flex justify-between">
                        <span className="text-gray-600">{item.description}</span>
                        <span className="font-bold text-gray-900">{formatCurrency(item.finalBalance)} {item.finalNature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl h-64">
                <FileSpreadsheet className="w-8 h-8 opacity-40" />
                <span>Envie o Balancete Analítico para gerar os 3 relatórios automaticamente.</span>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmImport}
            disabled={!parsedData || contextLoading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow transition"
          >
            {contextLoading ? 'Salvando em Lançamentos...' : <>Confirmar e Gerar Relatórios <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    </div>
  );
}