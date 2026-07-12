import { useEffect, useState } from 'react';
import { maintenanceApi, MaintenanceLog } from '../../api/maintenance';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const SERVICE_TYPES = ['Oil Change', 'Engine Repair', 'Tyre Replace', 'Brake Service', 'General Service', 'Other'];
const inp = 'w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const lbl = 'block text-text-muted text-xs font-medium uppercase tracking-wider mb-1.5';

export default function Maintenance() {
  const [logs, setLogs]         = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm]         = useState({ vehicleId: '', desc: SERVICE_TYPES[0], cost: '' });
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [pageError, setPageError] = useState('');

  const load = () => {
    setPageError('');
    Promise.all([
      maintenanceApi.list().then(r => setLogs(r.data)),
      vehiclesApi.list().then(r => setVehicles(r.data)),
    ]).catch(err => setPageError(friendlyError(err)));
  };
  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.cost) { setError('Vehicle and cost are required.'); return; }
    setSaving(true); setError('');
    try { await maintenanceApi.create({ vehicleId: form.vehicleId, desc: form.desc, cost: Number(form.cost) }); setForm({ vehicleId: '', desc: SERVICE_TYPES[0], cost: '' }); load(); }
    catch (err) { setError(friendlyError(err)); }
    finally { setSaving(false); }
  };

  const handleClose = async (id: string) => {
    try { await maintenanceApi.close(id); load(); }
    catch (err) { setPageError(friendlyError(err)); }
  };

  const vehicleName = (id: string) => vehicles.find(v => v.id === id)?.regNumber ?? id.slice(0, 8);
  const active = logs.filter(l => l.active).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-text-primary text-lg font-semibold">Maintenance</h1>
        <p className="text-text-muted text-xs mt-0.5">Track service records and vehicle shop status</p>
      </div>
      <ErrorBanner message={pageError} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-t-2 border-amber-500 border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Open Records</p>
          <p className="text-amber-400 text-2xl font-bold">{active}</p>
        </div>
        <div className="bg-panel border border-t-2 border-green-500 border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Closed Records</p>
          <p className="text-green-400 text-2xl font-bold">{logs.filter(l => !l.active).length}</p>
        </div>
        <div className="bg-panel border border-t-2 border-blue-500 border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Cost</p>
          <p className="text-blue-400 text-2xl font-bold">₹{logs.reduce((s, l) => s + l.cost, 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Form */}
        <div className="w-[320px] shrink-0 bg-panel border border-border rounded-lg p-5 flex flex-col gap-4 self-start">
          <p className="text-text-primary text-sm font-semibold">Log Service Record</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={lbl}>Vehicle</label>
              <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className={inp}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Service Type</label>
              <select value={form.desc} onChange={e => setForm(f => ({ ...f, desc: e.target.value }))} className={inp}>
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Cost (₹)</label>
              <input type="number" min="0" placeholder="0" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} className={inp} />
            </div>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
            <button type="submit" disabled={saving} className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 shadow-lg shadow-amber-900/20">
              {saving ? 'Saving…' : 'Log Record'}
            </button>
          </form>

          <div className="border-t border-border pt-4 space-y-2">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wider">Status Flow</p>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-medium">Available</span>
              <span className="text-text-muted">→ log →</span>
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-medium">In Shop</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-400 font-medium">In Shop</span>
              <span className="text-text-muted">→ close →</span>
              <span className="px-2 py-1 rounded-lg bg-green-500/10 text-green-400 font-medium">Available</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-panel border border-border rounded-lg overflow-hidden self-start">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <span className="text-text-primary text-sm font-semibold">Service Log</span>
            <span className="text-text-muted text-xs">{logs.length} records</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-white/[0.01]">
                {['Vehicle', 'Service', 'Cost', 'Date', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-text-muted text-sm">No records yet</td></tr>}
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors group">
                  <td className="px-4 py-3 text-accent font-mono text-xs font-medium">{vehicleName(log.vehicleId)}</td>
                  <td className="px-4 py-3 text-text-primary">{log.desc}</td>
                  <td className="px-4 py-3 text-text-primary font-medium">₹{log.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-text-muted text-xs">{new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3"><StatusBadge status={log.active ? 'IN_SHOP' : 'COMPLETED'} /></td>
                  <td className="px-4 py-3">
                    {log.active && (
                      <button onClick={() => handleClose(log.id)}
                        className="text-xs text-accent hover:text-accent-hover border border-accent/30 hover:border-accent px-2.5 py-1 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        Close ✓
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
