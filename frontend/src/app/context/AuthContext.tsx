import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  totp_enabled: boolean;
  role?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// ─── Color por inicial ────────────────────────────────────────────────────────
// Paleta coherente con el branding de Lookaly
const AVATAR_COLORS = [
  '#7D3150', // rose profundo (primario)
  '#9E4466', // rosa medio
  '#5C2238', // vino oscuro
  '#8B6914', // dorado oscuro
  '#4A7C59', // verde salvia
  '#4A6FA5', // azul empolvado
  '#6B3FA0', // malva
  '#A0522D', // sienna
];

export function avatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function avatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null);

const SS_TOKEN = 'lookaly_token';
const SS_USER  = 'lookaly_user';

// ─── Provider ────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,  setUser]  = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaurar sesión desde sessionStorage (se borra al cerrar la pestaña)
  useEffect(() => {
    try {
      const savedToken = sessionStorage.getItem(SS_TOKEN);
      const savedUser  = sessionStorage.getItem(SS_USER);
      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch {
      sessionStorage.removeItem(SS_TOKEN);
      sessionStorage.removeItem(SS_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (t: string, u: AuthUser) => {
    sessionStorage.setItem(SS_TOKEN, t);
    sessionStorage.setItem(SS_USER, JSON.stringify(u));
    setToken(t);
    setUser(u);
  };

  const clearSession = () => {
    // Limpiar sesión y todo el almacenamiento local
    sessionStorage.clear();
    localStorage.clear();
    setToken(null);
    setUser(null);
  };

  // ── Login ─────────────────────────────────────────────────────────────────
  // FastAPI OAuth2PasswordRequestForm espera form-urlencoded con 'username' y 'password'
  const login = useCallback(async (email: string, password: string) => {
    const body = new URLSearchParams({ username: email, password });
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail ?? 'Error al iniciar sesión');

    // Obtener datos del usuario con el token recién emitido
    const meRes = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const me = await meRes.json();
    if (!meRes.ok) throw new Error('No se pudo obtener el perfil');

    saveSession(data.access_token, {
      id:           String(me.id),
      name:         me.name,
      email:        me.email,
      is_admin:     me.is_admin ?? false,
      totp_enabled: me.totp_enabled ?? false,
      role:         me.role ?? null,
    });
  }, []);

  // ── Register ──────────────────────────────────────────────────────────────
  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      // Pydantic puede devolver lista de errores o un string
      const msg = Array.isArray(data.detail)
        ? data.detail.map((e: { msg: string }) => e.msg).join('. ')
        : (data.detail ?? 'Error al registrarse');
      throw new Error(msg);
    }
    // Después del registro, hacer login automático
    await login(email, password);
  }, [login]);

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch { /* ignorar errores de red en logout */ }
    }
    clearSession();
    // Limpiar caché del navegador y recargar la página
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
    window.location.replace('/login');
  }, [token]);

  // ── Refresh user ──────────────────────────────────────────────────────────
  const refreshUser = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const me = await res.json();
      const updated: AuthUser = {
        id:           String(me.id),
        name:         me.name,
        email:        me.email,
        is_admin:     me.is_admin ?? false,
        totp_enabled: me.totp_enabled ?? false,
        role:         me.role ?? null,
      };
      sessionStorage.setItem(SS_USER, JSON.stringify(updated));
      setUser(updated);
    } catch { /* ignorar */ }
  }, [token]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
