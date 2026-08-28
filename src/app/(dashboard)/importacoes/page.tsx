'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccounting } from '@/domain/context/AccountingContext';
import { AccountingParser, ParsedAccountingData, SheetInfo } from '@/domain/services/AccountingParser';
import { DREReverseEngine } from '@/domain/services/DREReverseEngine';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Building2,
  UserCheck,
  Calendar,
  Layers,
  ChevronRight,
  X,
} from 'lucide-react';

export default function ImportacoesPage() {
  const router = useRouter();
  const { company, accountant, importBalancesAndSave, createNewBlankPeriod } = useAccounting();

  const [importMode, setImportMode] = useState<'BALANCETE' | 'DRE_REVERSE'>('BALANCETE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Etapas do Wizard de Importação
  const [step, setStep] = useState<'UPLOAD' | 'REVIEW'>('UPLOAD');
  const [uploadedFileBuffer, setUploadedFileBuffer] = useState<ArrayBuffer | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [availableSheets, setAvailableSheets] = useState<SheetInfo[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // Dados em Revisão
  const [parsedData, setParsedData] = useState<ParsedAccountingData | null>(null);
  const [formCompany, setFormCompany] = useState({
    corporateName: company.corporateName || 'JC MACHADO DIAS LTDA',
    cnpj: company.cnpj || '24.905.673/0001-59',
  });
  const [formAccountant, setFormAccountant] = useState({
    name: accountant.name || 'JAMAILA FONSECA LOPES COSTA',
    crc: accountant.crc || '0124650',
  });
  const [formPeriod, setFormPeriod] = useState({
    description: 'Exercício de 01/01/2024 a 31/12/2024',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
  });

  // Modal para Criar Balancete Manual
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      setUploadedFileBuffer(buffer);
      setUploadedFileName(file.name);

      const fileName = file.name.toLowerCase();

      if (importMode === 'BALANCETE') {
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const sheets = AccountingParser.inspectExcelSheets(buffer);
          setAvailableSheets(sheets);
          const initialSheet = sheets[0]?.name || '';
          setSelectedSheet(initialSheet);

          const parsed = AccountingParser.parseExcelBuffer(buffer, file.name, initialSheet);
          setParsedData(parsed);
          setFormPeriod(parsed.period);
          setFormCompany((prev) => ({
            corporateName: parsed.company.corporateName || prev.corporateName,
            cnpj: parsed.company.cnpj || prev.cnpj,
          }));
          setStep('REVIEW');
        } else if (fileName.endsWith('.pdf')) {
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/parse-pdf', { method: 'POST', body: formData });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || 'Erro ao processar PDF.');
          const parsed = AccountingParser.parseRawText(json.text, file.name);
          setParsedData(parsed);
          setFormPeriod(parsed.period);
          setStep('REVIEW');
        } else {
          const text = new TextDecoder('iso-8859-1').decode(buffer);
          const parsed = AccountingParser.parseRawText(text, file.name);
          setParsedData(parsed);
          setFormPeriod(parsed.period);
          setStep('REVIEW');
        }
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
          dreData = AccountingParser.parseDREExcel(buffer, file.name);
        }

        if (dreData.items.length === 0) {
          throw new Error('Nenhuma conta de resultado identificada na DRE.');
        }

        const generatedBalances = DREReverseEngine.generateBalancesFromDRE(dreData.items, {
          receivableRatio: receivablePercent / 100,
          payableRatio: payablePercent / 100,
        });

        await importBalancesAndSave(generatedBalances, dreData.period, dreData.company);
        router.push('/lancamentos');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao processar o arquivo selecionado.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!uploadedFileBuffer) return;
    setSelectedSheet(sheetName);
    const parsed = AccountingParser.parseExcelBuffer(uploadedFileBuffer, uploadedFileName, sheetName);
    setParsedData(parsed);
    setFormPeriod(parsed.period);
  };

  const handleConfirmImport = async () => {
    if (!parsedData) return;

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await importBalancesAndSave(
        parsedData.balances,
        formPeriod,
        formCompany
      );
      router.push('/lancamentos');
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao salvar os lançamentos importados.');
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

      {step === 'UPLOAD' ? (
        <>
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
              <span>{isProcessing ? 'Lendo arquivo...' : 'Escolher Arquivo'}</span>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.csv,.txt"
                disabled={isProcessing}
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>
        </>
      ) : (
        /* Etapa de Revisão dos Parâmetros antes de gravar */
        <div className="bg-white rounded-2xl border p-6 space-y-6 animate-in fade-in text-xs shadow-xs">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">Arquivo Carregado: {uploadedFileName}</h3>
                <p className="text-xs text-gray-500">Confirme o cliente, o contabilista e o exercício antes de salvar.</p>
              </div>
            </div>
            <button
              onClick={() => setStep('UPLOAD')}
              className="px-3 py-1.5 border rounded-lg text-gray-600 hover:bg-gray-50 font-bold"
            >
              Trocar Arquivo
            </button>
          </div>

          {availableSheets.length > 1 && (
            <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Selecione a Aba da Planilha a ser importada:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSheets.map((sh) => (
                  <button
                    key={sh.name}
                    type="button"
                    onClick={() => handleSheetChange(sh.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedSheet === sh.name
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{sh.name}</span>
                    <span className="text-[10px] opacity-75">({sh.rowCount} linhas)</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Cliente / Empresa */}
            <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>1. Dados da Empresa</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block font-bold">Razão Social</label>
                  <input
                    type="text"
                    value={formCompany.corporateName}
                    onChange={(e) => setFormCompany({ ...formCompany, corporateName: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block font-bold">CNPJ</label>
                  <input
                    type="text"
                    value={formCompany.cnpj}
                    onChange={(e) => setFormCompany({ ...formCompany, cnpj: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 2. Contabilista */}
            <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>2. Contabilista Responsável</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block font-bold">Nome do Contador</label>
                  <input
                    type="text"
                    value={formAccountant.name}
                    onChange={(e) => setFormAccountant({ ...formAccountant, name: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block font-bold">CRC</label>
                  <input
                    type="text"
                    value={formAccountant.crc}
                    onChange={(e) => setFormAccountant({ ...formAccountant, crc: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* 3. Exercício / Período */}
            <div className="p-4 border rounded-xl space-y-3 bg-gray-50/50">
              <div className="flex items-center gap-2 font-bold text-gray-800">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>3. Período / Exercício</span>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="text-[10px] text-gray-500 block font-bold">Descrição</label>
                  <input
                    type="text"
                    value={formPeriod.description}
                    onChange={(e) => setFormPeriod({ ...formPeriod, description: e.target.value })}
                    className="w-full p-2 bg-white border rounded-lg text-xs font-semibold"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 block font-bold">Início</label>
                    <input
                      type="date"
                      value={formPeriod.startDate}
                      onChange={(e) => setFormPeriod({ ...formPeriod, startDate: e.target.value })}
                      className="w-full p-1.5 bg-white border rounded-lg text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 block font-bold">Fim</label>
                    <input
                      type="date"
                      value={formPeriod.endDate}
                      onChange={(e) => setFormPeriod({ ...formPeriod, endDate: e.target.value })}
                      className="w-full p-1.5 bg-white border rounded-lg text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo dos Lançamentos Mapeados */}
          <div className="p-4 bg-slate-50 border rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div>
                <span className="font-bold text-gray-900">
                  {parsedData?.recognizedCount || 0} contas mapeadas com sucesso
                </span>
                <p className="text-[11px] text-gray-500">
                  Os saldos e movimentações serão vinculados diretamente ao Plano de Contas e à tela de lançamentos.
                </p>
              </div>
            </div>
            <button
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-xs transition"
            >
              <span>{isProcessing ? 'Importando...' : 'Confirmar e Editar Lançamentos'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Modal Criar Balancete Manual */}
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