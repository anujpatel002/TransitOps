import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';
import ErrorBanner from '../../components/ErrorBanner';

const RBAC = [
  { role: 'Admin',           fleet: '✓',    drivers: '✓',    trips: '✓',    fuel: '✓',    analytics: '✓'    },
  { role: 'Fleet Manager',   fleet: '✓',    drivers: '✓',    trips: '✓',    fuel: '✓',    analytics: '✓'    },
  { role: 'Dispatcher',      fleet: 'View', drivers: '–',    trips: '✓',    fuel: '–',    analytics: '–'    },
  { role: 'Safety Officer',  fleet: '–',    drivers: '✓',    trips: 'View', fuel: '–',    analytics: '–'    },
  { role: 'Financial Analyst',fleet: 'View',drivers: '–',    trips: '–',    fuel: '✓',    analytics: '✓'    },
];

const ROLES = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  FLEET_MANAGER: 'Fleet Manager', DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer', FINANCIAL_ANALYST: 'Financial Analyst',
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN:             'bg-rose-400/10 text-rose-400',
  FLEET_MANAGER:     'bg-amber-400/10 text-amber-400',
  DISPATCHER:        'bg-blue-400/10 text-blue-400',
  SAFETY_OFFICER:    'bg-green-400/10 text-green-400',
  FINANCIAL_ANALYST: 'bg-purple-400/10 text-purple-400',
};

function cellStyle(val: string) {
  if (val === '✓') return 'text-green-400';
  if (val === 'View') return 'text-blue-400';
  return 'text-text-muted';
}

const inp = 'w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';

const BLANK = { name: '', email: '', role: 'DISPATCHER' as string, password: '' };

