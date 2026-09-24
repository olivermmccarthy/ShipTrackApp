import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

type Staff = { id: string; email: string };

type AuthContextValue = {
  staff: Staff | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/staff/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setStaff(data))
      .catch(() => setStaff(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      return { ok: false, message: 'Invalid email or password.' };
    }
    const data = await res.json();
    setStaff(data);
    return { ok: true };
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    setStaff(null);
  }

  return (
    <AuthContext.Provider value={{ staff, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
