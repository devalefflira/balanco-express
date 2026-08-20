import React from 'react';

interface ReportSignaturesProps {
  representativeName: string;
  representativeRole?: string;
  representativeCpf: string;
  accountantName: string;
  accountantRole?: string;
  accountantCrc: string;
}

export const ReportSignatures: React.FC<ReportSignaturesProps> = ({
  representativeName,
  representativeRole = 'Administrador',
  representativeCpf,
  accountantName,
  accountantRole = 'Contador',
  accountantCrc,
}) => {
  return (
    <div className="mt-8 pt-4 border-t border-gray-300 grid grid-cols-2 gap-8 text-xs font-mono text-gray-800">
      {/* Assinatura Administrador */}
      <div className="p-3 border border-gray-400 bg-gray-50 rounded">
        <p className="font-bold uppercase tracking-wider">{representativeName}</p>
        <p className="text-[10px] text-gray-500 mt-1">Assinado de forma digital por {representativeName}</p>
        <p className="mt-3 font-semibold">{representativeName}</p>
        <p>{representativeRole}</p>
        <p>CPF: {representativeCpf}</p>
      </div>

      {/* Assinatura Contador */}
      <div className="p-3 border border-gray-400 bg-gray-50 rounded">
        <p className="font-bold uppercase tracking-wider">{accountantName}</p>
        <p className="text-[10px] text-gray-500 mt-1">Assinado de forma digital por {accountantName}</p>
        <p className="mt-3 font-semibold">{accountantName}</p>
        <p>{accountantRole}</p>
        <p>CRC: {accountantCrc}</p>
      </div>
    </div>
  );
};