export default function Settings() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const isManager = me?.role === 'FLEET_MANAGER';
  const isAdmin    = me?.role === 'ADMIN';

  const [tab, setTab] = useState<'general' | 'users' | 'requests' | 'rbac'>('general');
  const [form, setForm] = useState({ depot: 'Mumbai Central Depot', currency: 'INR', distUnit: 'km' });
  const [showAdd, setShowAdd] = useState(false);
  const [newUser, setNewUser] = useState(BLANK);
  const [addError, setAddError] = useState('');

  const { data: users = [], error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => http.get('/users').then(r => r.data),
    enabled: (isManager || isAdmin) && tab === 'users',
  });

  const { data: requests = [], error: requestsError } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => http.get('/registration-requests').then(r => r.data),
    enabled: isAdmin && tab === 'requests',
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: string; action: string; rejectReason?: string }) =>
      http.patch(`/registration-requests/${id}`, { action, rejectReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registration-requests'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof BLANK) => http.post('/users', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowAdd(false); setNewUser(BLANK); setAddError(''); },
    onError: (err: any) => setAddError(err?.response?.data?.message ?? 'Failed to create user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => http.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const unlockMutation = useMutation({
    mutationFn: (id: string) => http.patch(`/users/${id}`, { unlock: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const TABS = [
    { key: 'general',  label: 'General' },
    ...(isManager || isAdmin ? [{ key: 'users',    label: 'User Management' }] : []),
    ...(isAdmin               ? [{ key: 'requests', label: 'Registration Requests' }] : []),
    { key: 'rbac',    label: 'RBAC Reference' },
  ] as const;

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* General */}
      {tab === 'general' && (
        <div className="max-w-sm bg-panel border border-border rounded-xl p-6 space-y-4">
          <p className="text-text-primary font-semibold text-sm">General Settings</p>
          <label className="block">
            <span className="text-text-muted text-xs block mb-1.5">Depot Name</span>
            <input value={form.depot} onChange={set('depot')} className={inp} />
          </label>
          <label className="block">
            <span className="text-text-muted text-xs block mb-1.5">Currency</span>
            <select value={form.currency} onChange={set('currency')} className={inp}>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-text-muted text-xs block mb-1.5">Distance Unit</span>
            <select value={form.distUnit} onChange={set('distUnit')} className={inp}>
              <option value="km">Kilometres (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </label>
          <button
            onClick={() => alert('Settings saved (demo)')}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* User Management */}
      {tab === 'users' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-sm">{users.length} user{users.length !== 1 ? 's' : ''} in the system</p>
            <button
              onClick={() => { setShowAdd(true); setAddError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Add User
            </button>
          </div>

          {usersError && <ErrorBanner message="Failed to load users" />}

          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Role', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-primary font-medium">{u.name || '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {u.lockedAt ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">Locked</span>
                      ) : u.mustChangePassword ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">Temp Password</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">Active</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        {u.lockedAt && (
                          <button
                            onClick={() => unlockMutation.mutate(u.id)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Unlock
                          </button>
                        )}
                        {u.id !== me?.id && (
                          <button
                            onClick={() => { if (confirm(`Delete ${u.email}?`)) deleteMutation.mutate(u.id); }}
                            className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add User Modal */}
          {showAdd && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-panel border border-border rounded-xl w-full max-w-md p-6" style={{ animation: 'slideUp 0.2s ease' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-text-primary font-semibold text-base">Add New User</h2>
                  <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
                </div>

                {addError && <ErrorBanner message={addError} />}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
                    <input
                      placeholder="e.g. Rohan Kumar"
                      value={newUser.name}
                      onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Email</label>
                    <input
                      type="email"
                      placeholder="user@transitops.io"
                      value={newUser.email}
                      onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))}
                      className={inp}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Role</label>
                    <select
                      value={newUser.role}
                      onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))}
                      className={inp}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Temporary Password</label>
                    <input
                      type="text"
                      placeholder="Min. 6 characters"
                      value={newUser.password}
                      onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))}
                      className={inp}
                    />
                    <p className="text-text-muted text-xs mt-1.5">User will be forced to change this on first login.</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 py-2.5 border border-border text-text-muted hover:text-text-primary rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => createMutation.mutate(newUser)}
                    disabled={createMutation.isPending}
                    className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {createMutation.isPending ? 'Creating…' : 'Create User'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registration Requests */}
      {tab === 'requests' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-sm">
              {requests.filter((r: any) => r.status === 'PENDING').length} pending request{requests.filter((r: any) => r.status === 'PENDING').length !== 1 ? 's' : ''}
            </p>
          </div>

          {requestsError && <ErrorBanner message="Failed to load requests" />}

          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Submitted', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">No registration requests yet</td></tr>
                )}
                {requests.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-primary font-medium">{r.name}</td>
                    <td className="px-5 py-3 text-text-muted">{r.email}</td>
                    <td className="px-5 py-3 text-text-muted text-xs">{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      {r.status === 'PENDING'  && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">Pending</span>}
                      {r.status === 'APPROVED' && <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">Approved</span>}
                      {r.status === 'REJECTED' && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">Rejected</span>}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === 'PENDING' && (
                        <div className="flex items-center gap-3 justify-end">
                          <button
                            onClick={() => reviewMutation.mutate({ id: r.id, action: 'approve' })}
                            disabled={reviewMutation.isPending}
                            className="text-xs text-green-400 hover:text-green-300 font-medium transition-colors disabled:opacity-40"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Rejection reason (optional):') ?? undefined;
                              reviewMutation.mutate({ id: r.id, action: 'reject', rejectReason: reason });
                            }}
                            disabled={reviewMutation.isPending}
                            className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors disabled:opacity-40"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {r.status === 'REJECTED' && r.rejectReason && (
                        <span className="text-xs text-text-muted italic">{r.rejectReason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RBAC Reference */}
      {tab === 'rbac' && (
        <div className="bg-panel border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-text-primary font-semibold text-sm">Role-Based Access Control</p>
            <p className="text-text-muted text-xs mt-0.5">Read-only reference — mirrors server-side permission matrix</p>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Role', 'Fleet', 'Drivers', 'Trips', 'Fuel/Exp', 'Analytics'].map(c => (
                  <th key={c} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC.map(row => (
                <tr key={row.role} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-text-primary font-medium">{row.role}</td>
                  {(['fleet', 'drivers', 'trips', 'fuel', 'analytics'] as const).map(col => (
                    <td key={col} className={`px-5 py-3 font-medium ${cellStyle(row[col])}`}>{row[col]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 border-t border-border flex gap-5">
            {[['✓', 'text-green-400', 'Full access'], ['View', 'text-blue-400', 'Read-only'], ['–', 'text-text-muted', 'No access']].map(([sym, cls, label]) => (
              <span key={sym} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className={`font-semibold ${cls}`}>{sym}</span> {label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
