import { useState } from 'react';
import type { AppData, Orcamento, OrcamentoItem, OrcamentoStatus } from '@/types';
import { uid, formatBRL, todayISO } from '@/store';
import { Field, inputClass, btnPrimary, btnSecondary, PageHeader } from '@/components/ui';
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react';
import type { PageKey } from '@/components/Layout';

interface NovoOrcamentoProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
  onNavigate: (page: PageKey) => void;
  onViewRecibo: (orcamentoId: string) => void;
}

export function NovoOrcamento({ data, update, onNavigate, onViewRecibo }: NovoOrcamentoProps) {
  const [clienteId, setClienteId] = useState(data.clientes[0]?.id || '');
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [desconto, setDesconto] = useState(0);
  const [prazo, setPrazo] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<OrcamentoStatus>('Rascunho');

  const [novoItem, setNovoItem] = useState({
    tipo: 'Serviço' as 'Material' | 'Serviço',
    nome: '',
    quantidade: 1,
    precoUnitario: 0,
  });

  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
  const total = subtotal - desconto;

  function addItem() {
    if (!novoItem.nome.trim() || novoItem.quantidade <= 0) return;
    const item: OrcamentoItem = {
      id: uid('oi'),
      tipo: novoItem.tipo,
      nome: novoItem.nome.trim(),
      quantidade: novoItem.quantidade,
      precoUnitario: novoItem.precoUnitario,
    };
    setItens([...itens, item]);
    setNovoItem({ tipo: 'Serviço', nome: '', quantidade: 1, precoUnitario: 0 });
  }

  function removeItem(id: string) {
    setItens(itens.filter((i) => i.id !== id));
  }

  function addProdutoQuick(produtoId: string) {
    const p = data.produtos.find((pr) => pr.id === produtoId);
    if (!p) return;
    setItens([...itens, { id: uid('oi'), tipo: 'Material', nome: p.nome, quantidade: 1, precoUnitario: p.precoVenda }]);
  }

  function addServicoQuick(servicoId: string) {
    const s = data.servicos.find((sv) => sv.id === servicoId);
    if (!s) return;
    setItens([...itens, { id: uid('oi'), tipo: 'Serviço', nome: s.nome, quantidade: 1, precoUnitario: s.valor }]);
  }

  function salvarOrcamento(statusFinal: OrcamentoStatus) {
    if (!clienteId || itens.length === 0) return;
    const orc: Orcamento = {
      id: uid('orc'),
      clienteId,
      itens,
      desconto,
      prazo,
      formaPagamento,
      status: statusFinal,
      data: todayISO(),
      observacoes,
    };
    update((prev) => ({ ...prev, orcamentos: [orc, ...prev.orcamentos] }));
    onViewRecibo(orc.id);
  }

  return (
    <div>
      <PageHeader
        title="Novo Orçamento"
        subtitle="Crie uma proposta com materiais e serviços"
        action={
          <button onClick={() => onNavigate('orcamentos')} className={btnSecondary}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Dados do Orçamento</h3>
            <div className="space-y-4">
              <Field label="Cliente">
                <select value={clienteId} onChange={(e) => setClienteId(e.target.value)} className={inputClass}>
                  <option value="">Selecione...</option>
                  {data.clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Prazo de Entrega">
                  <input value={prazo} onChange={(e) => setPrazo(e.target.value)} className={inputClass} placeholder="Ex.: 5 dias úteis" />
                </Field>
                <Field label="Forma de Pagamento">
                  <input value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)} className={inputClass} placeholder="Ex.: Pix, Cartão" />
                </Field>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4">Itens do Orçamento</h3>

            <div className="grid grid-cols-12 gap-2 mb-3">
              <select value={novoItem.tipo} onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as 'Material' | 'Serviço' })} className={`${inputClass} col-span-2`}>
                <option value="Material">Material</option>
                <option value="Serviço">Serviço</option>
              </select>
              <input value={novoItem.nome} onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })} className={`${inputClass} col-span-4`} placeholder="Descrição do item" />
              <input type="number" value={novoItem.quantidade} onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })} className={`${inputClass} col-span-2`} placeholder="Qtd" min="1" />
              <input type="number" value={novoItem.precoUnitario} onChange={(e) => setNovoItem({ ...novoItem, precoUnitario: Number(e.target.value) })} className={`${inputClass} col-span-2`} placeholder="Preço unit." step="0.01" min="0" />
              <button onClick={addItem} className="col-span-2 inline-flex items-center justify-center gap-1 rounded-lg bg-cyan-500 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-600 transition-colors">
                <Plus className="h-4 w-4" /> Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <select onChange={(e) => { if (e.target.value) addProdutoQuick(e.target.value); e.target.value = ''; }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-slate-50" defaultValue="">
                <option value="">+ Produto rápido...</option>
                {data.produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} ({formatBRL(p.precoVenda)})</option>)}
              </select>
              <select onChange={(e) => { if (e.target.value) addServicoQuick(e.target.value); e.target.value = ''; }} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 bg-slate-50" defaultValue="">
                <option value="">+ Serviço rápido...</option>
                {data.servicos.map((s) => <option key={s.id} value={s.id}>{s.nome} ({formatBRL(s.valor)})</option>)}
              </select>
            </div>

            {itens.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-4 text-center">Nenhum item adicionado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="py-2">Tipo</th>
                      <th className="py-2">Descrição</th>
                      <th className="py-2 text-right">Qtd</th>
                      <th className="py-2 text-right">Preço Unit.</th>
                      <th className="py-2 text-right">Subtotal</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {itens.map((i) => (
                      <tr key={i.id}>
                        <td className="py-2 text-slate-500">{i.tipo}</td>
                        <td className="py-2 font-medium text-slate-700">{i.nome}</td>
                        <td className="py-2 text-right text-slate-600">{i.quantidade}</td>
                        <td className="py-2 text-right text-slate-600">{formatBRL(i.precoUnitario)}</td>
                        <td className="py-2 text-right font-semibold text-slate-700">{formatBRL(i.quantidade * i.precoUnitario)}</td>
                        <td className="py-2 text-right">
                          <button onClick={() => removeItem(i.id)} className="p-1 rounded text-red-400 hover:bg-red-50">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">{formatBRL(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-slate-600">Desconto</span>
                  <input type="number" value={desconto} onChange={(e) => setDesconto(Math.max(0, Number(e.target.value)))} className={`${inputClass} w-28 text-right`} step="0.01" min="0" />
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-800">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>
            </div>
          </div>

          <Field label="Observações">
            <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} className={inputClass} placeholder="Observações para o cliente..." />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sticky top-4">
            <h3 className="text-base font-bold text-slate-800 mb-4">Resumo</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Itens</span>
                <span className="font-medium text-slate-700">{itens.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-medium text-slate-700">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Desconto</span>
                <span className="font-medium text-red-500">-{formatBRL(desconto)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-800">Total</span>
                <span className="text-xl font-bold text-cyan-600">{formatBRL(total)}</span>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Field label="Salvar como">
                <select value={status} onChange={(e) => setStatus(e.target.value as OrcamentoStatus)} className={inputClass}>
                  <option value="Rascunho">Rascunho</option>
                  <option value="Enviado">Enviado</option>
                </select>
              </Field>
              <button onClick={() => salvarOrcamento(status)} disabled={!clienteId || itens.length === 0} className={`${btnPrimary} w-full justify-center`}>
                <Save className="h-4 w-4" /> Salvar e Visualizar
              </button>
              <button onClick={() => salvarOrcamento('Enviado')} disabled={!clienteId || itens.length === 0} className={`${btnSecondary} w-full justify-center`}>
                Salvar como Enviado
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
