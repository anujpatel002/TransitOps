import { useEffect, useState } from 'react';
import { maintenanceApi, MaintenanceLog } from '../../api/maintenance';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import StatusBadge from '../../components/StatusBadge';

const SERVICE_TYPES = ['Oil Change', 'Engine Repair', 'Tyre Replace', 'Brake Service', 'General Service', 'Other'];

export default function Maintenance() {
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: '', desc: SERVICE_TYPES[0], cost: '', date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    maintenanceApi.list().then(r => setLogs(r.data));
    vehiclesApi.list().then(r => setVehicles(r.data));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.vehicleId || !form.cost) { setError('Vehicle and cost are required.'); return; }
    setSaving(true); setError('');
    try {
      await maintenanceApi.create({ vehicleId: form.vehicleId, desc: form.desc, cost: Number(form.cost) });
      setForm({ vehicleId: '', desc: SERVICE_TYPES[0], cost: '', date: '' });
      load();
    } catch { setError('Failed to save record.'); }
    finally { setSaving(false); }
  };

  const handleClose = async (id: string) => {
    try {
      await maintenanceApi.close(id);
      load();
    } catch { alert('Failed to close record.'); }
  };

  return (
    <div>
      <div className="flex gap-4 mb-6">
        {/* Form — 35% */}
        <div className="w-[35%] bg-panel border border-border rounded-lg p-5">
          <p className="text-text-primary text-sm font-semibold tracking-wide mb-4">LOG SERVICE RECORD</p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-text-muted text-xs mb-1 block">VEHICLE</label>
              <select
                value={form.vehicleId}
                onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
              >
                <option value="">Select vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-text-muted text-xs mb-1 block">SERVICE TYPE</label>
              <select
                value={form.desc}
                onChange={e => setForm(f => ({ ...f, desc: e.target.value }))}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
              >
                {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-text-muted text-xs mb-1 block">COST (₹)</label>
              <input
                type="number" min="0" placeholder="0"
                value={form.cost}
                onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>

            <div>
              <label className="text-text-muted text-xs mb-1 block">DATE</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
              />
            </div>

            {error && <p className="text-rose-400 text-xs">{error}</p>}

            <button
              type="submit" disabled={saving}
              className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2 rounded transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>

          {/* State transition diagram */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs justify-center">
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 font-medium">Available</span>
              <span className="text-text-muted">→ create record →</span>
              <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-medium">In Shop</span>
            </div>
            <div className="flex items-center gap-2 text-xs justify-center mt-2">
              <span className="px-2 py-1 rounded bg-amber-500/10 text-amber-400 font-medium">In Shop</span>
              <span className="text-text-muted">→ close record →</span>
              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 font-medium">Available</span>
            </div>
            <p className="text-text-muted text-[10px] text-center mt-3">
              In Shop vehicles are removed from the dispatch pool.
            </p>
          </div>
        </div>

        {/* Table — 65% */}
        <div className="flex-1 bg-panel border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-text-primary text-sm font-semibold tracking-wide">SERVICE LOG</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['VEHICLE', 'SERVICE', 'COST', 'DATE', 'STATUS', ''].map(h => (
                  <th key={h} className="text-left text-text-muted text-xs px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && (
                <tr><td colSpan={6} className="text-text-muted text-xs px-4 py-4 text-center">No records</td></tr>
              )}
              {logs.map(log => (
                <tr key={log.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-text-primary font-medium">
                    {log.vehicle?.regNumber ?? log.vehicleId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-2.5 text-text-muted">{log.desc}</td>
                  <td className="px-4 py-2.5 text-text-primary">₹{log.cost.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-text-muted text-xs">
                    {new Date(log.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-2.5">
                    <StatusBadge status={log.active ? 'IN_SHOP' : 'COMPLETED'} />
                  </td>
                  <td className="px-4 py-2.5">
                    {log.active && (
                      <button
                        onClick={() => handleClose(log.id)}
                        className="text-xs text-accent hover:text-accent-hover border border-accent/30 hover:border-accent px-2 py-0.5 rounded transition-colors"
                      >
                        Close
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
