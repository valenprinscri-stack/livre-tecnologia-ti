/*
# Livre Tecnologia TI — Full schema with multi-user shared access

## Overview
Creates all tables for the IT management system: clientes, chamados (with notas),
contratos, contas (receber/pagar), orcamentos (with itens), produtos, servicos,
and a single-row config table. All tables are shared among authenticated users
(both the owner and her husband see the same data).

## Tables
1. `clientes` — PJ/PF customer registry (name, CNPJ/CPF, phone, WhatsApp, email, address)
2. `chamados` — Helpdesk tickets with status, priority, category, technician, notes (JSONB array)
3. `contratos` — Monthly support contracts with value, due day, scope, franchise, status
4. `contas` — Financial entries (receivable/payable) with status, origin, linked cliente/orcamento/contrato
5. `orcamentos` — Quotes with items (JSONB array), discount, payment terms, status
6. `produtos` — Product catalog with cost, sale price, stock
7. `servicos` — Service catalog with reference price
8. `config` — Single-row company configuration (name, CNPJ, Pix key, warranty terms)

## Security
- RLS enabled on ALL tables.
- All policies scoped to `authenticated` role (requires sign-in).
- Since data is shared between two users (not isolated per user), policies use `USING (true)` / `WITH CHECK (true)` for authenticated users only — any signed-in user can read/write all data. This is intentional: the app is a shared workspace for a small team.
- No `user_id` columns — data is communal, not per-user.

## Notes
- `chamados.notas` and `orcamentos.itens` stored as JSONB arrays to preserve the existing nested structure.
- `config` table uses a fixed id = 1 row to act as a singleton.
- Foreign keys use ON DELETE SET NULL for optional references (clienteId, contratoId, orcamentoId) to avoid cascading data loss.
- Sample data is NOT included in this migration — it will be inserted via execute_sql separately.
*/

