import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driversApi, Driver } from '../../api/drivers';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HPMV', 'HGMV'];
const DRIVER_STATUSES: Driver['status'][] = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];

const EMPTY_FORM = {
  name: '',
  licenseNumber: '',
  licenseCategory: 'LMV',
  licenseExpiry: '',
  contact: '',
  safetyScore: 100,
  status: 'AVAILABLE' as Driver['status'],
};

function isExpired(dateStr: string) {
  return new Date(dateStr) < new Date();
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' });
}

export default function Drivers() {
  const queryClient = useQueryClient();

  // Search
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Data
  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => driversApi.list().then(r => r.data),
  });

  // Client-side search
  const filtered = drivers.filter((d) =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.contact.toLowerCase().includes(search.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Driver, 'id'>) => driversApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (msg) setFormError(msg);
      else setFormError('Failed to save driver');
    },
  });

  // Patch mutation
  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Driver> }) => driversApi.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (msg) setFormError(msg);
      else setFormError('Failed to update driver');
    },
  });

  function openAddModal() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(d: Driver) {
    setForm({
      name: d.name,
      licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry ? d.licenseExpiry.slice(0, 10) : '',
      contact: d.contact,
      safetyScore: d.safetyScore,
      status: d.status,
    });
    setFormError('');
    setEditingId(d.id);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setFormError('');
    setEditingId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    if (!form.licenseNumber.trim()) { setFormError('License number is required'); return; }
    if (!form.licenseExpiry) { setFormError('License expiry date is required'); return; }

    const payload = {
      ...form,
      safetyScore: Number(form.safetyScore),
      licenseExpiry: new Date(form.licenseExpiry).toISOString(),
    };

    if (editingId) {
      patchMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const inputCls = 'w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors';
  const labelCls = 'block text-text-muted text-xs font-medium mb-1.5';

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">Drivers &amp; Safety Profiles</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search name, license, contact..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-64"
        />

        <div className="flex-1" />

        <button
          onClick={openAddModal}
          className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded transition-colors"
        >
          + Add Driver
        </button>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-text-muted font-medium">DRIVER</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">LICENSE NO.</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">CATEGORY</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">EXPIRY</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">CONTACT</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">SAFETY</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">STATUS</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-muted">Loading drivers...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-muted">No drivers found</td>
              </tr>
            ) : (
              filtered.map((d) => {
                const expired = isExpired(d.licenseExpiry);
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-text-primary font-medium">{d.name}</td>
                    <td className="px-4 py-3 text-text-primary font-mono text-xs">{d.licenseNumber}</td>
                    <td className="px-4 py-3 text-text-primary">{d.licenseCategory}</td>
                    <td className="px-4 py-3">
                      <span className={expired ? 'text-rose-400 font-medium' : 'text-text-primary'}>
                        {formatDate(d.licenseExpiry)}
                        {expired && <span className="ml-1 text-[10px] uppercase tracking-wide">(Expired)</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text-primary">{d.contact}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${d.safetyScore >= 90 ? 'text-green-400' : d.safetyScore >= 70 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {d.safetyScore}%
                      </span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEditModal(d)}
                        className="text-xs text-accent hover:text-accent-hover transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Status Legend */}
      <div className="flex items-center gap-4 mt-3">
        {DRIVER_STATUSES.map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <StatusBadge status={s} />
          </div>
        ))}
      </div>

      {/* Footer rule */}
      <p className="mt-2 text-xs text-accent/70 italic">
        Rule: Expired license or Suspended status → blocked from Trip assignment.
      </p>

      {/* Add / Edit Driver Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Driver' : 'Add Driver'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2 text-rose-400 text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Alex Kumar"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>License Number</label>
              <input
                className={inputCls}
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="e.g. DL-99213"
                required
              />
            </div>
            <div>
              <label className={labelCls}>License Category</label>
              <select
                className={inputCls}
                value={form.licenseCategory}
                onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}
              >
                {LICENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>License Expiry Date</label>
              <input
                type="date"
                className={inputCls}
                value={form.licenseExpiry}
                onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Contact Number</label>
              <input
                className={inputCls}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="e.g. 9876500000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Safety Score (%)</label>
              <input
                type="number"
                className={inputCls}
                value={form.safetyScore}
                onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })}
                min={0}
                max={100}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Driver['status'] })}
              >
                {DRIVER_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm text-text-muted hover:text-text-primary border border-border rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || patchMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-accent hover:bg-accent-hover rounded transition-colors disabled:opacity-50"
            >
              {(createMutation.isPending || patchMutation.isPending) ? 'Saving...' : editingId ? 'Update' : 'Add Driver'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
