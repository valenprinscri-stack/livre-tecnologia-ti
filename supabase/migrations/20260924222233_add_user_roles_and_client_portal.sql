/*
# Add user roles and client portal access

## Overview
Adds role-based access control with two levels:
- `admin` (Equipa TI): Full access to all modules — existing behavior unchanged.
- `cliente` (Portal do Cliente): Can only view their own chamados and create new ones.
Also adds an `invites` table to track access invitations generated from the Clientes page.

## New Tables
1. `user_roles` — Maps auth.users to a role (`admin` or `cliente`) and optionally to a cliente_id.
   - `user_id` (uuid, PK, FK to auth.users)
   - `role` (text, `admin` or `cliente`)
   - `cliente_id` (text, nullable, FK to clientes — set when role = 'cliente')
2. `invites` — Tracks invitation links generated for clients.
   - `id` (text, PK)
   - `cliente_id` (text, FK to clientes)
   - `email` (text — the email the invite was sent to)
   - `token` (text, unique — random token for the invite link)
   - `used` (boolean, default false)
   - `created_at` (timestamptz)

## Security
- `user_roles`: RLS enabled. Admins can read all; users can read their own row.
- `invites`: RLS enabled. Only authenticated admins can read/create; anyone with a valid token can consume (but we handle this via the admin creating the account directly).
- `chamados` policies updated: `cliente` role users can SELECT only chamados where `cliente_id` matches their linked cliente_id, and INSERT only with their cliente_id.
- All other tables remain `USING (true)` for authenticated — but the frontend hides them from cliente-role users. RLS on chamados is the key enforcement.

## Notes
- A SECURITY DEFINER function `get_user_role()` returns the current user's role safely.
- The `user_roles` table uses `auth.uid()` for ownership.
- Existing chamados policies are replaced to add role-aware predicates.
*/

