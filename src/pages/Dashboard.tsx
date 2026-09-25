import { useMemo } from 'react';
import type { AppData } from '@/types';
import { formatBRL, formatDate, currentMonth } from '@/store';
import { Ticket, DollarSign, TrendingUp, TrendingDown, Wallet, Clock, AlertCircle, Activity } from 'lucide-react';
import { Badge } from '@/components/ui';

interface DashboardProps {
  data: AppData;
}

export function Dashboard({ data }: DashboardProps) {
  const stats = useMemo(() => {
    const month = currentMonth();
    const chamadosAbertos = data.chamados.filter((c) => c.status === 'Aberto').length;
    const chamadosAndamento = data.chamados.filter((c) => c.status === 'Em Atendimento' || c.status === 'Aguardando Peça').length;
    const mrr = data.contratos.filter((c) => c.status === 'Ativo').reduce((sum, c) => sum + c.valorMensal, 0);
    const contasReceberMes = data.contas.filter((c) => c.tipo === 'Receber' && c.vencimento.startsWith(month));
    const contasPagarMes = data.contas.filter((c) => c.tipo === 'Pagar' && c.vencimento.startsWith(month));
    const totalReceber = contasReceberMes.reduce((s, c) => s + c.valor, 0);
    const totalPagar = contasPagarMes.reduce((s, c) => s + c.valor, 0);
    const saldoPrevisto = mrr + totalReceber - totalPagar;

    const statusCounts = {
      Aberto: data.chamados.filter((c) => c.status === 'Aberto').length,
      'Em Atendimento': data.chamados.filter((c) => c.status === 'Em Atendimento').length,
      'Aguardando Peça': data.chamados.filter((c) => c.status === 'Aguardando Peça').length,
      Concluído: data.chamados.filter((c) => c.status === 'Concluído').length,
    };

    const entradas = data.contas.filter((c) => c.tipo === 'Receber' && c.status === 'Pago' && c.vencimento.startsWith(month)).reduce((s, c) => s + c.valor, 0);
    const saidas = data.contas.filter((c) => c.tipo === 'Pagar' && c.status === 'Pago' && c.vencimento.startsWith(month)).reduce((s, c) => s + c.valor, 0);

    const contratosRenovacao = data.contratos.filter((c) => {
      if (c.status !== 'Ativo') return false;
      const termino = new Date(c.dataTermino);
      const now = new Date();
      const diff = (termino.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff > 0 && diff <= 90;
    });

    return { chamadosAbertos, chamadosAndamento, mrr, totalReceber, totalPagar, saldoPrevisto, statusCounts, entradas, saidas, contratosRenovacao, contasReceberMes, contasPagarMes };
  }, [data]);

  const maxStatus = Math.max(...Object.values(stats.statusCounts), 1);

  const kpis = [
    { label: 'Chamados Abertos', value: stats.chamadosAbertos.toString(), icon: Ticket, color: 'blue', sub: `${stats.chamadosAndamento} em andamento` },
    { label: 'MRR (Receita Recorrente)', value: formatBRL(stats.mrr), icon: TrendingUp, color: 'green', sub: `${data.contratos.filter((c) => c.status === 'Ativo').length} contratos ativos` },
    { label: 'Contas a Receber (Mês)', value: formatBRL(stats.totalReceber), icon: DollarSign, color: 'cyan', sub: `${stats.contasReceberMes.length} lançamentos` },
    { label: 'Contas a Pagar (Mês)', value: formatBRL(stats.totalPagar), icon: TrendingDown, color: 'red', sub: `${stats.contasPagarMes.length} lançamentos` },
    { label: 'Saldo Previsto (Mês)', value: formatBRL(stats.saldoPrevisto), icon: Wallet, color: stats.saldoPrevisto >= 0 ? 'green' : 'red', sub: 'Receita - Despesas' },
    { label: 'Chamados em Andamento', value: stats.chamadosAndamento.toString(), icon: Activity, color: 'orange', sub: 'Incl. aguardando peça' },
  ];

  const colorMap: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    cyan: 'from-cyan-500 to-cyan-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const statusColors: Record<string, string> = {
    Aberto: 'bg-blue-500',
    'Em Atendimento': 'bg-yellow-500',
    'Aguardando Peça': 'bg-orange-500',
    Concluído: 'bg-green-500',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Visão geral da operação de TI e finanças</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-800">{kpi.value}</p>
                  <p className="mt-1 text-xs text-slate-400">{kpi.sub}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[kpi.color]} text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Status dos Chamados</h2>
          <div className="space-y-4">
            {Object.entries(stats.statusCounts).map(([status, count]) => (
              <div key={status}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-600">{status}</span>
                  <span className="text-sm font-bold text-slate-800">{count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${statusColors[status]} transition-all duration-500`}
                    style={{ width: `${(count / maxStatus) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Fluxo Financeiro do Mês</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">Entradas (Pagas)</span>
              </div>
              <span className="text-lg font-bold text-green-600">{formatBRL(stats.entradas)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-slate-700">Saídas (Pagas)</span>
              </div>
              <span className="text-lg font-bold text-red-600">{formatBRL(stats.saidas)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                  <Wallet className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-slate-700">Saldo Realizado</span>
              </div>
              <span className={`text-lg font-bold ${stats.entradas - stats.saidas >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatBRL(stats.entradas - stats.saidas)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {stats.contratosRenovacao.length > 0 && (
        <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <h2 className="text-lg font-bold text-yellow-800">Contratos com Renovação Próxima</h2>
          </div>
          <div className="space-y-2">
            {stats.contratosRenovacao.map((ct) => {
              const cliente = data.clientes.find((c) => c.id === ct.clienteId);
              return (
                <div key={ct.id} className="flex items-center justify-between rounded-lg bg-white px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-medium text-slate-700">{cliente?.nome || 'Cliente'}</span>
                    <Badge color="yellow">Vence em {formatDate(ct.dataTermino)}</Badge>
                  </div>
                  <span className="text-sm font-semibold text-slate-600">{formatBRL(ct.valorMensal)}/mês</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
