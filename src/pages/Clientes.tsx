import { useState, useMemo } from 'react';
import type { AppData, Cliente } from '@/types';
import { uid } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { Users, Plus, Search, Trash2, Pencil, FileText, Phone, Mail, MapPin, KeyRound, Check, Copy, Loader2 } from 'lucide-react';
import { supabase } from '@/supabaseClient';

interface ClientesProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

export function Clientes({ data, update }: ClientesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Access modal state
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessCliente, setAccessCliente] = useState<Cliente | null>(null);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessSuccess, setAccessSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Cliente, 'id'>>({
    tipo: 'PJ',
    nome: '',
    documento: '',
    telefone: '',
    whatsapp: '',
    email: '',
    endereco: '',
    observacoes: '',
  });

  const filtered = useMemo(() => {
    return data.clientes.filter((c) =>
      !search ||
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.documento.includes(search) ||
      c.email.toLowerCase().includes(search.toLowerCase())
    );
  }, [data.clientes, search]);

  function hasContratoAtivo(clienteId: string): boolean {
    return data.contratos.some((c) => c.clienteId === clienteId && c.status === 'Ativo');
  }

  function openModal(edit?: Cliente) {
    if (edit) {
      setEditId(edit.id);
      setForm({ ...edit });
    } else {
      setEditId(null);
      setForm({ tipo: 'PJ', nome: '', documento: '', telefone: '', whatsapp: '', email: '', endereco: '', observacoes: '' });
    }
    setModalOpen(true);
  }

  function saveCliente() {
    if (!form.nome.trim()) return;
    if (editId) {
      update((prev) => ({
        ...prev,
        clientes: prev.clientes.map((c) => (c.id === editId ? { ...c, ...form } : c)),
      }));
    } else {
      const novo: Cliente = { id: uid('cli'), ...form };
      update((prev) => ({ ...prev, clientes: [novo, ...prev.clientes] }));
    }
    setModalOpen(false);
  }

  function deleteCliente(id: string) {
    update((prev) => ({ ...prev, clientes: prev.clientes.filter((c) => c.id !== id) }));
    setDeleteId(null);
  }

  function openAccessModal(cliente: Cliente) {
    setAccessCliente(cliente);
    setAccessEmail(cliente.email || '');
    setAccessPassword('');
    setAccessError(null);
    setAccessSuccess(null);
    setAccessModalOpen(true);
  }

  async function generateAccess() {
    if (!accessCliente || !accessEmail.trim() || !accessPassword.trim()) return;
    if (accessPassword.length < 6) {
      setAccessError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setAccessBusy(true);
    setAccessError(null);
    setAccessSuccess(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setAccessError('Sessão expirada. Faça login novamente.');
        setAccessBusy(false);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-client-access`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            email: accessEmail.trim(),
            password: accessPassword,
            cliente_id: accessCliente.id,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        setAccessError(result.error || 'Erro ao gerar acesso.');
      } else {
        const cred = `E-mail: ${accessEmail.trim()} | Senha: ${accessPassword}`;
        setAccessSuccess(cred);
      }
    } catch (err) {
      setAccessError(err instanceof Error ? err.message : 'Erro inesperado');
    }
    setAccessBusy(false);
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle="Cadastro de pessoas jurídicas e físicas"
        action={
          <button onClick={() => openModal()} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        }
      />

      <div className="mb-4 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, documento ou email..." className={`${inputClass} pl-10`} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Users className="h-8 w-8" />} title="Nenhum cliente encontrado" message="Cadastre seus clientes para gerenciar chamados, contratos e orçamentos." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const contrato = hasContratoAtivo(c.id);
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-white text-sm font-bold">
                      {c.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{c.nome}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge color={c.tipo === 'PJ' ? 'blue' : 'purple'}>{c.tipo}</Badge>
                        {contrato && <Badge color="green">Com Contrato</Badge>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-slate-600">
                  <p className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-slate-400" /> {c.documento || 'Sem documento'}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {c.telefone || 'Sem telefone'}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {c.whatsapp || 'Sem WhatsApp'}</p>
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {c.email || 'Sem email'}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {c.endereco || 'Sem endereço'}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <button
                    onClick={() => openAccessModal(c)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-semibold text-cyan-700 hover:bg-cyan-100 transition-colors"
                    title="Gerar acesso ao Portal do Cliente"
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Gerar Acesso
                  </button>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openModal(c)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(c.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-50 transition-colors" title="Excluir">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Cliente' : 'Novo Cliente'} maxWidth="max-w-xl">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo">
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as 'PJ' | 'PF' })} className={inputClass}>
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
            </Field>
            <Field label={form.tipo === 'PJ' ? 'CNPJ' : 'CPF'}>
              <input value={form.documento} onChange={(e) => setForm({ ...form, documento: e.target.value })} className={inputClass} placeholder={form.tipo === 'PJ' ? '00.000.000/0001-00' : '000.000.000-00'} />
            </Field>
          </div>
          <Field label={form.tipo === 'PJ' ? 'Razão Social / Nome' : 'Nome Completo'}>
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Nome do cliente" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Telefone">
              <input value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} className={inputClass} placeholder="(00) 0000-0000" />
            </Field>
            <Field label="WhatsApp">
              <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} placeholder="(00) 90000-0000" />
            </Field>
          </div>
          <Field label="E-mail">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder="email@exemplo.com" />
          </Field>
          <Field label="Endereço">
            <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inputClass} placeholder="Rua, número, cidade/UF" />
          </Field>
          <Field label="Observações">
            <textarea value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} rows={2} className={inputClass} />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={saveCliente} className={btnPrimary} disabled={!form.nome.trim()}>{editId ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </div>
      </Modal>

      {/* Access Modal */}
      <Modal open={accessModalOpen} onClose={() => setAccessModalOpen(false)} title="Gerar Acesso ao Portal do Cliente" maxWidth="max-w-md">
        <div className="space-y-4">
          {accessCliente && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm">
              <p className="font-semibold text-slate-700">{accessCliente.nome}</p>
              <p className="text-slate-500">Ao gerar o acesso, este cliente poderá entrar no Portal do Cliente para abrir e acompanhar seus próprios chamados.</p>
            </div>
          )}

          {accessSuccess ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
                <Check className="h-5 w-5" />
                <span>Acesso criado com sucesso! Compartilhe as credenciais abaixo com o cliente:</span>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-mono text-slate-700 break-all">{accessSuccess}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(accessSuccess);
                }}
                className={`${btnSecondary} w-full justify-center`}
              >
                <Copy className="h-4 w-4" /> Copiar Credenciais
              </button>
              <button onClick={() => setAccessModalOpen(false)} className={`${btnPrimary} w-full justify-center`}>
                Concluir
              </button>
            </div>
          ) : (
            <>
              <Field label="E-mail de acesso">
                <input
                  type="email"
                  value={accessEmail}
                  onChange={(e) => setAccessEmail(e.target.value)}
                  className={inputClass}
                  placeholder="cliente@email.com"
                />
              </Field>
              <Field label="Senha temporária">
                <input
                  type="text"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  className={inputClass}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
                <p className="mt-1 text-xs text-slate-400">O cliente poderá alterar a senha após o primeiro acesso.</p>
              </Field>

              {accessError && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
                  {accessError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setAccessModalOpen(false)} className={btnSecondary}>Cancelar</button>
                <button onClick={generateAccess} className={btnPrimary} disabled={!accessEmail.trim() || !accessPassword.trim() || accessBusy}>
                  {accessBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Gerar Acesso
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Cliente"
        message="Tem certeza que deseja excluir este cliente? Chamados e contratos vinculados não serão excluídos."
        onConfirm={() => deleteId && deleteCliente(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
