import { useState, useMemo } from 'react';
import type { AppData, Conta, ContaStatus, ContaTipo } from '@/types';
import { uid, formatBRL, formatDate, todayISO, currentMonth } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { DollarSign, Plus, Trash2, TrendingUp, TrendingDown, Wallet, CheckCircle } from 'lucide-react';

interface FinanceiroProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

const statusColor: Record<ContaStatus, string> = {
  Pendente: 'yellow',
  Pago: 'green',
  Atrasado: 'red',
};

type Tab = 'receber' | 'pagar' | 'fluxo';

export function Financeiro({ data, update }: FinanceiroProps) {
  const [tab, setTab] = useState<Tab>('receber');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterMonth, setFilterMonth] = useState(currentMonth());

  const [form, setForm] = useState({
    tipo: 'Pagar' as ContaTipo,
    descricao: '',
    fornecedor: '',
    valor: 0,
    vencimento: todayISO(),
    categoria: '',
    status: 'Pendente' as ContaStatus,
  clienteId: '',
  origem: 'manual' as const,
  });

  const contasFiltradas = useMemo(() => {
    return data.contas.filter((c) => c.vencimento.startsWith(filterMonth));
  }, [data.contas, filterMonth]);

  const contasReceber = contasFiltradas.filter((c) => c.tipo === 'Receber');
  const contasPagar = contasFiltradas.filter((c) => c.tipo === 'Pagar');

  function marcarStatus(id: string, status: ContaStatus) {
    update((prev) => ({
      ...prev,
      contas: prev.contas.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }

  function deleteConta(id: string) {
    update((prev) => ({ ...prev, contas: prev.contas.filter((c) => c.id !== id) }));
    setDeleteId(null);
  }

  function createConta() {
    if (!form.descricao.trim() || form.valor <= 0) return;
    const conta: Conta = {
      id: uid(form.tipo === 'Receber' ? 'cr' : 'cp'),
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      clienteId: form.tipo === 'Receber' && form.clienteId ? form.clienteId : undefined,
      fornecedor: form.fornecedor.trim(),
      valor: form.valor,
      vencimento: form.vencimento,
      categoria: form.categoria.trim() || 'Geral',
      status: form.status,
      origem: 'manual',
    };
    update((prev) => ({ ...prev, contas: [conta, ...prev.contas] }));
    setModalOpen(false);
  }

  function openModal(tipo: ContaTipo) {
    setForm({
      tipo,
      descricao: '',
      fornecedor: '',
      valor: 0,
      vencimento: todayISO(),
      categoria: '',
      status: 'Pendente',
      clienteId: '',
      origem: 'manual',
    });
    setModalOpen(true);
  }

  const fluxo = useMemo(() => {
    const entradas = contasFiltradas.filter((c) => c.tipo === 'Receber' && c.status === 'Pago').reduce((s, c) => s + c.valor, 0);
    const saidas = contasFiltradas.filter((c) => c.tipo === 'Pagar' && c.status === 'Pago').reduce((s, c) => s + c.valor, 0);
    const prevEntradas = contasReceber.filter((c) => c.status === 'Pendente' || c.status === 'Atrasado').reduce((s, c) => s + c.valor, 0);
    const prevSaidas = contasPagar.filter((c) => c.status === 'Pendente' || c.status === 'Atrasado').reduce((s, c) => s + c.valor, 0);
    return { entradas, saidas, saldoRealizado: entradas - saidas, prevEntradas, prevSaidas, saldoPrevisto: entradas + prevEntradas - saidas - prevSaidas };
  }, [contasFiltradas, contasReceber, contasPagar]);

  return (
    <div>
      <PageHeader
        title="Financeiro"
        subtitle="Contas a receber, contas a pagar e fluxo de caixa"
        action={
          <div className="flex gap-2">
            <button onClick={() => openModal('Receber')} className={btnPrimary}>
              <Plus className="h-4 w-4" /> Nova Conta a Receber
            </button>
            <button onClick={() => openModal('Pagar')} className={btnSecondary}>
              <Plus className="h-4 w-4" /> Nova Conta a Pagar
            </button>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
          <button onClick={() => setTab('receber')} className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === 'receber' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>
            Contas a Receber
          </button>
          <button onClick={() => setTab('pagar')} className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === 'pagar' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>
            Contas a Pagar
          </button>
          <button onClick={() => setTab('fluxo')} className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === 'fluxo' ? 'bg-white text-cyan-600 shadow-sm' : 'text-slate-500'}`}>
            Fluxo de Caixa
          </button>
        </div>
        <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={`${inputClass} sm:w-44`} />
      </div>

      {tab === 'receber' && (
        <ContaList
          contas={contasReceber}
          data={data}
          onMarcar={marcarStatus}
          onDelete={(id) => setDeleteId(id)}
          emptyMessage="Nenhuma conta a receber neste mês."
        />
      )}

      {tab === 'pagar' && (
        <ContaList
          contas={contasPagar}
          data={data}
          onMarcar={marcarStatus}
          onDelete={(id) => setDeleteId(id)}
          emptyMessage="Nenhuma conta a pagar neste mês."
        />
      )}

      {tab === 'fluxo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <FluxoCard icon={TrendingUp} label="Entradas Realizadas" value={fluxo.entradas} color="green" />
            <FluxoCard icon={TrendingDown} label="Saídas Realizadas" value={fluxo.saidas} color="red" />
            <FluxoCard icon={Wallet} label="Saldo Realizado" value={fluxo.saldoRealizado} color={fluxo.saldoRealizado >= 0 ? 'green' : 'red'} />
            <FluxoCard icon={DollarSign} label="Saldo Previsto" value={fluxo.saldoPrevisto} color={fluxo.saldoPrevisto >= 0 ? 'green' : 'red'} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Detalhamento do Período</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50">
                <span className="text-sm font-medium text-slate-700">Entradas Previstas (Pendentes)</span>
                <span className="font-bold text-green-600">{formatBRL(fluxo.prevEntradas)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50">
                <span className="text-sm font-medium text-slate-700">Saídas Previstas (Pendentes)</span>
                <span className="font-bold text-red-600">{formatBRL(fluxo.prevSaidas)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-100">
                <span className="text-sm font-semibold text-slate-700">Saldo Final do Período</span>
                <span className={`font-bold ${fluxo.saldoPrevisto >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatBRL(fluxo.saldoPrevisto)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.tipo === 'Receber' ? 'Nova Conta a Receber' : 'Nova Conta a Pagar'}>
        <div className="space-y-4">
          <Field label="Descrição">
            <input value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className={inputClass} placeholder="Ex.: Compra de switch" />
          </Field>
          {form.tipo === 'Receber' && (
            <Field label="Cliente (opcional)">
              <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className={inputClass}>
                <option value="">Sem cliente</option>
                {data.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </Field>
          )}
          {form.tipo === 'Pagar' && (
            <Field label="Fornecedor">
              <input value={form.fornecedor} onChange={(e) => setForm({ ...form, fornecedor: e.target.value })} className={inputClass} placeholder="Nome do fornecedor" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor (R$)">
              <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} className={inputClass} step="0.01" min="0" />
            </Field>
            <Field label="Vencimento">
              <input type="date" value={form.vencimento} onChange={(e) => setForm({ ...form, vencimento: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} className={inputClass} placeholder="Ex.: Peças, Licenças" />
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContaStatus })} className={inputClass}>
                <option value="Pendente">Pendente</option>
                <option value="Pago">Pago</option>
                <option value="Atrasado">Atrasado</option>
              </select>
            </Field>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={createConta} className={btnPrimary} disabled={!form.descricao.trim() || form.valor <= 0}>Salvar</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Lançamento"
        message="Tem certeza que deseja excluir este lançamento?"
        onConfirm={() => deleteId && deleteConta(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

function FluxoCard({ icon: Icon, label, value, color }: { icon: typeof TrendingUp; label: string; value: number; color: string }) {
  const colors: Record<string, string> = {
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-2">
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium text-slate-500">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${value >= 0 ? 'text-slate-800' : 'text-red-600'}`}>{formatBRL(value)}</p>
    </div>
  );
}

function ContaList({ contas, data, onMarcar, onDelete, emptyMessage }: {
  contas: Conta[];
  data: AppData;
  onMarcar: (id: string, status: ContaStatus) => void;
  onDelete: (id: string) => void;
  emptyMessage: string;
}) {
  if (contas.length === 0) {
    return <EmptyState icon={<DollarSign className="h-8 w-8" />} title="Sem lançamentos" message={emptyMessage} />;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
            <th className="px-4 py-3">Descrição</th>
            <th className="px-4 py-3">Categoria</th>
            <th className="px-4 py-3">Vencimento</th>
            <th className="px-4 py-3 text-right">Valor</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {contas.map((c) => {
            const cliente = c.clienteId ? data.clientes.find((cl) => cl.id === c.clienteId) : null;
            return (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-700">{c.descricao}</p>
                  {cliente && <p className="text-xs text-slate-400">{cliente.nome}</p>}
                  {c.fornecedor && <p className="text-xs text-slate-400">{c.fornecedor}</p>}
                  {c.origem === 'contrato' && <span className="text-xs text-cyan-500">Auto (contrato)</span>}
                  {c.origem === 'orcamento' && <span className="text-xs text-cyan-500">Auto (orçamento)</span>}
                </td>
                <td className="px-4 py-3 text-slate-600">{c.categoria}</td>
                <td className="px-4 py-3 text-slate-600">{formatDate(c.vencimento)}</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatBRL(c.valor)}</td>
                <td className="px-4 py-3"><Badge color={statusColor[c.status]}>{c.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {c.status !== 'Pago' && (
                      <button onClick={() => onMarcar(c.id, 'Pago')} className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors" title="Marcar como pago">
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {c.status === 'Pago' && (
                      <button onClick={() => onMarcar(c.id, 'Pendente')} className="p-1.5 rounded-lg text-yellow-500 hover:bg-yellow-50 transition-colors" title="Reverter para pendente">
                        <DollarSign className="h-4 w-4" />
                      </button>
                    )}
                    {c.origem === 'manual' && (
                      <button onClick={() => onDelete(c.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Excluir">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
