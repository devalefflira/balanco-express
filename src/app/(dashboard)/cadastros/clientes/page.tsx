'use client';

import React, { useState } from 'react';
import { Building2, Plus, Save } from 'lucide-react';

export default function ClientesPage() {
  const [formData, setFormData] = useState({
    code: '00463',
    corporateName: 'JC MACHADO DIAS',
    tradeName: 'JC MACHADO',
    cnpj: '24.905.673/0001-59',
    nire: '21201532287',
    nireDate: '2016-05-31',
    address: 'AVENIDA JK, 1208, Lote 1 A 4, Quadra 4 Fundos',
    neighborhood: 'Vila Santa Luzia',
    city: 'Bom Jesus das Selvas',
    state: 'MA',
    zipCode: '65395-000',
    representativeName: 'JOSE CARLOS MACHADO DIAS',
    representativeCpf: '196.018.244-72',
    representativeRole: 'Administrador',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Cadastro de Empresa / Cliente
          </h1>
          <p className="text-xs text-gray-500">Dados da empresa para o cabeçalho e assinaturas dos relatórios</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition">
          <Save className="w-4 h-4" />
          Salvar Dados
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-xs">
        <h2 className="font-bold text-gray-700 border-b pb-2">Informações da Empresa</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Código Interno</label>
            <input
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-gray-600 mb-1">Razão Social</label>
            <input
              name="corporateName"
              value={formData.corporateName}
              onChange={handleChange}
              className="w-full p-2 border rounded font-semibold"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">CNPJ</label>
            <input
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">NIRE</label>
            <input
              name="nire"
              value={formData.nire}
              onChange={handleChange}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Data de Registro NIRE</label>
            <input
              name="nireDate"
              type="date"
              value={formData.nireDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>

        <h2 className="font-bold text-gray-700 border-b pt-4 pb-2">Endereço</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2">
            <label className="block text-gray-600 mb-1">Endereço Completo</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Bairro</label>
            <input
              name="neighborhood"
              value={formData.neighborhood}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">CEP</label>
            <input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div className="col-span-3">
            <label className="block text-gray-600 mb-1">Cidade</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">UF</label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              className="w-full p-2 border rounded uppercase"
            />
          </div>
        </div>

        <h2 className="font-bold text-gray-700 border-b pt-4 pb-2">Sócio-Representante / Administrador</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-gray-600 mb-1">Nome Completo</label>
            <input
              name="representativeName"
              value={formData.representativeName}
              onChange={handleChange}
              className="w-full p-2 border rounded font-semibold"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">CPF</label>
            <input
              name="representativeCpf"
              value={formData.representativeCpf}
              onChange={handleChange}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}