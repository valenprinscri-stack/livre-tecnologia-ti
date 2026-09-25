import { useState } from 'react';
import type { AppData, ConfigEmpresa } from '@/types';
import { Field, inputClass, btnPrimary, btnSecondary, PageHeader } from '@/components/ui';
import { Save, Check, Cpu } from 'lucide-react';

interface ConfiguracoesProps {
  data: AppData;
  update: (updater: (prev: AppData) => AppData) => void;
}

export function Configuracoes({ data, update }: ConfiguracoesProps) {
  const [form, setForm] = useState<ConfigEmpresa>(data.config);
  const [saved, setSaved] = useState(false);

  function save() {
    update((prev) => ({ ...prev, config: form }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div>
      <PageHeader title="Configurações" subtitle="Dados da empresa e informações de pagamento" />

      <div className="max-w-2xl space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400 text-slate-900">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Dados da Empresa</h3>
              <p className="text-sm text-slate-500">Estas informações aparecem na proposta impressa</p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Nome da Empresa">
              <input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} className={inputClass} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="CNPJ">
                <input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} className={inputClass} />
              </Field>
              <Field label="WhatsApp">
                <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} className={inputClass} />
              </Field>
            </div>
            <Field label="E-mail">
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Endereço">
              <input value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Chave Pix">
              <input value={form.chavePix} onChange={(e) => setForm({ ...form, chavePix: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Termos de Garantia">
              <textarea value={form.termosGarantia} onChange={(e) => setForm({ ...form, termosGarantia: e.target.value })} rows={4} className={inputClass} />
            </Field>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button onClick={save} className={btnPrimary}>
              {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Salvo!' : 'Salvar Configurações'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Sobre os dados</h3>
          <p className="text-sm text-slate-500">
            Todos os dados do sistema são salvos na nuvem (Supabase) e sincronizados em tempo real entre todos os
            usuários conectados. Você e seu marido podem acessar e editar os mesmos dados simultaneamente de qualquer
            dispositivo — basta usarem a mesma conta de e-mail e senha.
          </p>
        </div>
      </div>
    </div>
  );
}
