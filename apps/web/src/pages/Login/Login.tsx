import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';

const ROLE_HINTS = [
  { role: 'Fleet Manager',     dest: 'Fleet, Maintenance',          color: 'text-amber-400',  bg: 'bg-amber-400/10'  },
  { role: 'Dispatcher',        dest: 'Dashboard, Trips',            color: 'text-blue-400',   bg: 'bg-blue-400/10'   },
  { role: 'Safety Officer',    dest: 'Drivers, Compliance',         color: 'text-green-400',  bg: 'bg-green-400/10'  },
  { role: 'Financial Analyst', dest: 'Fuel & Expenses, Analytics',  color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

const DEMO_USERS = [
  { label: 'Super Admin',                        email: 'admin@transitops.io',    password: 'admin123',    role: 'ADMIN',             org: ''                          },
  // Org 1 — Mumbai Freight Co
  { label: 'Rohan K — Fleet Manager (Mumbai)',   email: 'rohan.k@transitops.io',  password: 'fleet123',    role: 'FLEET_MANAGER',     org: 'Mumbai Freight Co'         },
  { label: 'Priya M — Fleet Manager (Mumbai)',   email: 'priya.m@transitops.io',  password: 'fleet123',    role: 'FLEET_MANAGER',     org: 'Mumbai Freight Co'         },
  { label: 'Tirth — Fleet Manager (Mumbai)',     email: 'tirth@transitops.io',    password: 'fleet123',    role: 'FLEET_MANAGER',     org: 'Mumbai Freight Co'         },
  { label: 'Anuj D — Dispatcher (Mumbai)',       email: 'anuj.d@transitops.io',   password: 'dispatch123', role: 'DISPATCHER',        org: 'Mumbai Freight Co'         },
  { label: 'Vivek R — Safety Officer (Mumbai)',  email: 'vivek.r@transitops.io',  password: 'safety123',   role: 'SAFETY_OFFICER',    org: 'Mumbai Freight Co'         },
  { label: 'Ahmed F — Financial Analyst (Mumbai)',email: 'ahmed.f@transitops.io', password: 'finance123',  role: 'FINANCIAL_ANALYST', org: 'Mumbai Freight Co'         },
  // Org 2 — Delhi Express Logistics
  { label: 'Sara T — Fleet Manager (Delhi)',     email: 'sara.t@transitops.io',   password: 'fleet123',    role: 'FLEET_MANAGER',     org: 'Delhi Express Logistics'   },
  { label: 'Neha S — Safety Officer (Delhi)',    email: 'neha.s@transitops.io',   password: 'safety123',   role: 'SAFETY_OFFICER',    org: 'Delhi Express Logistics'   },
  { label: 'Lina P — Financial Analyst (Delhi)', email: 'lina.p@transitops.io',   password: 'finance123',  role: 'FINANCIAL_ANALYST', org: 'Delhi Express Logistics'   },
];

const MAX_ATTEMPTS = 5;

const inputCls = 'w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-40';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [locked, setLocked]     = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [loading, setLoading]   = useState(false);

  const handleDemoSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const u = DEMO_USERS.find(u => u.email === e.target.value);
    if (u) { setEmail(u.email); setPassword(u.password); setError(''); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked || loading) return;
    setError(''); setLoading(true);
    try {
      const { data } = await http.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? 'Invalid credentials';
      if (msg.includes('locked')) {
        setLocked(true); setError('Account locked after 5 failed attempts. Contact your administrator.');
      } else {
        const next = attempts + 1; setAttempts(next);
        if (next >= MAX_ATTEMPTS) { setLocked(true); setError('Account locked after 5 failed attempts. Contact your administrator.'); }
        else setError(`Incorrect email or password. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next !== 1 ? 's' : ''} remaining.`);
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* LEFT panel */}
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col justify-between p-10 relative overflow-hidden" style={{ background: '#F5F1EA' }}>
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: '#D68910' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#D68910' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-black text-white shadow-lg">T</div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">TransitOps</span>
          </div>

          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Fleet Operations Platform</p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            Smart Transport<br />Operations
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Manage your entire fleet, dispatch trips, track drivers, and analyze performance — all in one place.
          </p>

          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Four roles, one platform</p>
          <div className="space-y-2">
            {ROLE_HINTS.map(({ role, dest, color, bg }) => (
              <div key={role} className={`flex items-center justify-between px-3 py-2 rounded-lg ${bg}`}>
                <span className={`text-sm font-semibold ${color}`}>{role}</span>
                <span className="text-xs text-gray-500">{dest}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-xs relative">TRANSITOPS © 2026 · RBAC SECURED</p>
      </div>

      {/* RIGHT panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-black text-white text-sm">T</div>
            <span className="font-bold text-lg text-text-primary">TransitOps</span>
          </div>

          <h1 className="text-2xl font-bold text-text-primary mb-1">Welcome back</h1>
          <p className="text-text-muted text-sm mb-8">
            Sign in to your account to continue.<br />
            <Link to="/register" className="text-accent hover:underline text-sm">Request access →</Link>
          </p>

          {error && (
            <div className={`mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm ${
              locked ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <span className="mt-0.5 shrink-0">{locked ? '🔒' : '⚠'}</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Demo picker */}
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Quick Demo Login
              </label>
              <select
                onChange={handleDemoSelect}
                defaultValue=""
                disabled={locked}
                className={inputCls + ' border-accent/30 focus:border-accent'}
              >
                <option value="" disabled>Select a demo user…</option>
                {['', 'Mumbai Freight Co', 'Delhi Express Logistics'].map(org => (
                  <optgroup key={org || 'admin'} label={org || 'Platform Admin'}>
                    {DEMO_USERS.filter(u => u.org === org).map(u => (
                      <option key={u.email} value={u.email}>{u.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-text-muted text-xs">or enter manually</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email" placeholder="rohan.k@transitops.io"
                value={email} onChange={e => setEmail(e.target.value)}
                disabled={locked} className={inputCls} required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Password</label>
              <input
                type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                disabled={locked} className={inputCls} required
              />
            </div>

            <button
              type="submit" disabled={locked || loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-semibold text-sm transition-all shadow-lg shadow-amber-900/20 mt-2"
            >
              {loading ? 'Signing in…' : locked ? '🔒 Account Locked' : 'Sign In →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
