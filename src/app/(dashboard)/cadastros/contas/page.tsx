'use client';

import React, { useState } from 'react';
import { useAccounting } from '@/domain/context/AccountingContext';
import { ChartAccount } from '@/domain/entities/ChartAccount';
import { ListTree, Plus, Search, X, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PlanoContasPage() {
  const { balances, addNewAccount } = useAccounting();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
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

  const filteredAccounts = balances.filter(
    (acc) =>
      acc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.classification.includes(searchTerm) ||
      String(acc.codeReduced).includes(searchTerm)
  );

  const handleGroupChange = (group: typeof formData.statementGroup) => {
    let defaultNature: 'D' | 'C' = 'D';
    if (group === 'PASSIVO' || group === 'PL' || group === 'RECEITA') {
      defaultNature = 'C';
    }
    setFormData((prev) => ({
      ...prev,
      statementGroup: group,
      nature: defaultNature,
    }));
  };

  const handleClassificationChange = (cls: string) => {
    const dotsCount = cls.split('-').length;
    setFormData((prev) => ({
      ...prev,
      classification: cls,
      level: dotsCount || 1,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const code = parseInt(formData.codeReduced, 10);
    if (!code || isNaN(code)) {
      setErrorMessage('Informe um código reduzido numérico válido.');
      return;
    }

    if (!formData.classification.trim()) {
      setErrorMessage('Informe a classificação contábil (ex: 4-1-02-60).');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMessage('Informe a descrição da conta.');
      return;
    }

    const alreadyExists = balances.some(
      (b) => b.codeReduced === code || b.classification === formData.classification.trim()
    );
    if (alreadyExists) {
      setErrorMessage('Já existe uma conta cadastrada com este código reduzido ou classificação.');
      return;
    }

    const accountToAdd: Omit<ChartAccount, 'id' | 'companyId'> = {
      codeReduced: code,
      classification: formData.classification.trim(),
      description: formData.description.trim(),
      accountType: formData.accountType,
      nature: formData.nature,
      statementGroup: formData.statementGroup,
      level: formData.level,
    };

    addNewAccount(accountToAdd);

    setSuccessMessage(`Conta [${code}] ${formData.description} cadastrada e adicionada com sucesso!`);
    setIsModalOpen(false);
    setFormData({
      codeReduced: '',
      classification: '',
      description: '',
      accountType: 'ANALITICA',
      nature: 'D',
      statementGroup: 'DESPESA',
      level: 4,
    });

    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <ListTree className="w-6 h-6 text-blue-600" />
            Plano de Contas Referencial
          </h1>
          <p className="text-xs text-gray-500">
            Estrutura hierárquica contábil utilizada nas demonstrações e lançamentos.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMessage(null);
            setIsModalOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Nova Conta
        </button>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Caixa de Pesquisa e Tabela */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden space-y-4 p-5">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por descrição, classificação ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-gray-50/50 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 text-gray-700 font-bold sticky top-0 border-b z-10 text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-16">Cód.</th>
                <th className="py-2.5 px-3 w-32">Classificação</th>
                <th className="py-2.5 px-3">Descrição</th>
                <th className="py-2.5 px-3 text-center w-28">Tipo</th>
                <th className="py-2.5 px-3 text-center w-20">Natureza</th>
                <th className="py-2.5 px-3 text-center w-28">Grupo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredAccounts.map((item) => {
                const isSynthetic = item.accountType === 'SINTETICA';
                const levelIndent = (item.classification.split('-').length - 1) * 12;

                return (
                  <tr
                    key={item.codeReduced}
                    className={isSynthetic ? 'bg-gray-50/70 font-bold text-gray-900' : 'hover:bg-blue-50/20 text-gray-700'}
                  >
                    <td className="py-2 px-3 text-gray-500">{item.codeReduced}</td>
                    <td className="py-2 px-3 text-gray-600">{item.classification}</td>
                    <td className="py-2 px-3 font-sans font-medium" style={{ paddingLeft: `${levelIndent + 12}px` }}>
                      {item.description}
                    </td>
                    <td className="py-2 px-3 text-center font-sans">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isSynthetic ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {item.accountType}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-bold">
                      <span className={item.finalNature === 'D' ? 'text-blue-600' : 'text-emerald-600'}>
                        {item.finalNature}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center font-sans text-[11px] text-gray-600 font-semibold">
                      {item.statementGroup}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Nova Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b bg-gray-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Cadastrar Nova Conta</h3>
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
                    onChange={(e) => handleGroupChange(e.target.value as any)}
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
                    placeholder="Ex: 3200"
                    value={formData.codeReduced}
                    onChange={(e) => setFormData({ ...formData, codeReduced: e.target.value })}
                    required
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 block mb-1">Classificação</label>
                  <input
                    type="text"
                    placeholder="Ex: 4-1-02-60"
                    value={formData.classification}
                    onChange={(e) => handleClassificationChange(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl font-mono focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-700 block mb-1">Descrição da Conta</label>
                <input
                  type="text"
                  placeholder="Ex: Despesas com Softwares e Licenças"
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition"
                >
                  Criar e Adicionar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}