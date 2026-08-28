'use client';

import React, { useState } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { ChartAccount } from '@/domain/entities/ChartAccount';
import { ListTree, Plus, Search, X, CheckCircle2, AlertCircle, Edit, Trash2, Printer } from 'lucide-react';

export default function PlanoContasPage() {
  const { balances, company, addNewAccount, editAccount, deleteAccount } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
    codeReduced: string;
    classification: string;
    description: string;
    accountType: 'ANALITICA' | 'SINTETICA';
    nature: 'D' | 'C';
    statementGroup: 'ATIVO' | 'PASSIVO' | 'PL' | 'RECEITA' | 'CUSTO' | 'DESPESA';
    level: number;
  }>({
    codeReduced: '',
    classification: '',
    description: '',
    accountType: 'ANALITICA',
    nature: 'D',
    statementGroup: 'DESPESA',
    level: 4,
  });

  const handlePrint = () => {
    window.print();
  };

  const filteredAccounts = balances.filter(
    (acc) =>
      acc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.classification.includes(searchTerm) ||
      String(acc.codeReduced).includes(searchTerm)
  );

  const handleOpenCreate = () => {
    setEditingCode(null);
    setFormData({
      codeReduced: '',
      classification: '',
      description: '',
      accountType: 'ANALITICA',
      nature: 'D',
      statementGroup: 'DESPESA',
      level: 4,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: typeof balances[0]) => {
    setEditingCode(item.codeReduced);
    setFormData({
      codeReduced: String(item.codeReduced),
      classification: item.classification,
      description: item.description,
      accountType: item.accountType,
      nature: item.finalNature,
      statementGroup: item.statementGroup,
      level: item.classification.split('-').length,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (code: number, desc: string) => {
    if (!confirm(`Deseja realmente excluir a conta [${code}] ${desc}?`)) return;
    try {
      await deleteAccount(code);
      setSuccessMessage(`Conta [${code}] excluída com sucesso!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (e: any) {
      alert(`Erro ao excluir: ${e.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = parseInt(formData.codeReduced, 10);
    if (!code || isNaN(code)) {
      setErrorMessage('Informe um código reduzido válido.');
      return;
    }

    try {
      const accountPayload: Omit<ChartAccount, 'id' | 'companyId'> = {
        codeReduced: code,
        classification: formData.classification.trim(),
        description: formData.description.trim(),
        accountType: formData.accountType,
        nature: formData.nature,
        statementGroup: formData.statementGroup,
        level: formData.level,
      };

      if (editingCode) {
        await editAccount(accountPayload);
        setSuccessMessage(`Conta [${code}] atualizada com sucesso!`);
      } else {
        addNewAccount(accountPayload);
        setSuccessMessage(`Conta [${code}] cadastrada com sucesso!`);
      }

      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto print:p-0 print:max-w-full">
      {/* Cabeçalho de Impressão Exclusivo */}
      <div className="hidden print:block border-b-2 border-black pb-3 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-sm font-bold uppercase">PRIME CONTABILIDADE</h1>
            <h2 className="text-base font-extrabold">{company.corporateName}</h2>
            <p className="text-xs">CNPJ: {company.cnpj} {company.nire ? `| NIRE: ${company.nire}` : ''}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold">Plano de Contas Referencial</h3>
            <p className="text-xs text-gray-600">Total de Contas: {filteredAccounts.length}</p>
          </div>
        </div>
      </div>

      {/* Cabeçalho da Tela */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <ListTree className="w-6 h-6 text-blue-600" />
            Plano de Contas Referencial
          </h1>
          <p className="text-xs text-gray-500">
            Estrutura hierárquica contábil utilizada nas demonstrações e lançamentos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir Plano de Contas
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Nova Conta
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 print:hidden">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Caixa de Pesquisa e Tabela */}
      <div className="bg-white rounded-2xl border shadow-xs overflow-hidden space-y-4 p-5 print:border-none print:shadow-none print:p-0">
        <div className="relative print:hidden">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, classificação ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-[600px] overflow-y-auto print:max-h-none print:overflow-visible">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 text-gray-700 font-bold sticky top-0 border-b z-10 text-[11px] print:bg-gray-100 print:text-black">
              <tr>
                <th className="py-2.5 px-3 w-16">Cód.</th>
                <th className="py-2.5 px-3 w-32">Classificação</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3 text-center w-28">Tipo</th>
                <th className="py-2.5 px-3 text-center w-20">Natureza</th>
                <th className="py-2.5 px-3 text-center w-28">Grupo</th>
                <th className="py-2.5 px-3 text-right w-24 print:hidden">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredAccounts.map((item) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                const levelIndent = (item.classification.split('-').length - 1) * 12;

                return (
                  <tr
                    key={item.codeReduced}
                    className={`print:break-inside-avoid ${
                      isSynthetic ? 'bg-gray-50/70 font-bold text-gray-900 print:bg-gray-100' : 'hover:bg-blue-50/20 text-gray-700'
                    }`}
                  >
                    <td className="py-2 px-3 text-gray-500 print:text-black">{item.codeReduced}</td>
                    <td className="py-2 px-3 text-gray-600 print:text-black">{item.classification}</td>
                    <td className="py-2 px-3 font-sans font-medium" style={{ paddingLeft: `${levelIndent + 12}px` }}>
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full print:border print:border-black ${
                          isSynthetic ? 'bg-purple-100 text-purple-700 print:bg-transparent print:text-black' : 'bg-emerald-100 text-emerald-700 print:bg-transparent print:text-black'
                        }`}
                      >
                        {item.accountType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      <span className={item.finalNature === 'D' ? 'text-blue-600 print:text-black' : 'text-emerald-600 print:text-black'}>
                        {item.finalNature}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-sans text-[11px] text-gray-600 font-semibold print:text-black">
                      {item.statementGroup}
                    </td>
                    <td className="py-2 px-3 text-right space-x-1 font-sans print:hidden">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 hover:bg-blue-50 rounded text-blue-600 transition"
                        title="Editar Conta"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.codeReduced, item.description)}
                        className="p-1 hover:bg-rose-50 rounded text-rose-600 transition"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição de Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {editingCode ? `Editar Conta [${editingCode}]` : 'Cadastrar Nova Conta'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Grupo Contábil</label>
                  <select
                    value={formData.statementGroup}
                    onChange={(e) => setFormData({ ...formData, statementGroup: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ATIVO">1 - Ativo</option>
                    <option value="PASSIVO">2 - Passivo</option>
                    <option value="PL">2 - Patrimônio Líquido</option>
                    <option value="RECEITA">3 - Receita</option>
                    <option value="CUSTO">3 - Custo</option>
                    <option value="DESPESA">4 - Despesa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Tipo de Conta</label>
                  <select
                    value={formData.accountType}
                    onChange={(e) => setFormData({ ...formData, accountType: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="ANALITICA">Analítica (Recebe Lançamentos)</option>
                    <option value="SINTETICA">Sintética (Grupo/Totalizadora)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Código Reduzido</label>
                  <input
                    type="number"
                    disabled={!!editingCode}
                    value={formData.codeReduced}
                    onChange={(e) => setFormData({ ...formData, codeReduced: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Classificação</label>
                  <input
                    type="text"
                    value={formData.classification}
                    onChange={(e) => setFormData({ ...formData, classification: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição da Conta</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  className="w-full p-2.5 border rounded-xl focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-gray-700 block mb-1">Natureza do Saldo</label>
                  <select
                    value={formData.nature}
                    onChange={(e) => setFormData({ ...formData, nature: e.target.value as any })}
                    className="w-full p-2.5 border rounded-xl bg-white font-medium focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="D">D (Devedora - Ativo, Custos, Despesas)</option>
                    <option value="C">C (Credora - Passivo, PL, Receitas)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Nível Hierárquico</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition"
                >
                  {editingCode ? 'Salvar Alterações' : 'Criar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}