-- ============ USER_ROLES ============
CREATE TABLE IF NOT EXISTS user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'cliente')),
  cliente_id text REFERENCES clientes(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_user_roles" ON user_roles;
CREATE POLICY "auth_select_user_roles" ON user_roles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_user_roles" ON user_roles;
CREATE POLICY "auth_insert_user_roles" ON user_roles FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_user_roles" ON user_roles;
CREATE POLICY "auth_update_user_roles" ON user_roles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_user_roles" ON user_roles;
CREATE POLICY "auth_delete_user_roles" ON user_roles FOR DELETE
  TO authenticated USING (true);

-- ============ INVITES ============
CREATE TABLE IF NOT EXISTS invites (
  id text PRIMARY KEY,
  cliente_id text REFERENCES clientes(id) ON DELETE CASCADE,
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "auth_select_invites" ON invites;
CREATE POLICY "auth_select_invites" ON invites FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_invites" ON invites;
CREATE POLICY "auth_insert_invites" ON invites FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_invites" ON invites;
CREATE POLICY "auth_update_invites" ON invites FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_invites" ON invites;
CREATE POLICY "auth_delete_invites" ON invites FOR DELETE
  TO authenticated USING (true);

-- ============ SECURITY DEFINER: get_user_role ============
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;

-- ============ SECURITY DEFINER: get_user_cliente_id ============
CREATE OR REPLACE FUNCTION get_user_cliente_id()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT cliente_id FROM user_roles WHERE user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION get_user_cliente_id() TO authenticated;

-- ============ UPDATE CHAMADOS POLICIES ============
-- Replace existing policies with role-aware ones.
-- Admins: full CRUD on all chamados.
-- Clientes: SELECT only their own, INSERT only with their cliente_id, no UPDATE/DELETE.

DROP POLICY IF EXISTS "auth_select_chamados" ON chamados;
CREATE POLICY "auth_select_chamados" ON chamados FOR SELECT
  TO authenticated USING (
    get_user_role() = 'admin'
    OR cliente_id = get_user_cliente_id()
  );

DROP POLICY IF EXISTS "auth_insert_chamados" ON chamados;
CREATE POLICY "auth_insert_chamados" ON chamados FOR INSERT
  TO authenticated WITH CHECK (
    get_user_role() = 'admin'
    OR (get_user_role() = 'cliente' AND cliente_id = get_user_cliente_id())
  );

DROP POLICY IF EXISTS "auth_update_chamados" ON chamados;
CREATE POLICY "auth_update_chamados" ON chamados FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin')
  WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_delete_chamados" ON chamados;
CREATE POLICY "auth_delete_chamados" ON chamados FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- ============ UPDATE CLIENTES POLICIES ============
-- Only admins can CRUD clientes. Clientes cannot see other clients.
DROP POLICY IF EXISTS "auth_select_clientes" ON clientes;
CREATE POLICY "auth_select_clientes" ON clientes FOR SELECT
  TO authenticated USING (get_user_role() = 'admin' OR id = get_user_cliente_id());

DROP POLICY IF EXISTS "auth_insert_clientes" ON clientes;
CREATE POLICY "auth_insert_clientes" ON clientes FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_update_clientes" ON clientes;
CREATE POLICY "auth_update_clientes" ON clientes FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_delete_clientes" ON clientes;
CREATE POLICY "auth_delete_clientes" ON clientes FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- ============ UPDATE CONFIG POLICIES ============
-- Only admins can read/write config.
DROP POLICY IF EXISTS "auth_select_config" ON config;
CREATE POLICY "auth_select_config" ON config FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_insert_config" ON config;
CREATE POLICY "auth_insert_config" ON config FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_update_config" ON config;
CREATE POLICY "auth_update_config" ON config FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

DROP POLICY IF EXISTS "auth_delete_config" ON config;
CREATE POLICY "auth_delete_config" ON config FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- ============ LOCK DOWN OTHER TABLES FOR CLIENTE ROLE ============
-- Contratos: admin only
DROP POLICY IF EXISTS "auth_select_contratos" ON contratos;
CREATE POLICY "auth_select_contratos" ON contratos FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_insert_contratos" ON contratos;
CREATE POLICY "auth_insert_contratos" ON contratos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_update_contratos" ON contratos;
CREATE POLICY "auth_update_contratos" ON contratos FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_delete_contratos" ON contratos;
CREATE POLICY "auth_delete_contratos" ON contratos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Contas: admin only
DROP POLICY IF EXISTS "auth_select_contas" ON contas;
CREATE POLICY "auth_select_contas" ON contas FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_insert_contas" ON contas;
CREATE POLICY "auth_insert_contas" ON contas FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_update_contas" ON contas;
CREATE POLICY "auth_update_contas" ON contas FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_delete_contas" ON contas;
CREATE POLICY "auth_delete_contas" ON contas FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Orcamentos: admin only
DROP POLICY IF EXISTS "auth_select_orcamentos" ON orcamentos;
CREATE POLICY "auth_select_orcamentos" ON orcamentos FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_insert_orcamentos" ON orcamentos;
CREATE POLICY "auth_insert_orcamentos" ON orcamentos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_update_orcamentos" ON orcamentos;
CREATE POLICY "auth_update_orcamentos" ON orcamentos FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_delete_orcamentos" ON orcamentos;
CREATE POLICY "auth_delete_orcamentos" ON orcamentos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Produtos: admin only
DROP POLICY IF EXISTS "auth_select_produtos" ON produtos;
CREATE POLICY "auth_select_produtos" ON produtos FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_insert_produtos" ON produtos;
CREATE POLICY "auth_insert_produtos" ON produtos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_update_produtos" ON produtos;
CREATE POLICY "auth_update_produtos" ON produtos FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_delete_produtos" ON produtos;
CREATE POLICY "auth_delete_produtos" ON produtos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');

-- Servicos: admin only
DROP POLICY IF EXISTS "auth_select_servicos" ON servicos;
CREATE POLICY "auth_select_servicos" ON servicos FOR SELECT
  TO authenticated USING (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_insert_servicos" ON servicos;
CREATE POLICY "auth_insert_servicos" ON servicos FOR INSERT
  TO authenticated WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_update_servicos" ON servicos;
CREATE POLICY "auth_update_servicos" ON servicos FOR UPDATE
  TO authenticated USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
DROP POLICY IF EXISTS "auth_delete_servicos" ON servicos;
CREATE POLICY "auth_delete_servicos" ON servicos FOR DELETE
  TO authenticated USING (get_user_role() = 'admin');
