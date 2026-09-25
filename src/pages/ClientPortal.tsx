import { useState, useMemo } from 'react';
import type { AppData, Chamado, ChamadoCategoria, ChamadoPrioridade } from '@/types';
import { uid, formatDate, todayISO } from '@/store';
import { Badge, btnPrimary, btnSecondary, inputClass, Field, EmptyState } from '@/components/ui';
import { Cpu, Ticket, Plus, LogOut, Clock, CheckCircle, AlertCircle, Loader2, ListChecks, FileEdit } from 'lucide-react';
import { useAuth } from '@/auth';
import { supabase } from '@/supabaseClient';

interface ClientPortalProps {
  data: AppData;
  reload: () => Promise<void>;
}

type PortalTab = 'meus-chamados' | 'novo-chamado';

const statusColor: Record<string, string> = {
  Aberto: 'blue',
  'Em Atendimento': 'yellow',
  'Aguardando Peça': 'orange',
  Concluído: 'green',
};

const statusIcon: Record<string, typeof Clock> = {
  Aberto: AlertCircle,
  'Em Atendimento': Clock,
  'Aguardando Peça': Clock,
  Concluído: CheckCircle,
};

const prioridadeColor: Record<string, string> = {
  Baixa: 'slate',
  Média: 'blue',
  Alta: 'orange',
  Crítica: 'red',
};

const categorias: ChamadoCategoria[] = ['Redes', 'Computador/Hardware', 'Internet/Wi-Fi', 'Impressora', 'Outros'];
const prioridades: ChamadoPrioridade[] = ['Baixa', 'Média', 'Alta', 'Crítica'];

