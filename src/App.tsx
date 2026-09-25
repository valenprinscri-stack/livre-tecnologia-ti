import { useState } from 'react';
import { Layout, type PageKey } from '@/components/Layout';
import { useAppData } from '@/store';
import { useAuth } from '@/auth';
import { LoginPage } from '@/pages/LoginPage';
import { ClientPortal } from '@/pages/ClientPortal';
import { Dashboard } from '@/pages/Dashboard';
import { Chamados } from '@/pages/Chamados';
import { Contratos } from '@/pages/Contratos';
import { Financeiro } from '@/pages/Financeiro';
import { Orcamentos } from '@/pages/Orcamentos';
import { NovoOrcamento } from '@/pages/NovoOrcamento';
import { Clientes } from '@/pages/Clientes';
import { Produtos } from '@/pages/Produtos';
import { Servicos } from '@/pages/Servicos';
import { Configuracoes } from '@/pages/Configuracoes';
import { Recibo } from '@/pages/Recibo';
import { Loader2 } from 'lucide-react';

function App() {
  const { user, loading: authLoading, role } = useAuth();
  const { data, update, loading: dataLoading, reload } = useAppData();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [reciboId, setReciboId] = useState<string | null>(null);

  function handleNavigate(p: PageKey) {
    setPage(p);
    setReciboId(null);
  }

  function viewRecibo(id: string) {
    setReciboId(id);
  }

  // Wait for auth + role to resolve before rendering anything
  if (authLoading || (user && role === null)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // HARD GUARD: cliente role → ONLY the Client Portal, never the admin Layout.
  // This check comes before any admin rendering and cannot be bypassed.
  if (role === 'cliente') {
    return <ClientPortal data={data} reload={reload} />;
  }

  // Any role that is NOT explicitly 'admin' is denied access to the admin app.
  // This is deny-by-default: unknown/null roles get the portal, not the admin.
  if (role !== 'admin') {
    return <ClientPortal data={data} reload={reload} />;
  }

  // Admin role → full app
  if (dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (reciboId) {
    return (
      <Layout current="orcamentos" onNavigate={handleNavigate}>
        <Recibo data={data} orcamentoId={reciboId} onNavigate={handleNavigate} onClose={() => setReciboId(null)} />
      </Layout>
    );
  }

  return (
    <Layout current={page} onNavigate={handleNavigate}>
      {page === 'dashboard' && <Dashboard data={data} />}
      {page === 'chamados' && <Chamados data={data} update={update} />}
      {page === 'contratos' && <Contratos data={data} update={update} />}
      {page === 'financeiro' && <Financeiro data={data} update={update} />}
      {page === 'novoOrcamento' && <NovoOrcamento data={data} update={update} onNavigate={handleNavigate} onViewRecibo={viewRecibo} />}
      {page === 'orcamentos' && <Orcamentos data={data} update={update} onNavigate={handleNavigate} onViewRecibo={viewRecibo} />}
      {page === 'clientes' && <Clientes data={data} update={update} />}
      {page === 'produtos' && <Produtos data={data} update={update} />}
      {page === 'servicos' && <Servicos data={data} update={update} />}
      {page === 'configuracoes' && <Configuracoes data={data} update={update} />}
    </Layout>
  );
}

export default App;
