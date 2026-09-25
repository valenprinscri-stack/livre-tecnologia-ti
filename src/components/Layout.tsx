import { useState, type ReactNode } from 'react';
import {
  LayoutDashboard,
  Ticket,
  FileText,
  DollarSign,
  FilePlus,
  ClipboardList,
  Users,
  Package,
  Wrench,
  Settings,
  Menu,
  X,
  Cpu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/auth';

export type PageKey =
  | 'dashboard'
  | 'chamados'
  | 'contratos'
  | 'financeiro'
  | 'novoOrcamento'
  | 'orcamentos'
  | 'clientes'
  | 'produtos'
  | 'servicos'
  | 'configuracoes';

interface NavItem {
  key: PageKey;
  label: string;
  icon: typeof LayoutDashboard;
  group?: string;
}

const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Principal' },
  { key: 'chamados', label: 'Chamados', icon: Ticket, group: 'Principal' },
  { key: 'contratos', label: 'Contratos', icon: FileText, group: 'Principal' },
  { key: 'financeiro', label: 'Financeiro', icon: DollarSign, group: 'Financeiro' },
  { key: 'novoOrcamento', label: 'Novo Orçamento', icon: FilePlus, group: 'Financeiro' },
  { key: 'orcamentos', label: 'Orçamentos', icon: ClipboardList, group: 'Financeiro' },
  { key: 'clientes', label: 'Clientes', icon: Users, group: 'Cadastros' },
  { key: 'produtos', label: 'Produtos', icon: Package, group: 'Cadastros' },
  { key: 'servicos', label: 'Serviços', icon: Wrench, group: 'Cadastros' },
  { key: 'configuracoes', label: 'Configurações', icon: Settings, group: 'Cadastros' },
];

interface LayoutProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function Layout({ current, onNavigate, children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const userEmail = user?.email || 'Usuário';

  const groups = Array.from(new Set(navItems.map((n) => n.group)));

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-900">
          <Cpu className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-white leading-tight">Livre Tecnologia TI</h1>
          <p className="text-xs text-slate-400">Gestão de Chamados & Financeiro</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group) => (
          <div key={group}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">{group}</p>
            <div className="space-y-1">
              {navItems
                .filter((n) => n.group === group)
                .map((item) => {
                  const Icon = item.icon;
                  const active = current === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onNavigate(item.key);
                        setMobileOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-cyan-400/10 text-cyan-400 border-l-2 border-cyan-400'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border-l-2 border-transparent'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-6 py-4 border-t border-slate-700/50">
        <p className="text-xs text-slate-500">© 2026 Livre Tecnologia TI</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="hidden lg:block w-64 shrink-0">{sidebar}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64">{sidebar}</div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-white border-b border-slate-200 px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-400 text-slate-900">
                <Cpu className="h-5 w-5" />
              </div>
              <span className="text-sm font-bold text-slate-800">Livre TI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-800 truncate max-w-40">{userEmail}</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-white text-sm font-semibold">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <button onClick={signOut} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