export function ClientPortal({ data, reload }: ClientPortalProps) {
  const { user, signOut, clienteId } = useAuth();
  const [tab, setTab] = useState<PortalTab>('meus-chamados');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState({
    titulo: '',
    categoria: 'Redes' as ChamadoCategoria,
    prioridade: 'Média' as ChamadoPrioridade,
    descricao: '',
  });

  const myChamados = useMemo(() => {
    if (!clienteId) return [];
    return data.chamados
      .filter((c) => c.clienteId === clienteId)
      .sort((a, b) => b.dataAbertura.localeCompare(a.dataAbertura));
  }, [data.chamados, clienteId]);

  const myCliente = data.clientes.find((c) => c.id === clienteId);

  async function createChamado() {
    if (!form.titulo.trim() || !clienteId) return;
    setBusy(true);
    setError(null);
    setSuccess(null);

    const novo: Chamado = {
      id: uid('ch'),
      clienteId,
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      prioridade: form.prioridade,
      status: 'Aberto',
      descricao: form.descricao.trim(),
      tecnico: 'A definir',
      dataAbertura: todayISO(),
      notas: [],
    };

    const { error: insertError } = await supabase.from('chamados').insert({
      id: novo.id,
      cliente_id: novo.clienteId,
      titulo: novo.titulo,
      categoria: novo.categoria,
      prioridade: novo.prioridade,
      status: novo.status,
      descricao: novo.descricao,
      tecnico: novo.tecnico,
      data_abertura: novo.dataAbertura,
      notas: novo.notas,
    });

    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setForm({ titulo: '', categoria: 'Redes', prioridade: 'Média', descricao: '' });
    setSuccess('Chamado aberto com sucesso! A equipe entrará em contato em breve.');
    await reload();
    setTab('meus-chamados');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-4xl px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-slate-900">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">Livre Tecnologia TI</h1>
              <p className="text-xs text-slate-400">Portal do Cliente</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold truncate max-w-40">{myCliente?.nome || user?.email}</p>
              <p className="text-xs text-slate-400">Cliente</p>
            </div>
            <button onClick={signOut} className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors" title="Sair">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation tabs */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="mx-auto max-w-4xl px-4 flex gap-1">
          <button
            onClick={() => setTab('meus-chamados')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'meus-chamados'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <ListChecks className="h-4 w-4" />
            Meus Chamados
          </button>
          <button
            onClick={() => { setTab('novo-chamado'); setError(null); setSuccess(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'novo-chamado'
                ? 'border-cyan-500 text-cyan-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileEdit className="h-4 w-4" />
            Novo Chamado
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {success}
          </div>
        )}

        {/* MEUS CHAMADOS TAB */}
        {tab === 'meus-chamados' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Meus Chamados</h2>
              <p className="text-sm text-slate-500">Acompanhe o status dos seus chamados de suporte</p>
            </div>

            {/* Quick stats */}
            <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(['Aberto', 'Em Atendimento', 'Aguardando Peça', 'Concluído'] as const).map((st) => {
                const count = myChamados.filter((c) => c.status === st).length;
                const Icon = statusIcon[st];
                return (
                  <div key={st} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-500">{st}</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{count}</p>
                  </div>
                );
              })}
            </div>

            {myChamados.length === 0 ? (
              <EmptyState
                icon={<Ticket className="h-8 w-8" />}
                title="Nenhum chamado aberto"
                message="Abra seu primeiro chamado de suporte técnico na aba 'Novo Chamado'."
                action={
                  <button onClick={() => setTab('novo-chamado')} className={btnPrimary}>
                    <Plus className="h-4 w-4" /> Novo Chamado
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {myChamados.map((ch) => (
                  <div key={ch.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-slate-800">{ch.titulo}</h3>
                          <Badge color={statusColor[ch.status]}>{ch.status}</Badge>
                          <Badge color={prioridadeColor[ch.prioridade]}>{ch.prioridade}</Badge>
                        </div>
                        <p className="text-sm text-slate-500">
                          {ch.categoria} · Aberto em {formatDate(ch.dataAbertura)}
                          {ch.tecnico && ch.tecnico !== 'A definir' && ` · Técnico: ${ch.tecnico}`}
                        </p>
                        {ch.descricao && (
                          <p className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{ch.descricao}</p>
                        )}
                        {ch.notas.length > 0 && (
                          <div className="mt-3 space-y-1.5">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Notas do atendimento</p>
                            {ch.notas.map((n) => (
                              <div key={n.id} className="rounded-lg bg-slate-50 border border-slate-100 p-2.5">
                                <p className="text-xs text-slate-400 mb-0.5">{n.tecnico} · {formatDate(n.data)}</p>
                                <p className="text-sm text-slate-600">{n.texto}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* NOVO CHAMADO TAB */}
        {tab === 'novo-chamado' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Novo Chamado</h2>
              <p className="text-sm text-slate-500">Preencha os campos abaixo para abrir um chamado de suporte</p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="space-y-5">
                <Field label="Título do Problema">
                  <input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    className={inputClass}
                    placeholder="Ex.: Internet não funciona no setor financeiro"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Categoria do Problema">
                    <select
                      value={form.categoria}
                      onChange={(e) => setForm({ ...form, categoria: e.target.value as ChamadoCategoria })}
                      className={inputClass}
                    >
                      {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>

                  <Field label="Prioridade Percebida">
                    <select
                      value={form.prioridade}
                      onChange={(e) => setForm({ ...form, prioridade: e.target.value as ChamadoPrioridade })}
                      className={inputClass}
                    >
                      {prioridades.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                </div>

                <Field label="Descrição Detalhada">
                  <textarea
                    value={form.descricao}
                    onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                    rows={5}
                    className={inputClass}
                    placeholder="Descreva o problema com o máximo de detalhes possível: quando começou, qual equipamento é afetado, se há mensagens de erro, etc."
                  />
                </Field>

                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => setTab('meus-chamados')} className={btnSecondary}>
                    Cancelar
                  </button>
                  <button onClick={createChamado} className={btnPrimary} disabled={!form.titulo.trim() || busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Abrir Chamado
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