-- ============ CLIENTES ============
CREATE TABLE IF NOT EXISTS clientes (
  id text PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'PJ',
  nome text NOT NULL,
  documento text DEFAULT '',
  telefone text DEFAULT '',
  whatsapp text DEFAULT '',
  email text DEFAULT '',
  endereco text DEFAULT '',
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_clientes" ON clientes;
CREATE POLICY "auth_select_clientes" ON clientes FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_clientes" ON clientes;
CREATE POLICY "auth_insert_clientes" ON clientes FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_clientes" ON clientes;
CREATE POLICY "auth_update_clientes" ON clientes FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_clientes" ON clientes;
CREATE POLICY "auth_delete_clientes" ON clientes FOR DELETE
  TO authenticated USING (true);

-- ============ CHAMADOS ============
CREATE TABLE IF NOT EXISTS chamados (
  id text PRIMARY KEY,
  cliente_id text REFERENCES clientes(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'Redes',
  prioridade text NOT NULL DEFAULT 'Média',
  status text NOT NULL DEFAULT 'Aberto',
  descricao text DEFAULT '',
  tecnico text DEFAULT '',
  data_abertura date NOT NULL,
  notas jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_chamados" ON chamados;
CREATE POLICY "auth_select_chamados" ON chamados FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_chamados" ON chamados;
CREATE POLICY "auth_insert_chamados" ON chamados FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_chamados" ON chamados;
CREATE POLICY "auth_update_chamados" ON chamados FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_chamados" ON chamados;
CREATE POLICY "auth_delete_chamados" ON chamados FOR DELETE
  TO authenticated USING (true);

-- ============ CONTRATOS ============
CREATE TABLE IF NOT EXISTS contratos (
  id text PRIMARY KEY,
  cliente_id text REFERENCES clientes(id) ON DELETE SET NULL,
  valor_mensal numeric NOT NULL DEFAULT 0,
  dia_vencimento integer NOT NULL DEFAULT 10,
  data_inicio date NOT NULL,
  data_termino date,
  escopo text DEFAULT '',
  chamados_franquia integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Ativo',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contratos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_contratos" ON contratos;
CREATE POLICY "auth_select_contratos" ON contratos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_contratos" ON contratos;
CREATE POLICY "auth_insert_contratos" ON contratos FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_contratos" ON contratos;
CREATE POLICY "auth_update_contratos" ON contratos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_contratos" ON contratos;
CREATE POLICY "auth_delete_contratos" ON contratos FOR DELETE
  TO authenticated USING (true);

-- ============ CONTAS ============
CREATE TABLE IF NOT EXISTS contas (
  id text PRIMARY KEY,
  tipo text NOT NULL DEFAULT 'Pagar',
  descricao text NOT NULL,
  cliente_id text REFERENCES clientes(id) ON DELETE SET NULL,
  fornecedor text DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  categoria text DEFAULT '',
  status text NOT NULL DEFAULT 'Pendente',
  origem text DEFAULT 'manual',
  orcamento_id text,
  contrato_id text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE contas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_contas" ON contas;
CREATE POLICY "auth_select_contas" ON contas FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_contas" ON contas;
CREATE POLICY "auth_insert_contas" ON contas FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_contas" ON contas;
CREATE POLICY "auth_update_contas" ON contas FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_contas" ON contas;
CREATE POLICY "auth_delete_contas" ON contas FOR DELETE
  TO authenticated USING (true);

-- ============ ORCAMENTOS ============
CREATE TABLE IF NOT EXISTS orcamentos (
  id text PRIMARY KEY,
  cliente_id text REFERENCES clientes(id) ON DELETE SET NULL,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  desconto numeric NOT NULL DEFAULT 0,
  prazo text DEFAULT '',
  forma_pagamento text DEFAULT '',
  status text NOT NULL DEFAULT 'Rascunho',
  data date NOT NULL,
  observacoes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_orcamentos" ON orcamentos;
CREATE POLICY "auth_select_orcamentos" ON orcamentos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_orcamentos" ON orcamentos;
CREATE POLICY "auth_insert_orcamentos" ON orcamentos FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_orcamentos" ON orcamentos;
CREATE POLICY "auth_update_orcamentos" ON orcamentos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_orcamentos" ON orcamentos;
CREATE POLICY "auth_delete_orcamentos" ON orcamentos FOR DELETE
  TO authenticated USING (true);

-- ============ PRODUTOS ============
CREATE TABLE IF NOT EXISTS produtos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  custo_compra numeric NOT NULL DEFAULT 0,
  preco_venda numeric NOT NULL DEFAULT 0,
  estoque integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_produtos" ON produtos;
CREATE POLICY "auth_select_produtos" ON produtos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_produtos" ON produtos;
CREATE POLICY "auth_insert_produtos" ON produtos FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_produtos" ON produtos;
CREATE POLICY "auth_update_produtos" ON produtos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_produtos" ON produtos;
CREATE POLICY "auth_delete_produtos" ON produtos FOR DELETE
  TO authenticated USING (true);

-- ============ SERVICOS ============
CREATE TABLE IF NOT EXISTS servicos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  descricao text DEFAULT '',
  valor numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_servicos" ON servicos;
CREATE POLICY "auth_select_servicos" ON servicos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_servicos" ON servicos;
CREATE POLICY "auth_insert_servicos" ON servicos FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_servicos" ON servicos;
CREATE POLICY "auth_update_servicos" ON servicos FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_servicos" ON servicos;
CREATE POLICY "auth_delete_servicos" ON servicos FOR DELETE
  TO authenticated USING (true);

-- ============ CONFIG (singleton) ============
CREATE TABLE IF NOT EXISTS config (
  id integer PRIMARY KEY DEFAULT 1,
  nome text NOT NULL DEFAULT 'Livre Tecnologia TI',
  cnpj text DEFAULT '',
  whatsapp text DEFAULT '',
  email text DEFAULT '',
  endereco text DEFAULT '',
  chave_pix text DEFAULT '',
  termos_garantia text DEFAULT '',
  CONSTRAINT singleton CHECK (id = 1)
);
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_config" ON config;
CREATE POLICY "auth_select_config" ON config FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_insert_config" ON config;
CREATE POLICY "auth_insert_config" ON config FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "auth_update_config" ON config;
CREATE POLICY "auth_update_config" ON config FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "auth_delete_config" ON config;
CREATE POLICY "auth_delete_config" ON config FOR DELETE
  TO authenticated USING (true);

-- Insert default config row if not exists
INSERT INTO config (id, nome, cnpj, whatsapp, email, endereco, chave_pix, termos_garantia)
VALUES (
  1,
  'Livre Tecnologia TI',
  '00.000.000/0001-00',
  '(11) 90000-0000',
  'contato@livretecnologiatI.com.br',
  'São Paulo/SP',
  'contato@livretecnologiatI.com.br',
  'Garantia de 90 dias em serviços prestados. Peças seguem garantia do fabricante. Não nos responsabilizamos por perda de dados não previamente backupada.'
) ON CONFLICT (id) DO NOTHING;
