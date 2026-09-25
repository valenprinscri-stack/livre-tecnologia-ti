import { useState } from 'react';
import type { AppData, Produto } from '@/types';
import { uid, formatBRL } from '@/store';
import { Modal, Field, inputClass, btnPrimary, btnSecondary, Badge, PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { Package, Plus, Trash2, Pencil, AlertTriangle } from 'lucide-react';

interface ProdutosProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

export function Produtos({ data, update }: ProdutosProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<Produto, 'id'>>({
    nome: '',
    custoCompra: 0,
    precoVenda: 0,
    estoque: 0,
  });

  function openModal(edit?: Produto) {
    if (edit) {
      setEditId(edit.id);
      setForm({ ...edit });
    } else {
      setEditId(null);
      setForm({ nome: '', custoCompra: 0, precoVenda: 0, estoque: 0 });
    }
    setModalOpen(true);
  }

  function save() {
    if (!form.nome.trim()) return;
    if (editId) {
      update((prev) => ({ ...prev, produtos: prev.produtos.map((p) => (p.id === editId ? { ...p, ...form } : p)) }));
    } else {
      update((prev) => ({ ...prev, produtos: [{ id: uid('p'), ...form }, ...prev.produtos] }));
    }
    setModalOpen(false);
  }

  function del(id: string) {
    update((prev) => ({ ...prev, produtos: prev.produtos.filter((p) => p.id !== id) }));
    setDeleteId(null);
  }

  return (
    <div>
      <PageHeader
        title="Produtos e Materiais"
        subtitle="Controle de estoque e precificação"
        action={
          <button onClick={() => openModal()} className={btnPrimary}>
            <Plus className="h-4 w-4" /> Novo Produto
          </button>
        }
      />

      {data.produtos.length === 0 ? (
        <EmptyState icon={<Package className="h-8 w-8" />} title="Nenhum produto cadastrado" message="Cadastre produtos e materiais para usar em orçamentos e chamados." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-right">Custo</th>
                <th className="px-4 py-3 text-right">Preço Venda</th>
                <th className="px-4 py-3 text-right">Margem</th>
                <th className="px-4 py-3 text-center">Estoque</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.produtos.map((p) => {
                const margem = p.custoCompra > 0 ? ((p.precoVenda - p.custoCompra) / p.custoCompra) * 100 : 0;
                const estoqueBaixo = p.estoque <= 5;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700">{p.nome}</td>
                    <td className="px-4 py-3 text-right text-slate-600">{formatBRL(p.custoCompra)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-700">{formatBRL(p.precoVenda)}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge color={margem >= 30 ? 'green' : margem >= 15 ? 'yellow' : 'red'}>{margem.toFixed(0)}%</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 ${estoqueBaixo ? 'text-red-500 font-semibold' : 'text-slate-600'}`}>
                        {estoqueBaixo && <AlertTriangle className="h-3.5 w-3.5" />}
                        {p.estoque}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openModal(p)} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">
          <Field label="Nome do Produto">
            <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} placeholder="Ex.: Switch Gigabit 24 Portas" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Custo de Compra (R$)">
              <input type="number" value={form.custoCompra} onChange={(e) => setForm({ ...form, custoCompra: Number(e.target.value) })} className={inputClass} step="0.01" min="0" />
            </Field>
            <Field label="Preço de Venda (R$)">
              <input type="number" value={form.precoVenda} onChange={(e) => setForm({ ...form, precoVenda: Number(e.target.value) })} className={inputClass} step="0.01" min="0" />
            </Field>
          </div>
          <Field label="Estoque">
            <input type="number" value={form.estoque} onChange={(e) => setForm({ ...form, estoque: Number(e.target.value) })} className={inputClass} min="0" />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className={btnSecondary}>Cancelar</button>
            <button onClick={save} className={btnPrimary} disabled={!form.nome.trim()}>{editId ? 'Salvar' : 'Cadastrar'}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir Produto"
        message="Tem certeza que deseja excluir este produto?"
        onConfirm={() => deleteId && del(deleteId)}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
