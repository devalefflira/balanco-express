'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingParser } from '@/domain/services/AccountingParser';
import { DREReverseEngine } from '@/domain/services/DREReverseEngine';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Settings2,
  PlusCircle,
  X,
} from 'lucide-react';

export default function ImportacoesPage() {
  const router = useRouter();
  const { importBalancesAndSave, createNewBlankPeriod } = useAccounting();

  const [importMode, setImportMode] = useState<'BALANCETE' | 'DRE_REVERSE'>('BALANCETE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ message: string; periodId: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal para Criar Balancete do Zero
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    description: 'Exercício 01/01/2026 a 31/12/2026',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
  });

  const [receivablePercent, setReceivablePercent] = useState<number>(35);
  const [payablePercent, setPayablePercent] = useState<number>(25);

  const handleStartManualCreation = (e: React.FormEvent) => {
    e.preventDefault();
    createNewBlankPeriod({
      description: manualForm.description,
      startDate: manualForm.startDate,
      endDate: manualForm.endDate,
    });
    setIsManualModalOpen(false);
    router.push('/lancamentos');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessInfo(null);

    try {
      const fileName = file.name.toLowerCase();

      if (importMode === 'BALANCETE') {
        const buffer = await file.arrayBuffer();
        let parsedData;
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          parsedData = AccountingParser.parseExcelBuffer(buffer, file.name);
        } else if (fileName.endsWith('.pdf')) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Erro ao processar PDF.');
          parsedData = AccountingParser.parseRawText(json.text, file.name);
        } else {
          const text = new TextDecoder('iso-8859-1').decode(buffer);
          parsedData = AccountingParser.parseRawText(text, file.name);
        }

        const periodId = await importBalancesAndSave(
          parsedData.balances,
          parsedData.period,
          parsedData.company
        );

        setSuccessInfo({
          message: `Balancete Analítico importado com sucesso! (${parsedData.balances.length} contas processadas)`,
          periodId,
        });
      } else {
        let dreData;

        if (fileName.endsWith('.pdf')) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Erro ao processar PDF da DRE.');
          dreData = AccountingParser.parseDREText(json.text, file.name);
        } else {
          const buffer = await file.arrayBuffer();
          dreData = AccountingParser.parseDREExcel(buffer, file.name);
        }

        if (dreData.items.length === 0) {
          throw new Error('Nenhuma conta de receita, custo ou despesa foi identificada no arquivo da DRE.');
        }

        const generatedBalances = DREReverseEngine.generateBalancesFromDRE(dreData.items, {
          receivableRatio: receivablePercent / 100,
          payableRatio: payablePercent / 100,
        });

        const periodId = await importBalancesAndSave(
          generatedBalances,
          dreData.period,
          dreData.company
        );

        setSuccessInfo({
          message: `Engenharia Reversa Concluída! Balanço e Balancete gerados e balanceados a partir da DRE com sucesso.`,
          periodId,
        });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo selecionado.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-600" />
            Central de Lançamentos e Importação
          </h1>
          <p className="text-xs text-gray-500">
            Importe arquivos (Balancete / DRE) ou crie um balancete do zero para preenchimento manual.
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
        >
          <PlusCircle className="w-4 h-4" />
          Criar Balancete do Zero
        </button>
      </div>

      {/* Seleção do Modo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => setImportMode('BALANCETE')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
            importMode === 'BALANCETE'
              ? 'border-blue-600 bg-blue-50/40 shadow-xs'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${importMode === 'BALANCETE' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Importação por Balancete Analítico</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Alimenta simultaneamente Balanço, Balancete e DRE em PDF, Excel (.xlsx/.xls) ou TXT.
            </p>
          </div>
        </div>

        <div
          onClick={() => setImportMode('DRE_REVERSE')}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition flex items-start gap-3.5 ${
            importMode === 'DRE_REVERSE'
              ? 'border-purple-600 bg-purple-50/40 shadow-xs'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
        >
          <div className={`p-2.5 rounded-xl ${importMode === 'DRE_REVERSE' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900">Engenharia Reversa via DRE</h3>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">PDF & Excel</span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Reconstrói as partidas dobradas do Ativo e Passivo a partir de relatórios DRE em PDF ou Planilha.
            </p>
          </div>
        </div>
      </div>

      {importMode === 'DRE_REVERSE' && (
        <div className="bg-purple-50/70 border border-purple-200 p-5 rounded-2xl space-y-4 animate-in fade-in text-xs">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-purple-600" />
            <h4 className="font-bold text-purple-950 uppercase tracking-wide">
              Parâmetros de Reconstituição das Partidas Dobradas
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700">Vendas a Prazo (Clientes a Receber)</label>
                <span className="font-mono font-bold text-purple-700">{receivablePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={receivablePercent}
                onChange={(e) => setReceivablePercent(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>100% à Vista (Caixa/Banco)</span>
                <span>100% a Prazo (Clientes)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700">Despesas a Prazo (Fornecedores)</label>
                <span className="font-mono font-bold text-purple-700">{payablePercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={payablePercent}
                onChange={(e) => setPayablePercent(parseInt(e.target.value, 10))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>100% Liquidadas</span>
                <span>100% em Fornecedores</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Caixa de Upload */}
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition text-center space-y-4">
        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          {importMode === 'BALANCETE' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6 text-purple-600" />}
        </div>

        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900">
            {importMode === 'BALANCETE' ? 'Selecione o Balancete Analítico' : 'Selecione a DRE (PDF, Excel ou CSV)'}
          </p>
          <p className="text-xs text-gray-500">Formatos aceitos: .pdf, .xlsx, .xls, .csv ou .txt</p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition shadow-xs">
          <span>{isProcessing ? 'Processando...' : 'Escolher Arquivo'}</span>
          <input
            type="file"
            accept=".pdf,.xlsx,.xls,.csv,.txt"
            disabled={isProcessing}
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successInfo && (
        <div className="p-5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl space-y-3 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-xs">{successInfo.message}</span>
          </div>

          <div className="pt-2 border-t border-emerald-200 flex gap-2">
            <button
              onClick={() => router.push('/lancamentos')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Ver em Editar Lançamentos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => router.push('/relatorios/balanco')}
              className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100/50 rounded-xl text-xs font-bold transition"
            >
              Visualizar Balanço Patrimonial
            </button>
          </div>
        </div>
      )}

      {/* Modal Criar Balancete do Zero */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-gray-900">Novo Balancete Manual</h3>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartManualCreation} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição do Exercício</label>
                <input
                  type="text"
                  required
                  value={manualForm.description}
                  onChange={(e) => setManualForm({ ...manualForm, description: e.target.value })}
                  placeholder="Ex: Exercício 01/01/2026 a 31/12/2026"
                  className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Inicial</label>
                  <input
                    type="date"
                    required
                    value={manualForm.startDate}
                    onChange={(e) => setManualForm({ ...manualForm, startDate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Data Final</label>
                  <input
                    type="date"
                    required
                    value={manualForm.endDate}
                    onChange={(e) => setManualForm({ ...manualForm, endDate: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-medium focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-[11px] leading-relaxed">
                Todas as contas do Plano de Contas serão abertas zeradas para preenchimento com recálculo automático de Balanço e DRE.
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  Criar e Iniciar Edição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}