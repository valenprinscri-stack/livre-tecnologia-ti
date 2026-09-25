import { useState } from 'react';
import type { AppData, Servico } from '@/types';
import { uid, formatBRL } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { Wrench, Plus, Trash2, Pencil } from 'lucide-react';

interface ServicosProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

export function Servicos({ data, update }: ServicosProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Servico, 'id'>>({
    nome: '',
    descricao: '',
    valor: 0,
  });

  function openModal(edit?: Servico) {
    if (edit) {
      setEditId(edit.id);
      setForm({ ...edit });
    } else {
      setEditId(null);
      setForm({ nome: '', descricao: '', valor: 0 });
    }
    setModalOpen(true);
  }

  function save() {
    if (!form.nome.trim()) return;
    if (editId) {
      update((prev) => ({ ...prev, servicos: prev.servicos.map((s) => (s.id === editId ? { ...s, ...form } : s)) }));
    } else {
      update((prev) => ({ ...prev, servicos: [{ id: uid('s'), ...form }, ...prev.servicos] }));
    }
    setModalOpen(false);
  }

  function del(id: string) {
    update((prev) => ({ ...prev, servicos: prev.servicos.filter((s) => s.id !== id) }));
    setDeleteId(null);
  }

  return (
    <div>
      <PageHeader
        title="Serviços"
        subtitle="Tabela de serviços e valores de referência"
        action={
          <button onClick={() => openModal()} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Serviço
          </button>
        }
      />

      {data.servicos.length === 0 ? (
        <EmptyState icon={<Wrench className="h-8 w-8" />} title="Nenhum serviço cadastrado" message="Cadastre serviços para usar em orçamentos e chamados." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.servicos.map((s) => (
            <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-100 text-cyan-600">
                  <Wrench className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openModal(s)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteId(s.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-slate-800">{s.nome}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.descricao}</p>
              <p className="mt-3 text-lg font-bold text-cyan-600">{formatBRL(s.valor)}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Serviço' : 'Novo Serviço'}>
        <div className="space-y-4">
          <Field label="Nome do Serviço">
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex.: Formatação" />
          </Field>
          <Field label="Descrição">
            <textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={2} className={inputClass} placeholder="Descrição do serviço" />
          </Field>
          <Field label="Valor de Referência (R$)">
            <input type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} className={inputClass} step="0.01" min="0" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={save} className={btnPrimary} disabled={!form.nome.trim()}>{editId ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Serviço"
        message="Tem certeza que deseja excluir este serviço?"
        onConfirm={() => deleteId && del(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
