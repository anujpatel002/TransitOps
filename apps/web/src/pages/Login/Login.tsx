import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';

const ROLE_HINTS = [
  { role: 'Fleet Manager',     dest: 'Fleet, Maintenance' },
  { role: 'Dispatcher',        dest: 'Dashboard, Trips' },
  { role: 'Safety Officer',    dest: 'Drivers, Compliance' },
  { role: 'Financial Analyst', dest: 'Fuel & Expenses, Analytics' },
];

const MAX_ATTEMPTS = 5;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('anuj.d@transitops.io');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [locked, setLocked]     = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [remember, setRemember] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    setError('');
    try {
      const { data } = await http.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? 'Invalid credentials';
      const isLocked = msg.includes('locked');
      if (isLocked) {
        setLocked(true);
        setError('Account locked after 5 failed attempts');
      } else {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= MAX_ATTEMPTS) {
          setLocked(true);
          setError('Account locked after 5 failed attempts');
        } else {
          setError(`Invalid credentials (${next}/${MAX_ATTEMPTS} attempts)`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT — cream panel */}
      <div className="hidden lg:flex w-[420px] shrink-0 flex-col justify-between p-10" style={{ backgroundColor: '#F5F1EA' }}>
        <div>
          <div className="flex items-center gap-2 mb-10">
            <span className="w-8 h-8 rounded bg-accent flex items-center justify-center font-bold text-white text-sm">T</span>
            <span className="font-bold text-lg text-gray-900 tracking-wide">TransitOps</span>
          </div>
          <p className="text-gray-500 text-sm uppercase tracking-widest mb-2">Platform</p>
          <h2 className="text-gray-900 text-2xl font-bold leading-snug mb-6">
            Smart Transport<br />Operations Platform
          </h2>
          <p className="text-gray-600 text-sm mb-4">One login, four roles:</p>
          <ul className="space-y-2">
            {ROLE_HINTS.map(({ role }) => (
              <li key={role} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                {role}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-gray-400 text-xs tracking-widest">TRANSITOPS © 2026 · RBAC BASE</p>
      </div>

      {/* RIGHT — dark panel */}
      <div className="flex-1 bg-bg flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-text-primary text-2xl font-bold mb-1">Sign in to your account</h1>
          <p className="text-text-muted text-sm mb-8">Enter your credentials to continue</p>

          {/* Error alert */}
          {error && (
            <div className={`mb-4 px-4 py-3 rounded border text-sm ${
              locked
                ? 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
            }`}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Email</label>
              <input
                type="email"
                placeholder="rohan.k@transitops.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={locked}
                className="bg-panel border border-border rounded px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-text-muted text-xs uppercase tracking-wider">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={locked}
                className="bg-panel border border-border rounded px-3 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent disabled:opacity-50"
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="accent-amber-500"
                />
                Remember me
              </label>
              <button type="button" className="text-sm text-accent hover:text-accent-hover transition-colors">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={locked}
              className="bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded py-2.5 font-semibold transition-colors mt-1"
            >
              Sign In
            </button>
          </form>

          {/* Role → destination hints */}
          <div className="mt-6 border-t border-border pt-4 space-y-1">
            {ROLE_HINTS.map(({ role, dest }) => (
              <p key={role} className="text-xs text-text-muted">
                <span className="text-text-primary">{role}</span> → {dest}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
