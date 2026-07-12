import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';
import ErrorBanner from '../../components/ErrorBanner';

const ROLES = ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'] as const;
const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin', FLEET_MANAGER: 'Fleet Manager', DISPATCHER: 'Dispatcher',
  SAFETY_OFFICER: 'Safety Officer', FINANCIAL_ANALYST: 'Financial Analyst',
};
const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-rose-400/10 text-rose-400', FLEET_MANAGER: 'bg-amber-400/10 text-amber-400',
  DISPATCHER: 'bg-blue-400/10 text-blue-400', SAFETY_OFFICER: 'bg-green-400/10 text-green-400',
  FINANCIAL_ANALYST: 'bg-purple-400/10 text-purple-400',
};

const inp = 'w-full bg-bg border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const BLANK_USER = { name: '', email: '', role: 'FLEET_MANAGER' as string, password: '', orgId: '' };

type Tab = 'orgs' | 'users' | 'requests';

export default function AdminSettings() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('orgs');
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState(BLANK_USER);
  const [addError, setAddError] = useState('');

  // Orgs
  const { data: orgs = [], error: orgsError } = useQuery({
    queryKey: ['admin-orgs'],
    queryFn: () => http.get('/organizations').then(r => r.data),
    enabled: tab === 'orgs',
  });

  // Users
  const { data: users = [], error: usersError } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => http.get('/users').then(r => r.data),
    enabled: tab === 'users',
  });

  // Requests
  const { data: requests = [], error: requestsError } = useQuery({
    queryKey: ['registration-requests'],
    queryFn: () => http.get('/registration-requests').then(r => r.data),
    enabled: tab === 'requests',
  });

  const deleteOrgMutation = useMutation({
    mutationFn: (id: string) => http.delete(`/organizations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-orgs'] }),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof BLANK_USER) => http.post('/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddUser(false); setNewUser(BLANK_USER); setAddError('');
    },
    onError: (err: any) => setAddError(err?.response?.data?.message ?? 'Failed to create user'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => http.delete(`/users/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unlockUserMutation = useMutation({
    mutationFn: (id: string) => http.patch(`/users/${id}`, { unlock: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, rejectReason }: { id: string; action: string; rejectReason?: string }) =>
      http.patch(`/registration-requests/${id}`, { action, rejectReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registration-requests'] }),
  });

  const TABS = [
    { key: 'orgs' as Tab,     label: 'Organizations' },
    { key: 'users' as Tab,    label: 'Users' },
    { key: 'requests' as Tab, label: 'Registration Requests' },
  ];

  const pendingCount = (requests as any[]).filter(r => r.status === 'PENDING').length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-text-primary text-lg font-semibold">Platform Management</h1>
        <p className="text-text-muted text-xs mt-0.5">Manage organizations, users and access requests</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              tab === t.key ? 'border-accent text-accent' : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
            {t.key === 'requests' && pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">{pendingCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Organizations */}
      {tab === 'orgs' && (
        <div>
          {orgsError && <ErrorBanner message="Failed to load organizations" />}
          <p className="text-text-muted text-sm mb-4">{(orgs as any[]).length} organization{(orgs as any[]).length !== 1 ? 's' : ''}</p>
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Users', 'Vehicles', 'Created', ''].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(orgs as any[]).length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-text-muted text-sm">No organizations yet</td></tr>
                )}
                {(orgs as any[]).map((o: any) => (
                  <tr key={o.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-primary font-medium">{o.name}</td>
                    <td className="px-5 py-3 text-text-muted">{o._count.users}</td>
                    <td className="px-5 py-3 text-text-muted">{o._count.vehicles}</td>
                    <td className="px-5 py-3 text-text-muted text-xs">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => { if (confirm(`Delete "${o.name}" and all its data?`)) deleteOrgMutation.mutate(o.id); }}
                        disabled={deleteOrgMutation.isPending}
                        className="text-xs text-rose-400 hover:text-rose-300 transition-colors disabled:opacity-40"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div>
          {usersError && <ErrorBanner message="Failed to load users" />}
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-sm">{(users as any[]).length} user{(users as any[]).length !== 1 ? 's' : ''} across all organizations</p>
            <button
              onClick={() => { setShowAddUser(true); setAddError(''); }}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
            >
              + Add User
            </button>
          </div>
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Role', 'Organization', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(users as any[]).map((u: any) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-primary font-medium">{u.name || '—'}</td>
                    <td className="px-5 py-3 text-text-muted">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-text-muted text-sm">{u.org?.name || <span className="text-rose-400/60 italic text-xs">Platform Admin</span>}</td>
                    <td className="px-5 py-3">
                      {u.lockedAt
                        ? <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">Locked</span>
                        : u.mustChangePassword
                          ? <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 font-medium">Temp Password</span>
                          : <span className="text-xs px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-medium">Active</span>
                      }
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {u.lockedAt && (
                          <button onClick={() => unlockUserMutation.mutate(u.id)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            Unlock
                          </button>
                        )}
                        {u.id !== me?.id && (
                          <button
                            onClick={() => { if (confirm(`Delete ${u.email}?`)) deleteUserMutation.mutate(u.id); }}
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
          {showAddUser && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-panel border border-border rounded-xl w-full max-w-md p-6" style={{ animation: 'slideUp 0.2s ease' }}>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-text-primary font-semibold text-base">Add New User</h2>
                  <button onClick={() => setShowAddUser(false)} className="text-text-muted hover:text-text-primary text-xl leading-none">×</button>
                </div>
                {addError && <ErrorBanner message={addError} />}
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
                    <input placeholder="e.g. Rohan Kumar" value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Email</label>
                    <input type="email" placeholder="user@company.com" value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Role</label>
                    <select value={newUser.role} onChange={e => setNewUser(u => ({ ...u, role: e.target.value }))} className={inp}>
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Organization</label>
                    <select value={newUser.orgId} onChange={e => setNewUser(u => ({ ...u, orgId: e.target.value }))} className={inp}>
                      <option value="">— Select organization —</option>
                      {(orgs as any[]).map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Temporary Password</label>
                    <input type="text" placeholder="Min. 6 characters" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} className={inp} />
                    <p className="text-text-muted text-xs mt-1.5">User will be forced to change this on first login.</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setShowAddUser(false)} className="flex-1 py-2.5 border border-border text-text-muted hover:text-text-primary rounded-lg text-sm transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={() => createUserMutation.mutate(newUser)}
                    disabled={createUserMutation.isPending}
                    className="flex-1 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    {createUserMutation.isPending ? 'Creating…' : 'Create User'}
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
          {requestsError && <ErrorBanner message="Failed to load requests" />}
          <p className="text-text-muted text-sm mb-4">
            {pendingCount} pending request{pendingCount !== 1 ? 's' : ''}
          </p>
          <div className="bg-panel border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Name', 'Email', 'Company', 'Submitted', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(requests as any[]).length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-text-muted text-sm">No registration requests yet</td></tr>
                )}
                {(requests as any[]).map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                    <td className="px-5 py-3 text-text-primary font-medium">{r.name}</td>
                    <td className="px-5 py-3 text-text-muted">{r.email}</td>
                    <td className="px-5 py-3 text-text-muted">{r.orgName || '—'}</td>
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
    </div>
  );
}
