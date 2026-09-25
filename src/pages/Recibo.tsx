import type { AppData, Orcamento } from '@/types';
import { formatBRL, formatDate } from '@/store';
import { Cpu, Printer, ArrowLeft } from 'lucide-react';
import { btnSecondary, btnPrimary } from '@/components/ui';
import type { PageKey } from '@/components/Layout';

interface ReciboProps {
  data: AppData;
  orcamentoId: string | null;
  onNavigate: (page: PageKey) => void;
  onClose: () => void;
}

export function Recibo({ data, orcamentoId, onNavigate, onClose }: ReciboProps) {
  const orc = data.orcamentos.find((o) => o.id === orcamentoId);
  if (!orc) return null;

  const cliente = data.clientes.find((c) => c.id === orc.clienteId);
  const subtotal = orc.itens.reduce((s, i) => s + i.quantidade * i.precoUnitario, 0);
  const total = subtotal - orc.desconto;
  const config = data.config;

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <button onClick={onClose} className={btnSecondary}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <button onClick={handlePrint} className={btnPrimary}>
          <Printer className="h-4 w-4" /> Imprimir / PDF
        </button>
      </div>

      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none print:max-w-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-cyan-500 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-cyan-400 text-slate-900">
              <Cpu className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{config.nome}</h1>
              <p className="text-sm text-slate-500">CNPJ: {config.cnpj}</p>
              <p className="text-sm text-slate-500">{config.endereco}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-800">PROPOSTA</h2>
            <p className="text-sm text-slate-500">Nº {orc.id.slice(-6).toUpperCase()}</p>
            <p className="text-sm text-slate-500">{formatDate(orc.data)}</p>
          </div>
        </div>

        {/* Cliente */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Cliente</p>
            <p className="font-bold text-slate-800">{cliente?.nome || 'Cliente'}</p>
            <p className="text-sm text-slate-600">{cliente?.documento}</p>
            <p className="text-sm text-slate-600">{cliente?.endereco}</p>
            <p className="text-sm text-slate-600">{cliente?.whatsapp}</p>
            <p className="text-sm text-slate-600">{cliente?.email}</p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Condições</p>
            <p className="text-sm text-slate-600"><span className="font-medium">Prazo:</span> {orc.prazo || 'A combinar'}</p>
            <p className="text-sm text-slate-600"><span className="font-medium">Pagamento:</span> {orc.formaPagamento || 'A combinar'}</p>
            <p className="text-sm text-slate-600"><span className="font-medium">Status:</span> {orc.status}</p>
          </div>
        </div>

        {/* Itens */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-2.5">Tipo</th>
                <th className="px-3 py-2.5">Descrição</th>
                <th className="px-3 py-2.5 text-right">Qtd</th>
                <th className="px-3 py-2.5 text-right">Preço Unit.</th>
                <th className="px-3 py-2.5 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orc.itens.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2.5 text-slate-500">{i.tipo}</td>
                  <td className="px-3 py-2.5 font-medium text-slate-700">{i.nome}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{i.quantidade}</td>
                  <td className="px-3 py-2.5 text-right text-slate-600">{formatBRL(i.precoUnitario)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-slate-700">{formatBRL(i.quantidade * i.precoUnitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totais */}
        <div className="mt-4 flex justify-end">
          <div className="w-full max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-medium">{formatBRL(subtotal)}</span>
            </div>
            {orc.desconto > 0 && (
              <div className="flex justify-between text-sm text-slate-600">
                <span>Desconto</span>
                <span className="font-medium text-red-500">-{formatBRL(orc.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 border-slate-200 pt-2 text-lg font-bold text-slate-800">
              <span>Total</span>
              <span className="text-cyan-600">{formatBRL(total)}</span>
            </div>
          </div>
        </div>

        {/* Observações */}
        {orc.observacoes && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Observações</p>
            <p className="text-sm text-slate-600">{orc.observacoes}</p>
          </div>
        )}

        {/* Pagamento */}
        <div className="mt-6 rounded-lg border border-slate-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Dados para Pagamento</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-600">
            <p><span className="font-medium">WhatsApp:</span> {config.whatsapp}</p>
            <p><span className="font-medium">Chave Pix:</span> {config.chavePix}</p>
          </div>
        </div>

        {/* Garantia */}
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Termos de Garantia</p>
          <p className="text-sm text-slate-600">{config.termosGarantia}</p>
        </div>

        {/* Assinaturas */}
        <div className="mt-12 grid grid-cols-2 gap-8">
          <div>
            <div className="border-t border-slate-300 pt-1">
              <p className="text-xs text-slate-500 text-center">{config.nome}</p>
            </div>
          </div>
          <div>
            <div className="border-t border-slate-300 pt-1">
              <p className="text-xs text-slate-500 text-center">{cliente?.nome || 'Cliente'}</p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          Documento gerado em {formatDate(new Date().toISOString().split('T')[0])} · {config.nome}
        </p>
      </div>
    </div>
  );
}
