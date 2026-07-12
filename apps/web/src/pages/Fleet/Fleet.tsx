import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';

const VEHICLE_TYPES = ['Van', 'Truck', 'Mini', 'Bus', 'Tempo'];
const VEHICLE_STATUSES: Vehicle['status'][] = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const EMPTY_FORM = {
  regNumber: '',
  name: '',
  type: 'Van',
  maxLoadKg: 0,
  odometer: 0,
  acquisitionCost: 0,
  status: 'AVAILABLE' as Vehicle['status'],
};

export default function Fleet() {
  const queryClient = useQueryClient();

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Data
  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles', typeFilter, statusFilter],
    queryFn: () => vehiclesApi.list({
      type: typeFilter || undefined,
      status: statusFilter || undefined,
    }).then(r => r.data),
  });

  // Client-side search filter
  const filtered = vehicles.filter((v) =>
    !search || v.regNumber.toLowerCase().includes(search.toLowerCase()) || v.name.toLowerCase().includes(search.toLowerCase())
  );

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: Omit<Vehicle, 'id'>) => vehiclesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (msg) setFormError(msg);
      else setFormError('Failed to save vehicle');
    },
  });

  // Patch mutation
  const patchMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Vehicle> }) => vehiclesApi.patch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      closeModal();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      if (msg) setFormError(msg);
      else setFormError('Failed to update vehicle');
    },
  });

  function openAddModal() {
    setForm(EMPTY_FORM);
    setFormError('');
    setEditingId(null);
    setModalOpen(true);
  }

  function openEditModal(v: Vehicle) {
    setForm({
      regNumber: v.regNumber,
      name: v.name,
      type: v.type,
      maxLoadKg: v.maxLoadKg,
      odometer: v.odometer,
      acquisitionCost: v.acquisitionCost,
      status: v.status,
    });
    setFormError('');
    setEditingId(v.id);
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
    if (!form.regNumber.trim()) { setFormError('Registration number is required'); return; }
    if (!form.name.trim()) { setFormError('Name/Model is required'); return; }

    const payload = {
      ...form,
      maxLoadKg: Number(form.maxLoadKg),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
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
        <h1 className="text-text-primary text-xl font-semibold">Vehicle Registry</h1>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Type filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">All Types</option>
          {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent"
        >
          <option value="">All Status</option>
          {VEHICLE_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        {/* Search */}
        <input
          type="text"
          placeholder="Search reg. no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-52"
        />

        <div className="flex-1" />

        {/* Add button */}
        <button
          onClick={openAddModal}
          className="bg-accent hover:bg-accent-hover text-white font-medium text-sm px-4 py-2 rounded transition-colors"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-text-muted font-medium">REG. NO. / CHASSIS</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">NAME/MODEL</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">TYPE</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">CAPACITY</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">ODOMETER</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">ACQ. COST</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium">STATUS</th>
              <th className="text-left px-4 py-3 text-text-muted font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-muted">Loading vehicles...</td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-text-muted">No vehicles found</td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-text-primary font-mono text-xs">{v.regNumber}</td>
                  <td className="px-4 py-3 text-text-primary">{v.name}</td>
                  <td className="px-4 py-3 text-text-primary">{v.type}</td>
                  <td className="px-4 py-3 text-text-primary">
                    {v.maxLoadKg >= 1000 ? `${(v.maxLoadKg / 1000).toFixed(1)} Ton` : `${v.maxLoadKg} kg`}
                  </td>
                  <td className="px-4 py-3 text-text-primary">{v.odometer.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-text-primary">₹{v.acquisitionCost.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} /></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openEditModal(v)}
                      className="text-xs text-accent hover:text-accent-hover transition-colors"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer rule */}
      <p className="mt-3 text-xs text-accent/70 italic">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher.
      </p>

      {/* Add / Edit Vehicle Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Vehicle' : 'Add Vehicle'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2 text-rose-400 text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className={labelCls}>Registration Number</label>
            <input
              className={inputCls}
              value={form.regNumber}
              onChange={(e) => setForm({ ...form, regNumber: e.target.value })}
              placeholder="e.g. GJ01AB1234"
              required
            />
          </div>

          <div>
            <label className={labelCls}>Name / Model</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. VAN-05"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Type</label>
              <select
                className={inputCls}
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select
                className={inputCls}
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Vehicle['status'] })}
              >
                {VEHICLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Max Load (kg)</label>
              <input
                type="number"
                className={inputCls}
                value={form.maxLoadKg}
                onChange={(e) => setForm({ ...form, maxLoadKg: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Odometer</label>
              <input
                type="number"
                className={inputCls}
                value={form.odometer}
                onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })}
                min={0}
                required
              />
            </div>
            <div>
              <label className={labelCls}>Acquisition Cost (₹)</label>
              <input
                type="number"
                className={inputCls}
                value={form.acquisitionCost}
                onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })}
                min={0}
                required
              />
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
              {(createMutation.isPending || patchMutation.isPending) ? 'Saving...' : editingId ? 'Update' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
