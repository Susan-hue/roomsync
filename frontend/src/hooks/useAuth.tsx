import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, authStore, type User, type Role } from "@/services/api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { email: string; full_name: string; role: Role; student_id?: string; password: string }) => Promise<User>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authStore.user);
  const [loading, setLoading] = useState(false);

  useEffect(() => authStore.subscribe(() => setUser(authStore.user)), []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const tokens = await api.login(email, password);
      authStore.set(tokens, authStore.user);
      const me = await api.me();
      authStore.set(tokens, me);
      return me;
    } finally { setLoading(false); }
  };

  const register = async (data: any) => {
    setLoading(true);
    try {
      const tokens = await api.register(data);
      authStore.set(tokens, authStore.user);
      const me = await api.me();
      authStore.set(tokens, me);
      return me;
    } finally { setLoading(false); }
  };

  const logout = async () => {
    try { await api.logout(); } catch {}
    authStore.set(null, null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}
