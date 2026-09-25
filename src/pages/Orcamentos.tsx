import { useState, useMemo } from 'react';
import type { AppData, Orcamento, OrcamentoStatus } from '@/types';
import { formatBRL, formatDate } from '@/store';
import { Badge, PageHeader, EmptyState, btnPrimary, btnSecondary } from '@/components/ui';
import { ClipboardList, Plus, Eye, FileDown, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import type { PageKey } from '@/components/Layout';

interface OrcamentosProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  onNavigate: (page: PageKey) => void;
  onViewRecibo: (orcamentoId: string) => void;
}

const statusColor: Record<OrcamentoStatus, string> = {
  Rascunho: 'gray',
  Enviado: 'blue',
  Aprovado: 'green',
  Recusado: 'red',
};

export function Orcamentos({ data, update, onNavigate, onViewRecibo }: OrcamentosProps) {
  const [filterStatus, setFilterStatus] = useState<OrcamentoStatus | 'Todos'>('Todos');

  const filtered = useMemo(() => {
    return data.orcamentos.filter((o) => filterStatus === 'Todos' || o.status === filterStatus);
  }, [data.orcamentos, filterStatus]);

  function updateStatus(id: string, status: OrcamentoStatus) {
    update((prev) => ({
      ...prev,
      orcamentos: prev.orcamentos.map((o) => (o.id === id ? { ...o, status } : o)),
    }));
  }

  function aprovarOrcamento(orc: Orcamento) {
    update((prev) => {
      const cliente = prev.clientes.find((c) => c.id === orc.clienteId);
      const novaConta = {
        id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        tipo: 'Receber' as const,
        descricao: `Orçamento ${orc.id.slice(-6).toUpperCase()} - ${cliente?.nome || ''}`,
        clienteId: orc.clienteId,
        fornecedor: '',
        valor: orcTotal(orc),
        vencimento: new Date().toISOString().split('T')[0],
        categoria: 'Orçamento Aprovado',
        status: 'Pendente' as const,
        origem: 'orcamento' as const,
        orcamentoId: orc.id,
      };
      return {
        ...prev,
        orcamentos: prev.orcamentos.map((o) => (o.id === orc.id ? { ...o, status: 'Aprovado' } : o)),
        contas: [novaConta, ...prev.contas],
      };
    });
  }

  function deleteOrcamento(id: string) {
    update((prev) => ({ ...prev, orcamentos: prev.orcamentos.filter((o) => o.id !== id) }));
  }

  return (
    <div>
      <PageHeader
        title="Orçamentos"
        subtitle="Histórico completo de propostas enviadas"
        action={
          <button onClick={() => onNavigate('novoOrcamento')} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Orçamento
          </button>
        }
      />

      <div className="mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as OrcamentoStatus | 'Todos')} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 outline-none sm:w-48">
          <option value="Todos">Todos os Status</option>
          <option value="Rascunho">Rascunho</option>
          <option value="Enviado">Enviado</option>
          <option value="Aprovado">Aprovado</option>
          <option value="Recusado">Recusado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-8 w-8" />} title="Nenhum orçamento encontrado" message="Crie um novo orçamento para seus clientes." action={<button onClick={() => onNavigate('novoOrcamento')} className={btnPrimary}><Plus className="h-4 w-4" /> Novo Orçamento</button>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((orc) => {
            const cliente = data.clientes.find((c) => c.id === orc.clienteId);
            const total = orcTotal(orc);
            return (
              <div key={orc.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-slate-800">{cliente?.nome || 'Cliente'}</h3>
                      <Badge color={statusColor[orc.status]}>{orc.status}</Badge>
                    </div>
                    <p className="text-sm text-slate-500">
                      {orc.itens.length} {orc.itens.length === 1 ? 'item' : 'itens'} · {formatDate(orc.data)} · {orc.formaPagamento || 'Sem forma de pagamento'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold text-slate-800">{formatBRL(total)}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => onViewRecibo(orc.id)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Ver proposta">
                        <Eye className="h-4 w-4" />
                      </button>
                      {orc.status !== 'Aprovado' && orc.status !== 'Recusado' && (
                        <>
                          <button onClick={() => updateStatus(orc.id, 'Aprovado')} className="p-2 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Aprovar e gerar conta a receber">
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button onClick={() => updateStatus(orc.id, 'Recusado')} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Recusar">
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button onClick={() => onViewRecibo(orc.id)} className="p-2 rounded-lg text-cyan-500 hover:bg-cyan-50 transition-colors" title="Imprimir/PDF">
                        <FileDown className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteOrcamento(orc.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {orc.status === 'Aprovado' && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-sm text-green-700">
                    <CheckCircle className="h-3.5 w-3.5" /> Conta a receber gerada automaticamente
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function orcTotal(orc: Orcamento): number {
  const subtotal = orc.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
  return subtotal - orc.desconto;
}
