'use client';

import React, { useState } from 'react';
import { UserCheck, Save } from 'lucide-react';

export default function ContabilistasPage() {
  const [accountant, setAccountant] = useState({
    name: 'JAMAILA FONSECA LOPES COSTA',
    crc: '0124650',
    cpf: '024.650.373-40',
    role: 'Contador',
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-600" />
            Responsável Técnico (Contabilista)
          </h1>
          <p className="text-xs text-gray-500">Dados do contador para assinatura e emissão dos livros contábeis</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition">
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 text-xs">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-gray-600 mb-1">Nome do Contabilista</label>
            <input
              value={accountant.name}
              onChange={(e) => setAccountant({ ...accountant, name: e.target.value })}
              className="w-full p-2 border rounded font-semibold"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Número do CRC</label>
            <input
              value={accountant.crc}
              onChange={(e) => setAccountant({ ...accountant, crc: e.target.value })}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">CPF</label>
            <input
              value={accountant.cpf}
              onChange={(e) => setAccountant({ ...accountant, cpf: e.target.value })}
              className="w-full p-2 border rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Cargo / Função</label>
            <input
              value={accountant.role}
              onChange={(e) => setAccountant({ ...accountant, role: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );
}