'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountingProvider } from '@/domain/context/AccountingContext';
import {
  UploadCloud,
  FolderKanban,
  Edit3,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Building2,
  Users,
  ListTree,
  LogOut,
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { label: 'Importar Arquivos', href: '/importacoes', icon: UploadCloud },
    { label: 'Lançamentos Importados', href: '/lancamentos-salvos', icon: FolderKanban },
    { label: 'Editar Lançamentos', href: '/lancamentos', icon: Edit3 },
    { label: 'Gerar Balanço', href: '/relatorios/balanco', icon: FileSpreadsheet },
    { label: 'Gerar Balancete', href: '/relatorios/balancete', icon: FileText },
    { label: 'Gerar DRE', href: '/relatorios/dre', icon: TrendingUp },
    { label: 'Cliente', href: '/cadastros/clientes', icon: Building2 },
    { label: 'Contabilistas', href: '/cadastros/contabilistas', icon: Users },
    { label: 'Plano de Contas', href: '/cadastros/contas', icon: ListTree },
  ];

  return (
    <AccountingProvider>
      <div className="flex h-screen bg-slate-100 overflow-hidden font-sans">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0f172a] text-slate-200 flex flex-col justify-between flex-shrink-0 shadow-xl print:hidden">
          <div>
            <div className="p-6 border-b border-slate-800">
              <h1 className="text-xl font-black text-sky-400 tracking-tight flex items-center gap-2">
                BALANÇO EXPRESS
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">Sistema Contábil Automatizado</p>
            </div>

            <nav className="p-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/lancamentos' && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md font-bold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            <button
              onClick={() => {
                window.location.href = '/login';
              }}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 transition w-full rounded-xl hover:bg-slate-800/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </aside>

        {/* Área Principal */}
        <main className="flex-1 overflow-y-auto bg-slate-50">{children}</main>
      </div>
    </AccountingProvider>
  );
}