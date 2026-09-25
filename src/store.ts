import { useEffect, useState, useCallback, useRef } from 'react';
import type { AppData, Cliente, Chamado, Contrato, Conta, Orcamento, Produto, Servico, ConfigEmpresa, NotaAtendimento, OrcamentoItem } from '@/types';
import { supabase } from '@/supabaseClient';

// ---------- helpers ----------

export function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso: string): string {
  if (!iso) return '-';
  const [y, m, d] = iso.split('T')[0].split('-');
  return `${d}/${m}/${y}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

// ---------- DB row -> app object mappers ----------

function rowToCliente(r: Record<string, unknown>): Cliente {
  return {
    id: r.id as string,
    tipo: r.tipo as 'PJ' | 'PF',
    nome: r.nome as string,
    documento: r.documento as string,
    telefone: r.telefone as string,
    whatsapp: r.whatsapp as string,
    email: r.email as string,
    endereco: r.endereco as string,
    observacoes: r.observacoes as string,
  };
}

function rowToChamado(r: Record<string, unknown>): Chamado {
  return {
    id: r.id as string,
    clienteId: (r.cliente_id as string) || '',
    titulo: r.titulo as string,
    categoria: r.categoria as Chamado['categoria'],
    prioridade: r.prioridade as Chamado['prioridade'],
    status: r.status as Chamado['status'],
    descricao: r.descricao as string,
    tecnico: r.tecnico as string,
    dataAbertura: r.data_abertura as string,
    notas: (r.notas as NotaAtendimento[]) || [],
  };
}

function rowToContrato(r: Record<string, unknown>): Contrato {
  return {
    id: r.id as string,
    clienteId: (r.cliente_id as string) || '',
    valorMensal: Number(r.valor_mensal) || 0,
    diaVencimento: Number(r.dia_vencimento) || 10,
    dataInicio: r.data_inicio as string,
    dataTermino: r.data_termino as string || '',
    escopo: r.escopo as string,
    chamadosFranquia: Number(r.chamados_franquia) || 0,
    status: r.status as Contrato['status'],
  };
}

function rowToConta(r: Record<string, unknown>): Conta {
  return {
    id: r.id as string,
    tipo: r.tipo as 'Receber' | 'Pagar',
    descricao: r.descricao as string,
    clienteId: (r.cliente_id as string) || undefined,
    fornecedor: r.fornecedor as string,
    valor: Number(r.valor) || 0,
    vencimento: r.vencimento as string,
    categoria: r.categoria as string,
    status: r.status as Conta['status'],
    origem: (r.origem as Conta['origem']) || 'manual',
    orcamentoId: (r.orcamento_id as string) || undefined,
    contratoId: (r.contrato_id as string) || undefined,
  };
}

function rowToOrcamento(r: Record<string, unknown>): Orcamento {
  return {
    id: r.id as string,
    clienteId: (r.cliente_id as string) || '',
    itens: (r.itens as OrcamentoItem[]) || [],
    desconto: Number(r.desconto) || 0,
    prazo: r.prazo as string,
    formaPagamento: r.forma_pagamento as string,
    status: r.status as Orcamento['status'],
    data: r.data as string,
    observacoes: r.observacoes as string,
  };
}

function rowToProduto(r: Record<string, unknown>): Produto {
  return {
    id: r.id as string,
    nome: r.nome as string,
    custoCompra: Number(r.custo_compra) || 0,
    precoVenda: Number(r.preco_venda) || 0,
    estoque: Number(r.estoque) || 0,
  };
}

function rowToServico(r: Record<string, unknown>): Servico {
  return {
    id: r.id as string,
    nome: r.nome as string,
    descricao: r.descricao as string,
    valor: Number(r.valor) || 0,
  };
}

function rowToConfig(r: Record<string, unknown>): ConfigEmpresa {
  return {
    nome: r.nome as string,
    cnpj: r.cnpj as string,
    whatsapp: r.whatsapp as string,
    email: r.email as string,
    endereco: r.endereco as string,
    chavePix: r.chave_pix as string,
    termosGarantia: r.termos_garantia as string,
  };
}

// ---------- app object -> DB row mappers ----------

function clienteToRow(c: Cliente) {
  return { id: c.id, tipo: c.tipo, nome: c.nome, documento: c.documento, telefone: c.telefone, whatsapp: c.whatsapp, email: c.email, endereco: c.endereco, observacoes: c.observacoes };
}

function chamadoToRow(c: Chamado) {
  return { id: c.id, cliente_id: c.clienteId || null, titulo: c.titulo, categoria: c.categoria, prioridade: c.prioridade, status: c.status, descricao: c.descricao, tecnico: c.tecnico, data_abertura: c.dataAbertura, notas: c.notas };
}

function contratoToRow(c: Contrato) {
  return { id: c.id, cliente_id: c.clienteId || null, valor_mensal: c.valorMensal, dia_vencimento: c.diaVencimento, data_inicio: c.dataInicio, data_termino: c.dataTermino || null, escopo: c.escopo, chamados_franquia: c.chamadosFranquia, status: c.status };
}

function contaToRow(c: Conta) {
  return { id: c.id, tipo: c.tipo, descricao: c.descricao, cliente_id: c.clienteId || null, fornecedor: c.fornecedor, valor: c.valor, vencimento: c.vencimento, categoria: c.categoria, status: c.status, origem: c.origem || 'manual', orcamento_id: c.orcamentoId || null, contrato_id: c.contratoId || null };
}

function orcamentoToRow(o: Orcamento) {
  return { id: o.id, cliente_id: o.clienteId || null, itens: o.itens, desconto: o.desconto, prazo: o.prazo, forma_pagamento: o.formaPagamento, status: o.status, data: o.data, observacoes: o.observacoes };
}

function produtoToRow(p: Produto) {
  return { id: p.id, nome: p.nome, custo_compra: p.custoCompra, preco_venda: p.precoVenda, estoque: p.estoque };
}

function servicoToRow(s: Servico) {
  return { id: s.id, nome: s.nome, descricao: s.descricao, valor: s.valor };
}

function configToRow(c: ConfigEmpresa) {
  return { id: 1, nome: c.nome, cnpj: c.cnpj, whatsapp: c.whatsapp, email: c.email, endereco: c.endereco, chave_pix: c.chavePix, termos_garantia: c.termosGarantia };
}

// ---------- empty data ----------

const emptyData: AppData = {
  clientes: [], chamados: [], contratos: [], contas: [], orcamentos: [], produtos: [], servicos: [],
  config: { nome: 'Livre Tecnologia TI', cnpj: '', whatsapp: '', email: '', endereco: '', chavePix: '', termosGarantia: '' },
};

// ---------- the hook ----------

export function useAppData() {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const skipSync = useRef(false);

  // Load all data from Supabase
  const reload = useCallback(async () => {
    const [cl, ch, ct, co, orc, pr, sv, cfg] = await Promise.all([
      supabase.from('clientes').select('*').then(r => r.data || []),
      supabase.from('chamados').select('*').then(r => r.data || []),
      supabase.from('contratos').select('*').then(r => r.data || []),
      supabase.from('contas').select('*').then(r => r.data || []),
      supabase.from('orcamentos').select('*').then(r => r.data || []),
      supabase.from('produtos').select('*').then(r => r.data || []),
      supabase.from('servicos').select('*').then(r => r.data || []),
      supabase.from('config').select('*').limit(1).maybeSingle(),
    ]);

    setData({
      clientes: (cl as Record<string, unknown>[]).map(rowToCliente),
      chamados: (ch as Record<string, unknown>[]).map(rowToChamado),
      contratos: (ct as Record<string, unknown>[]).map(rowToContrato),
      contas: (co as Record<string, unknown>[]).map(rowToConta),
      orcamentos: (orc as Record<string, unknown>[]).map(rowToOrcamento),
      produtos: (pr as Record<string, unknown>[]).map(rowToProduto),
      servicos: (sv as Record<string, unknown>[]).map(rowToServico),
      config: cfg ? rowToConfig(cfg as unknown as Record<string, unknown>) : emptyData.config,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();

    // Realtime subscriptions — reload on any change from another user
    const channel = supabase
      .channel('livre-ti-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chamados' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contratos' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contas' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produtos' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, () => { skipSync.current = true; reload(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'config' }, () => { skipSync.current = true; reload(); })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [reload]);

  // Diff old vs new data and write changes to Supabase
  const syncToDb = useCallback(async (prev: AppData, next: AppData) => {
    // For each table, compare prev vs next and upsert/delete
    // Clientes
    for (const c of next.clientes) {
      const old = prev.clientes.find((x) => x.id === c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        await supabase.from('clientes').upsert(clienteToRow(c)).eq('id', c.id);
      }
    }
    for (const c of prev.clientes) {
      if (!next.clientes.find((x) => x.id === c.id)) {
        await supabase.from('clientes').delete().eq('id', c.id);
      }
    }
    // Chamados
    for (const c of next.chamados) {
      const old = prev.chamados.find((x) => x.id === c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        await supabase.from('chamados').upsert(chamadoToRow(c)).eq('id', c.id);
      }
    }
    for (const c of prev.chamados) {
      if (!next.chamados.find((x) => x.id === c.id)) {
        await supabase.from('chamados').delete().eq('id', c.id);
      }
    }
    // Contratos
    for (const c of next.contratos) {
      const old = prev.contratos.find((x) => x.id === c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        await supabase.from('contratos').upsert(contratoToRow(c)).eq('id', c.id);
      }
    }
    for (const c of prev.contratos) {
      if (!next.contratos.find((x) => x.id === c.id)) {
        await supabase.from('contratos').delete().eq('id', c.id);
      }
    }
    // Contas
    for (const c of next.contas) {
      const old = prev.contas.find((x) => x.id === c.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(c)) {
        await supabase.from('contas').upsert(contaToRow(c)).eq('id', c.id);
      }
    }
    for (const c of prev.contas) {
      if (!next.contas.find((x) => x.id === c.id)) {
        await supabase.from('contas').delete().eq('id', c.id);
      }
    }
    // Orcamentos
    for (const o of next.orcamentos) {
      const old = prev.orcamentos.find((x) => x.id === o.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(o)) {
        await supabase.from('orcamentos').upsert(orcamentoToRow(o)).eq('id', o.id);
      }
    }
    for (const o of prev.orcamentos) {
      if (!next.orcamentos.find((x) => x.id === o.id)) {
        await supabase.from('orcamentos').delete().eq('id', o.id);
      }
    }
    // Produtos
    for (const p of next.produtos) {
      const old = prev.produtos.find((x) => x.id === p.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(p)) {
        await supabase.from('produtos').upsert(produtoToRow(p)).eq('id', p.id);
      }
    }
    for (const p of prev.produtos) {
      if (!next.produtos.find((x) => x.id === p.id)) {
        await supabase.from('produtos').delete().eq('id', p.id);
      }
    }
    // Servicos
    for (const s of next.servicos) {
      const old = prev.servicos.find((x) => x.id === s.id);
      if (!old || JSON.stringify(old) !== JSON.stringify(s)) {
        await supabase.from('servicos').upsert(servicoToRow(s)).eq('id', s.id);
      }
    }
    for (const s of prev.servicos) {
      if (!next.servicos.find((x) => x.id === s.id)) {
        await supabase.from('servicos').delete().eq('id', s.id);
      }
    }
    // Config
    if (JSON.stringify(prev.config) !== JSON.stringify(next.config)) {
      await supabase.from('config').upsert(configToRow(next.config)).eq('id', 1);
    }
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => {
      const next = updater(prev);
      // Fire-and-forget sync to DB
      syncToDb(prev, next);
      return next;
    });
  }, [syncToDb]);

  return { data, update, loading, reload };
}
