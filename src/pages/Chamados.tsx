import { useState, useMemo } from 'react';
import type { AppData, Chamado, ChamadoStatus, ChamadoPrioridade, ChamadoCategoria, NotaAtendimento } from '@/types';
import { uid, formatBRL, formatDate, todayISO } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { Ticket, Plus, Search, FileText, Trash2, User } from 'lucide-react';

interface ChamadosProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

const statusColor: Record<ChamadoStatus, string> = {
  Aberto: 'blue',
  'Em Atendimento': 'yellow',
  'Aguardando Peça': 'orange',
  Concluído: 'green',
};

const prioridadeColor: Record<ChamadoPrioridade, string> = {
  Baixa: 'gray',
  Média: 'blue',
  Alta: 'orange',
  Crítica: 'red',
};

const categorias: ChamadoCategoria[] = ['Redes', 'Hardware', 'Servidores', 'Suporte ao Usuário', 'Cabeamento'];
const statusList: ChamadoStatus[] = ['Aberto', 'Em Atendimento', 'Aguardando Peça', 'Concluído'];
const prioridades: ChamadoPrioridade[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export function Chamados({ data, update }: ChamadosProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [detailChamado, setDetailChamado] = useState<Chamado | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ChamadoStatus | 'Todos'>('Todos');
  const [filterPrioridade, setFilterPrioridade] = useState<ChamadoPrioridade | 'Todas'>('Todas');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    clienteId: '',
    titulo: '',
    categoria: 'Redes' as ChamadoCategoria,
    prioridade: 'Média' as ChamadoPrioridade,
    descricao: '',
    tecnico: '',
  });

  const filtered = useMemo(() => {
    return data.chamados.filter((c) => {
      if (filterStatus !== 'Todos' && c.status !== filterStatus) return false;
      if (filterPrioridade !== 'Todas' && c.prioridade !== filterPrioridade) return false;
      if (search && !c.titulo.toLowerCase().includes(search.toLowerCase()) && !c.descricao.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [data.chamados, filterStatus, filterPrioridade, search]);

  function hasContratoAtivo(clienteId: string): boolean {
    return data.contratos.some((c) => c.clienteId === clienteId && c.status === 'Ativo');
  }

  function openModal() {
    setForm({ clienteId: data.clientes[0]?.id || '', titulo: '', categoria: 'Redes', prioridade: 'Média', descricao: '', tecnico: '' });
    setModalOpen(true);
  }

  function createChamado() {
    if (!form.clienteId || !form.titulo.trim()) return;
    const novo: Chamado = {
      id: uid('ch'),
      clienteId: form.clienteId,
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      prioridade: form.prioridade,
      status: 'Aberto',
      descricao: form.descricao.trim(),
      tecnico: form.tecnico.trim() || 'A definir',
      dataAbertura: todayISO(),
      notas: [],
    };
    update((prev) => ({ ...prev, chamados: [novo, ...prev.chamados] }));
    setModalOpen(false);
  }

  function updateChamadoStatus(id: string, status: ChamadoStatus) {
    update((prev) => ({
      ...prev,
      chamados: prev.chamados.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
    setDetailChamado((dc) => (dc && dc.id === id ? { ...dc, status } : dc));
  }

  function addNota(chamadoId: string, texto: string, tecnico: string) {
    const nota: NotaAtendimento = { id: uid('n'), data: todayISO(), tecnico: tecnico || 'Técnico', texto };
    update((prev) => ({
      ...prev,
      chamados: prev.chamados.map((c) => (c.id === chamadoId ? { ...c, notas: [...c.notas, nota] } : c)),
    }));
    setDetailChamado((dc) => (dc && dc.id === chamadoId ? { ...dc, notas: [...dc.notas, nota] } : dc));
  }

  function deleteChamado(id: string) {
    update((prev) => ({ ...prev, chamados: prev.chamados.filter((c) => c.id !== id) }));
    setDeleteId(null);
    setDetailChamado(null);
  }

  return (
    <div>
      <PageHeader
        title="Chamados de Clientes"
        subtitle="Gestão de suporte técnico e helpdesk"
        action={
          <button onClick={openModal} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Chamado
          </button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar chamados..."
            className={`${inputClass} pl-10`}
          />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as ChamadoStatus | 'Todos')} className={`${inputClass} sm:w-44`}>
          <option value="Todos">Todos os Status</option>
          {statusList.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPrioridade} onChange={(e) => setFilterPrioridade(e.target.value as ChamadoPrioridade | 'Todas')} className={`${inputClass} sm:w-44`}>
          <option value="Todas">Todas as Prioridades</option>
          {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Ticket className="h-8 w-8" />} title="Nenhum chamado encontrado" message="Crie um novo chamado para começar o atendimento." />
      ) : (
        <div className="space-y-3">
          {filtered.map((ch) => {
            const cliente = data.clientes.find((c) => c.id === ch.clienteId);
            const contrato = hasContratoAtivo(ch.clienteId);
            return (
              <div
                key={ch.id}
                onClick={() => setDetailChamado(ch)}
                className="cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-cyan-300 transition-all"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800 truncate">{ch.titulo}</h3>
                      <Badge color={statusColor[ch.status]}>{ch.status}</Badge>
                      <Badge color={prioridadeColor[ch.prioridade]}>{ch.prioridade}</Badge>
                      {contrato ? <Badge color="green">Mensalista</Badge> : <Badge color="gray">Avulso</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 truncate">{cliente?.nome} · {ch.categoria} · {ch.tecnico}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>{formatDate(ch.dataAbertura)}</span>
                    <FileText className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Chamado">
        <div className="space-y-4">
          <Field label="Cliente">
            <select value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })} className={inputClass}>
              {data.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </Field>
          <Field label="Título do Chamado">
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className={inputClass} placeholder="Ex.: Internet não funciona" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Categoria">
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as ChamadoCategoria })} className={inputClass}>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Prioridade">
              <select value={form.prioridade} onChange={(e) => setForm({ ...form, prioridade: e.target.value as ChamadoPrioridade })} className={inputClass}>
                {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Técnico Responsável">
            <input value={form.tecnico} onChange={(e) => setForm({ ...form, tecnico: e.target.value })} className={inputClass} placeholder="Nome do técnico" />
          </Field>
          <Field label="Descrição do Problema">
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} className={inputClass} placeholder="Descreva o problema relatado..." />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={createChamado} className={btnPrimary} disabled={!form.titulo.trim() || !form.clienteId}>Criar Chamado</button>
          </div>
        </div>
      </Modal>

      {detailChamado && (
        <ChamadoDetail
          chamado={detailChamado}
          data={data}
          onClose={() => setDetailChamado(null)}
          onStatusChange={updateChamadoStatus}
          onAddNota={addNota}
          onDelete={() => setDeleteId(detailChamado.id)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Chamado"
        message="Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita."
        onConfirm={() => deleteId && deleteChamado(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}

interface ChamadoDetailProps {
  chamado: Chamado;
  data: AppData;
  onClose: () => void;
  onStatusChange: (id: string, status: ChamadoStatus) => void;
  onAddNota: (chamadoId: string, texto: string, tecnico: string) => void;
  onDelete: () => void;
}

function ChamadoDetail({ chamado, data, onClose, onStatusChange, onAddNota, onDelete }: ChamadoDetailProps) {
  const [notaTexto, setNotaTexto] = useState('');
  const [notaTecnico, setNotaTecnico] = useState('');
  const cliente = data.clientes.find((c) => c.id === chamado.clienteId);
  const contrato = data.contratos.find((c) => c.clienteId === chamado.clienteId && c.status === 'Ativo');

  return (
    <Modal open onClose={onClose} title="Detalhes do Chamado" maxWidth="max-w-2xl">
      <div className="space-y-5">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <h3 className="text-lg font-bold text-slate-800">{chamado.titulo}</h3>
            <Badge color={statusColor[chamado.status]}>{chamado.status}</Badge>
            <Badge color={prioridadeColor[chamado.prioridade]}>{chamado.prioridade}</Badge>
            {contrato ? <Badge color="green">Mensalista</Badge> : <Badge color="gray">Avulso</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-slate-500">Cliente: </span><span className="font-medium text-slate-700">{cliente?.nome}</span></div>
            <div><span className="text-slate-500">Categoria: </span><span className="font-medium text-slate-700">{chamado.categoria}</span></div>
            <div><span className="text-slate-500">Técnico: </span><span className="font-medium text-slate-700">{chamado.tecnico}</span></div>
            <div><span className="text-slate-500">Abertura: </span><span className="font-medium text-slate-700">{formatDate(chamado.dataAbertura)}</span></div>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-1">Descrição</p>
          <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{chamado.descricao || 'Sem descrição'}</p>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Alterar Status</p>
          <div className="flex flex-wrap gap-2">
            {statusList.map((s) => (
              <button
                key={s}
                onClick={() => onStatusChange(chamado.id, s)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                  chamado.status === s ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-slate-700 mb-2">Notas de Atendimento</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {chamado.notas.length === 0 ? (
              <p className="text-sm text-slate-400 italic">Nenhuma nota registrada.</p>
            ) : (
              chamado.notas.map((n) => (
                <div key={n.id} className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-600">{n.tecnico}</span>
                    <span className="text-xs text-slate-400">{formatDate(n.data)}</span>
                  </div>
                  <p className="text-sm text-slate-600">{n.texto}</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-3 space-y-2">
            <input value={notaTecnico} onChange={(e) => setNotaTecnico(e.target.value)} className={inputClass} placeholder="Técnico" />
            <textarea value={notaTexto} onChange={(e) => setNotaTexto(e.target.value)} rows={2} className={inputClass} placeholder="Nova nota de atendimento..." />
            <button
              onClick={() => {
                if (notaTexto.trim()) {
                  onAddNota(chamado.id, notaTexto.trim(), notaTecnico.trim());
                  setNotaTexto('');
                  setNotaTecnico('');
                }
              }}
              className={btnSecondary}
              disabled={!notaTexto.trim()}
            >
              <Plus className="h-4 w-4" /> Adicionar Nota
            </button>
          </div>
        </div>

        <div className="flex justify-between pt-2 border-t border-slate-200">
          <button onClick={onDelete} className="inline-flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-600">
            <Trash2 className="h-4 w-4" /> Excluir
          </button>
          <button onClick={onClose} className={btnSecondary}>Fechar</button>
        </div>
      </div>
    </Modal>
  );
}
