import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const VEHICLE_TYPES = ['Van', 'Truck', 'Mini', 'Bus', 'Tempo'];
const VEHICLE_STATUSES: Vehicle['status'][] = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const EMPTY_FORM = {
  regNumber: '', name: '', type: 'Van',
  maxLoadKg: 0, odometer: 0, acquisitionCost: 0,
  status: 'AVAILABLE' as Vehicle['status'],
};

const inp = 'w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const lbl = 'block text-text-muted text-xs font-medium uppercase tracking-wider mb-1.5';

export default function Fleet() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]             = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [formError, setFormError]       = useState('');
  const [editingId, setEditingId]       = useState<string | null>(null);

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', typeFilter, statusFilter],
    queryFn: () => vehiclesApi.list({ type: typeFilter || undefined, status: statusFilter || undefined }).then(r => r.data),
  });

  const filtered = vehicles.filter(v =>
    !search || v.regNumber.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())
  );

  const createMut = useMutation({
    mutationFn: (data: Omit<Vehicle, 'id'>) => vehiclesApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); closeModal(); },
    onError: (err: any) => setFormError(friendlyError(err)),
  });
  const patchMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => vehiclesApi.patch(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vehicles'] }); closeModal(); },
    onError: (err: any) => setFormError(friendlyError(err)),
  });

  function openAdd() { setForm(EMPTY_FORM); setFormError(''); setEditingId(null); setModalOpen(true); }
  function openEdit(v: Vehicle) {
    setForm({ regNumber: v.regNumber, name: v.name, type: v.type, maxLoadKg: v.maxLoadKg, odometer: v.odometer, acquisitionCost: v.acquisitionCost, status: v.status });
    setFormError(''); setEditingId(v.id); setModalOpen(true);
  }
  function closeModal() { setModalOpen(false); setFormError(''); setEditingId(null); }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    if (!form.regNumber.trim()) { setFormError('Registration number is required'); return; }
    if (!form.name.trim()) { setFormError('Name/Model is required'); return; }
    const payload = { ...form, maxLoadKg: Number(form.maxLoadKg), odometer: Number(form.odometer), acquisitionCost: Number(form.acquisitionCost) };
    editingId ? patchMut.mutate({ id: editingId, data: payload }) : createMut.mutate(payload);
  }

  const busy = createMut.isPending || patchMut.isPending;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Vehicle Registry</h1>
          <p className="text-text-muted text-xs mt-0.5">Manage fleet vehicles and their operational status</p>
        </div>
        <button onClick={openAdd} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20 flex items-center gap-1.5">
          <span className="text-base leading-none">+</span> Add Vehicle
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
          <option value="">All Types</option>
          {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent">
          <option value="">All Status</option>
          {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <input type="text" placeholder="Search reg. no or name…" value={search} onChange={e => setSearch(e.target.value)}
          className="bg-panel border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-56" />
        <span className="ml-auto text-text-muted text-xs">{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.01]">
              {['Reg. No.', 'Name / Model', 'Type', 'Capacity', 'Odometer', 'Acq. Cost', 'Status', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center py-14 text-text-muted text-sm">Loading vehicles…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-14 text-text-muted text-sm">No vehicles found</td></tr>
            ) : filtered.map(v => (
              <tr key={v.id} className="border-b border-border/40 hover:bg-white/[0.025] transition-colors group">
                <td className="px-4 py-3 font-mono text-xs text-accent font-medium">{v.regNumber}</td>
                <td className="px-4 py-3 text-text-primary font-medium">{v.name}</td>
                <td className="px-4 py-3 text-text-muted">{v.type}</td>
                <td className="px-4 py-3 text-text-primary">{v.maxLoadKg >= 1000 ? `${(v.maxLoadKg/1000).toFixed(1)}T` : `${v.maxLoadKg} kg`}</td>
                <td className="px-4 py-3 text-text-muted">{v.odometer.toLocaleString('en-IN')} km</td>
                <td className="px-4 py-3 text-text-primary">₹{v.acquisitionCost.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-3">
                  <button onClick={() => openEdit(v)} className="text-xs text-text-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100">
                    Edit ✎
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-text-muted italic">
        ⓘ Reg. No. must be unique · In Shop / Retired vehicles are excluded from dispatch pool
      </p>

      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className={lbl}>Registration Number</label>
            <input className={inp} value={form.regNumber} onChange={e => setForm({ ...form, regNumber: e.target.value })} placeholder="e.g. GJ01AB1234" required />
          </div>
          <div>
            <label className={lbl}>Name / Model</label>
            <input className={inp} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Van Echo" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Type</label>
              <select className={inp} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Status</label>
              <select className={inp} value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Vehicle['status'] })}>
                {VEHICLE_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={lbl}>Max Load (kg)</label>
              <input type="number" className={inp} value={form.maxLoadKg} onChange={e => setForm({ ...form, maxLoadKg: Number(e.target.value) })} min={0} required />
            </div>
            <div>
              <label className={lbl}>Odometer (km)</label>
              <input type="number" className={inp} value={form.odometer} onChange={e => setForm({ ...form, odometer: Number(e.target.value) })} min={0} required />
            </div>
            <div>
              <label className={lbl}>Acq. Cost (₹)</label>
              <input type="number" className={inp} value={form.acquisitionCost} onChange={e => setForm({ ...form, acquisitionCost: Number(e.target.value) })} min={0} required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeModal} className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-border rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={busy} className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded-lg transition-colors disabled:opacity-50">
              {busy ? 'Saving…' : editingId ? 'Update Vehicle' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
