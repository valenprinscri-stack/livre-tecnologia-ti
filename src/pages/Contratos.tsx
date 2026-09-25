import { useState, useMemo } from 'react';
import type { AppData, Contrato, ContratoStatus } from '@/types';
import { uid, formatBRL, formatDate, todayISO, currentMonth } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { FileText, Plus, Trash2, AlertCircle, RefreshCw } from 'lucide-react';

interface ContratosProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

const statusColor: Record<ContratoStatus, string> = {
  Ativo: 'green',
  Suspenso: 'yellow',
  Cancelado: 'red',
};

const statusList: ContratoStatus[] = ['Ativo', 'Suspenso', 'Cancelado'];

export function Contratos({ data, update }: ContratosProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ContratoStatus | 'Todos'>('Todos');

  const [form, setForm] = useState({
    clienteId: '',
    valorMensal: 0,
    diaVencimento: 10,
    dataInicio: todayISO(),
    dataTermino: '',
    escopo: '',
    chamadosFranquia: 0,
  status: 'Ativo' as ContratoStatus,
  gerarContas: true,
  });

  const filtered = useMemo(() => {
    return data.contratos.filter((c) => filterStatus === 'Todos' || c.status === filterStatus);
  }, [data.contratos, filterStatus]);

  function openModal() {
    setForm({
      clienteId: data.clientes[0]?.id || '',
      valorMensal: 0,
      diaVencimento: 10,
      dataInicio: todayISO(),
      dataTermino: '',
      escopo: '',
      chamadosFranquia: 0,
      status: 'Ativo',
      gerarContas: true,
    });
    setModalOpen(true);
  }

  function createContrato() {
    if (!form.clienteId) return;
    const contrato: Contrato = {
      id: uid('ct'),
      clienteId: form.clienteId,
      valorMensal: form.valorMensal,
      diaVencimento: form.diaVencimento,
      dataInicio: form.dataInicio,
      dataTermino: form.dataTermino,
      escopo: form.escopo.trim(),
      chamadosFranquia: form.chamadosFranquia,
      status: form.status,
    };
    update((prev) => {
      let contas = prev.contas;
      if (form.gerarContas && form.status === 'Ativo' && form.valorMensal > 0) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const cliente = prev.clientes.find((c) => c.id === form.clienteId);
        const novaConta = {
          id: uid('cr'),
          tipo: 'Receber' as const,
          descricao: `Mensalidade ${now.toLocaleDateString('pt-BR', { month: 'long' })} - ${cliente?.nome || ''}`,
          clienteId: form.clienteId,
          fornecedor: '',
          valor: form.valorMensal,
          vencimento: `${year}-${month}-${String(form.diaVencimento).padStart(2, '0')}`,
          categoria: 'Mensalidade',
          status: 'Pendente' as const,
          origem: 'contrato' as const,
          contratoId: contrato.id,
        };
        contas = [novaConta, ...contas];
      }
      return { ...prev, contratos: [contrato, ...prev.contratos], contas };
    });
    setModalOpen(false);
  }

  function updateStatus(id: string, status: ContratoStatus) {
    update((prev) => ({
      ...prev,
      contratos: prev.contratos.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }

  function deleteContrato(id: string) {
    update((prev) => ({ ...prev, contratos: prev.contratos.filter((c) => c.id !== id) }));
    setDeleteId(null);
  }

  function chamadosNoMes(clienteId: string): number {
    const month = currentMonth();
    return data.chamados.filter((c) => c.clienteId === clienteId && c.dataAbertura.startsWith(month)).length;
  }

  function diasParaRenovacao(dataTermino: string): number {
    if (!dataTermino) return Infinity;
    const diff = new Date(dataTermino).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Gestão de contratos mensais de suporte de TI"
        action={
          <button onClick={openModal} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Contrato
          </button>
        }
      />

      <div className="mb-4">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ContratoStatus | 'Todos')} className={`${inputClass} sm:w-48`}>
          <option value="Todos">Todos os Status</option>
          {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<FileText className="h-8 w-8" />} title="Nenhum contrato encontrado" message="Cadastre contratos mensais para gerenciar a recorrência dos clientes." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((ct) => {
            const cliente = data.clientes.find((c) => c.id === ct.clienteId);
            const chamadosMes = chamadosNoMes(ct.clienteId);
            const dias = diasParaRenovacao(ct.dataTermino);
            const renovacaoProxima = ct.status === 'Ativo' && dias <= 90 && dias > 0;
            const franquia = ct.chamadosFranquia;
            const franquiaUsada = franquia > 0 && chamadosMes >= franquia;

            return (
              <div key={ct.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800">{cliente?.nome || 'Cliente'}</h3>
                    <p className="text-sm text-slate-500">{formatBRL(ct.valorMensal)}/mês · Vencimento dia {ct.diaVencimento}</p>
                  </div>
                  <Badge color={statusColor[ct.status]}>{ct.status}</Badge>
                </div>

                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Início:</span>
                    <span className="font-medium">{formatDate(ct.dataInicio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Renovação/Término:</span>
                    <span className="font-medium">{formatDate(ct.dataTermino) || 'Indefinido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Escopo:</span>
                    <span className="font-medium text-right">{ct.escopo || 'Não definido'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Franquia:</span>
                    <span className="font-medium">{franquia === 0 ? 'Ilimitado' : `${chamadosMes}/${franquia} chamados/mês`}</span>
                  </div>
                </div>

                {renovacaoProxima && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                    <AlertCircle className="h-4 w-4" /> Renovação em {dias} dias
                  </div>
                )}

                {franquiaUsada && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4" /> Franquia de chamados esgotada este mês
                  </div>
                )}

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex gap-2">
                    {statusList.map((s) => (
                      <button
                        key={s}
                        onClick={() => updateStatus(ct.id, s)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                          ct.status === s ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setDeleteId(ct.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Contrato" maxWidth="max-w-xl">
        <div className="space-y-4">
          <Field label="Cliente">
            <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className={inputClass}>
              <option value="">Selecione...</option>
              {data.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Valor Mensal (R$)">
              <input type="number" value={form.valorMensal} onChange={(e) => setForm({ ...form, valorMensal: Number(e.target.value) })} className={inputClass} step="0.01" min="0" />
            </Field>
            <Field label="Dia de Vencimento">
              <input type="number" value={form.diaVencimento} onChange={(e) => setForm({ ...form, diaVencimento: Number(e.target.value) })} className={inputClass} min="1" max="28" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Data de Início">
              <input type="date" value={form.dataInicio} onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Data de Término/Renovação">
              <input type="date" value={form.dataTermino} onChange={(e) => setForm({ ...form, dataTermino: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Escopo / Franquia de Atendimento">
            <input value={form.escopo} onChange={(e) => setForm({ ...form, escopo: e.target.value })} className={inputClass} placeholder="Ex.: Suporte ilimitado ou até 10 chamados/mês" />
          </Field>
          <Field label="Franquia de Chamados por Mês (0 = ilimitado)">
            <input type="number" value={form.chamadosFranquia} onChange={(e) => setForm({ ...form, chamadosFranquia: Number(e.target.value) })} className={inputClass} min="0" />
          </Field>
          <Field label="Status Inicial">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContratoStatus })} className={inputClass}>
              {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          {form.status === 'Ativo' && form.valorMensal > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.gerarContas} onChange={(e) => setForm({ ...form, gerarContas: e.target.checked })} className="rounded border-slate-300" />
              Gerar conta a receber da mensalidade deste mês
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={createContrato} className={btnPrimary} disabled={!form.clienteId}>
              <RefreshCw className="h-4 w-4" /> Criar Contrato
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Contrato"
        message="Tem certeza que deseja excluir este contrato? As contas a receber já geradas não serão afetadas."
        onConfirm={() => deleteId && deleteContrato(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
