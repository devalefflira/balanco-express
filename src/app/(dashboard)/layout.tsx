'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountingProvider } from '@/domain/context/AccountingContext';
import { 
  Building2, 
  UserCheck, 
  ListTree, 
  FileSpreadsheet, 
  Archive,
  UploadCloud,
  PieChart, 
  FileText, 
  TrendingUp, 
  LogOut 
} from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Lançamentos / Saldos', href: '/lancamentos', icon: FileSpreadsheet },
    { label: 'Importações', href: '/importacoes', icon: UploadCloud },
    { label: 'Lançamentos Salvos', href: '/lancamentos-salvos', icon: Archive },
    { label: 'Clientes', href: '/cadastros/clientes', icon: Building2 },
    { label: 'Contabilistas', href: '/cadastros/contabilistas', icon: UserCheck },
    { label: 'Plano de Contas', href: '/cadastros/contas', icon: ListTree },
    { label: 'Balanço Patrimonial', href: '/relatorios/balanco', icon: PieChart },
    { label: 'Balancete Analítico', href: '/relatorios/balancete', icon: FileText },
    { label: 'DRE', href: '/relatorios/dre', icon: TrendingUp },
  ];

  return (
    <AccountingProvider>
      <div className="flex h-screen bg-gray-100 font-sans print:h-auto print:bg-white">
        <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shadow-lg print:hidden">
          <div>
            <div className="p-5 border-b border-slate-800">
              <h1 className="text-lg font-black tracking-wider text-blue-400">BALANÇO EXPRESS</h1>
              <p className="text-[11px] text-slate-400">Sistema Contábil Automatizado</p>
            </div>

            <nav className="p-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                      isActive
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            <Link
              href="/login"
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 transition"
            >
              <LogOut className="w-4 h-4" />
              Sair do Sistema
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto print:h-auto print:overflow-visible">
          {children}
        </main>
      </div>
    </AccountingProvider>
  );
}