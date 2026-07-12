import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, Driver } from '../../api/drivers';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HPMV', 'HGMV'];
const DRIVER_STATUSES: Driver['status'][] = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

const EMPTY_FORM = {
  name: '', licenseNumber: '', licenseCategory: 'LMV',
  licenseExpiry: '', contact: '', safetyScore: 100,
  status: 'AVAILABLE' as Driver['status'],
};

const inp = 'w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const lbl = 'block text-text-muted text-xs font-medium uppercase tracking-wider mb-1.5';

function isExpired(d: string) { return new Date(d) < new Date(); }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

function SafetyBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 70 ? 'bg-amber-500' : 'bg-rose-500';
  const text  = score >= 90 ? 'text-green-400' : score >= 70 ? 'text-amber-400' : 'text-rose-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-semibold ${text}`}>{score}</span>
    </div>
  );
}

export default function Drivers() {
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.list().then(r => r.data),
  });

  const filtered = drivers.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.contact.toLowerCase().includes(search.toLowerCase())
  );

  const createMut = useMutation({
    mutationFn: (data: Omit<Driver, 'id'>) => driversApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); closeModal(); },
    onError: (err: any) => setFormError(friendlyError(err)),
  });
  const patchMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => driversApi.patch(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['drivers'] }); closeModal(); },
    onError: (err: any) => setFormError(friendlyError(err)),
  });

  function openAdd() { setForm(EMPTY_FORM); setFormError(''); setEditingId(null); setModalOpen(true); }
  function openEdit(d: Driver) {
    setForm({ name: d.name, licenseNumber: d.licenseNumber, licenseCategory: d.licenseCategory, licenseExpiry: d.licenseExpiry?.slice(0, 10) ?? '', contact: d.contact, safetyScore: d.safetyScore, status: d.status });
    setFormError(''); setEditingId(d.id); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setFormError(''); setEditingId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    if (!form.licenseNumber.trim()) { setFormError('License number is required'); return; }
    if (!form.licenseExpiry) { setFormError('License expiry date is required'); return; }
    const payload = { ...form, safetyScore: Number(form.safetyScore), licenseExpiry: new Date(form.licenseExpiry).toISOString() };
    editingId ? patchMut.mutate({ id: editingId, data: payload }) : createMut.mutate(payload);
  }

  const busy = createMut.isPending || patchMut.isPending;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Drivers & Safety</h1>
          <p className="text-text-muted text-xs mt-0.5">Manage driver profiles, licenses and safety scores</p>
        </div>
        <button onClick={openAdd} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20 flex items-center gap-1.5">
          <span className="text-base leading-none">+</span> Add Driver
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <input type="text" placeholder="Search name, license, contact…" value={search} onChange={e => setSearch(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-72" />
        <span className="ml-auto text-text-muted text-xs">{filtered.length} driver{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.01]">
              {['Driver', 'License No.', 'Category', 'Expiry', 'Contact', 'Safety Score', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-14 text-text-muted text-sm">Loading drivers…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-14 text-text-muted text-sm">No drivers found</td></tr>
            ) : filtered.map(d => {
              const expired = isExpired(d.licenseExpiry);
              return (
                <tr key={d.id} className="border-b border-border/40 hover:bg-white/[0.025] transition-colors group">
                  <td className="px-4 py-3 text-text-primary font-medium">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-accent">{d.licenseNumber}</td>
                  <td className="px-4 py-3 text-text-muted">{d.licenseCategory}</td>
                  <td className="px-4 py-3">
                    <span className={expired ? 'text-rose-400 font-medium' : 'text-text-primary'}>
                      {fmtDate(d.licenseExpiry)}
                      {expired && <span className="ml-1.5 text-[10px] bg-rose-500/15 text-rose-400 px-1.5 py-0.5 rounded-full">Expired</span>}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted text-xs">{d.contact}</td>
                  <td className="px-4 py-3"><SafetyBar score={d.safetyScore} /></td>
                  <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(d)} className="text-xs text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                      Edit ✎
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted italic">
        ⓘ Expired license or Suspended status → blocked from trip assignment
      </p>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className={lbl}>Full Name</label>
            <input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alex Kumar" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>License Number</label>
              <input className={inp} value={form.licenseNumber} onChange={e => setForm({ ...form, licenseNumber: e.target.value })} placeholder="e.g. DL-99213" required />
            </div>
            <div>
              <label className={lbl}>Category</label>
              <select className={inp} value={form.licenseCategory} onChange={e => setForm({ ...form, licenseCategory: e.target.value })}>
                {LICENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>License Expiry</label>
              <input type="date" className={inp} value={form.licenseExpiry} onChange={e => setForm({ ...form, licenseExpiry: e.target.value })} required />
            </div>
            <div>
              <label className={lbl}>Contact</label>
              <input className={inp} value={form.contact} onChange={e => setForm({ ...form, contact: e.target.value })} placeholder="9876500000" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Safety Score (0–100)</label>
              <input type="number" className={inp} value={form.safetyScore} onChange={e => setForm({ ...form, safetyScore: Number(e.target.value) })} min={0} max={100} required />
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Driver['status'] })}>
                {DRIVER_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50">
              {busy ? 'Saving…' : editingId ? 'Update Driver' : 'Add Driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
