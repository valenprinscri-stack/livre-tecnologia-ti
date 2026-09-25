import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/supabaseClient';

export type UserRole = 'admin' | 'cliente' | null;

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  role: UserRole;
  clienteId: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);

  // Deny-by-default: fetch role via SECURITY DEFINER RPC.
  // If no user_roles row exists, default to 'cliente' (least privilege),
  // NOT 'admin'. Only an explicit 'admin' row grants admin access.
  async function fetchRole(userId: string) {
    const { data: roleData } = await supabase.rpc('get_user_role').maybeSingle();
    const { data: clienteData } = await supabase.rpc('get_user_cliente_id').maybeSingle();

    const fetchedRole = (roleData as unknown as string) || 'cliente';
    setRole(fetchedRole as UserRole);
    setClienteId((clienteData as unknown as string) || null);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchRole(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setRole(null);
      setClienteId(null);
      if (newSession?.user) {
        (async () => {
          await fetchRole(newSession.user.id);
        })();
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Set loading=false once role is determined (or no session)
  useEffect(() => {
    if (session && role !== null) {
      setLoading(false);
    }
  }, [session, role]);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setRole(null);
    setClienteId(null);
  }

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    loading,
    role,
    clienteId,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
