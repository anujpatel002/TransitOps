import { useEffect, useState } from 'react';
import { fuelApi, expensesApi, FuelLog, Expense } from '../../api/fuelExpenses';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const inp = 'w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const lbl = 'block text-text-muted text-xs font-medium uppercase tracking-wider mb-1.5';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-panel border border-border rounded-xl w-[400px] p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-5">
          <p className="text-text-primary font-semibold">{title}</p>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-xl leading-none transition-colors">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs]   = useState<FuelLog[]>([]);
  const [expenses, setExpenses]   = useState<Expense[]>([]);
  const [vehicles, setVehicles]   = useState<Vehicle[]>([]);
  const [showFuel, setShowFuel]   = useState(false);
  const [showExp, setShowExp]     = useState(false);
  const [fuelForm, setFuelForm]   = useState({ vehicleId: '', liters: '', cost: '', date: '' });
  const [expForm, setExpForm]     = useState({ vehicleId: '', type: 'Toll', amount: '', date: '' });
  const [pageError, setPageError] = useState('');
  const [formError, setFormError] = useState('');

  const load = () => {
    setPageError('');
    Promise.all([
      fuelApi.list().then(r => setFuelLogs(r.data)),
      expensesApi.list().then(r => setExpenses(r.data)),
      vehiclesApi.list().then(r => setVehicles(r.data)),
    ]).catch(err => setPageError(friendlyError(err)));
  };
  useEffect(load, []);

  const submitFuel = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    try { await fuelApi.create({ vehicleId: fuelForm.vehicleId, liters: Number(fuelForm.liters), cost: Number(fuelForm.cost), date: fuelForm.date }); setShowFuel(false); setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' }); load(); }
    catch (err) { setFormError(friendlyError(err)); }
  };
  const submitExp = async (e: React.FormEvent) => {
    e.preventDefault(); setFormError('');
    try { await expensesApi.create({ vehicleId: expForm.vehicleId, type: expForm.type, amount: Number(expForm.amount), date: expForm.date }); setShowExp(false); setExpForm({ vehicleId: '', type: 'Toll', amount: '', date: '' }); load(); }
    catch (err) { setFormError(friendlyError(err)); }
  };

  const totalFuel = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalExp  = expenses.reduce((s, e) => s + e.amount, 0);
  const fmt       = (n: number) => `₹${n.toLocaleString()}`;
  const fmtDate   = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const vName     = (id: string) => vehicles.find(v => v.id === id)?.regNumber ?? id.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Fuel & Expenses</h1>
          <p className="text-text-muted text-xs mt-0.5">Track fuel consumption and operational expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowFuel(true); setFormError(''); }} className="bg-accent hover:bg-accent-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors shadow-lg shadow-amber-900/20">
            + Log Fuel
          </button>
          <button onClick={() => { setShowExp(true); setFormError(''); }} className="border border-border text-text-muted hover:text-text-primary text-sm px-4 py-2 rounded-lg transition-colors">
            + Add Expense
          </button>
        </div>
      </div>

      <ErrorBanner message={pageError} />

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-panel border border-t-2 border-blue-500 border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Fuel Cost</p>
          <p className="text-blue-400 text-2xl font-bold">{fmt(totalFuel)}</p>
          <p className="text-text-muted text-xs mt-1">{fuelLogs.length} log{fuelLogs.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-panel border border-t-2 border-amber-500 border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Other Expenses</p>
          <p className="text-amber-400 text-2xl font-bold">{fmt(totalExp)}</p>
          <p className="text-text-muted text-xs mt-1">{expenses.length} record{expenses.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-panel border border-t-2 border-accent border-border rounded-lg p-4">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total Operational</p>
          <p className="text-accent text-2xl font-bold">{fmt(totalFuel + totalExp)}</p>
          <p className="text-text-muted text-xs mt-1">Fuel + Expenses</p>
        </div>
      </div>

      {/* Fuel Logs table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-text-primary text-sm font-semibold">Fuel Logs</span>
          <span className="text-text-muted text-xs">{fuelLogs.length} records</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.01]">
              {['Vehicle', 'Date', 'Liters', 'Cost per L', 'Total Cost'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuelLogs.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-text-muted text-sm">No fuel logs yet</td></tr>}
            {fuelLogs.map(l => (
              <tr key={l.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-accent font-mono text-xs font-medium">{l.vehicle?.regNumber ?? vName(l.vehicleId)}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{fmtDate(l.date)}</td>
                <td className="px-4 py-3 text-text-primary">{l.liters} L</td>
                <td className="px-4 py-3 text-text-muted">₹{(l.cost / l.liters).toFixed(1)}/L</td>
                <td className="px-4 py-3 text-text-primary font-medium">{fmt(l.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expenses table */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-text-primary text-sm font-semibold">Other Expenses</span>
          <span className="text-text-muted text-xs">{expenses.length} records</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-white/[0.01]">
              {['Vehicle', 'Date', 'Type', 'Amount'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-text-muted text-xs font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && <tr><td colSpan={4} className="text-center py-10 text-text-muted text-sm">No expenses yet</td></tr>}
            {expenses.map(e => (
              <tr key={e.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3 text-accent font-mono text-xs font-medium">{e.vehicle?.regNumber ?? vName(e.vehicleId)}</td>
                <td className="px-4 py-3 text-text-muted text-xs">{fmtDate(e.date)}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-text-muted border border-white/10">{e.type}</span></td>
                <td className="px-4 py-3 text-text-primary font-medium">{fmt(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showFuel && (
        <Modal title="Log Fuel" onClose={() => setShowFuel(false)}>
          <form onSubmit={submitFuel} className="flex flex-col gap-3">
            <ErrorBanner message={formError} />
            <div><label className={lbl}>Vehicle</label>
              <select required value={fuelForm.vehicleId} onChange={e => setFuelForm(f => ({ ...f, vehicleId: e.target.value }))} className={inp}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Liters</label><input required type="number" min="0" placeholder="45" value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))} className={inp} /></div>
              <div><label className={lbl}>Cost (₹)</label><input required type="number" min="0" placeholder="4050" value={fuelForm.cost} onChange={e => setFuelForm(f => ({ ...f, cost: e.target.value }))} className={inp} /></div>
            </div>
            <div><label className={lbl}>Date</label><input required type="date" value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))} className={inp} /></div>
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2.5 rounded-lg mt-1">Save Fuel Log</button>
          </form>
        </Modal>
      )}

      {showExp && (
        <Modal title="Add Expense" onClose={() => setShowExp(false)}>
          <form onSubmit={submitExp} className="flex flex-col gap-3">
            <ErrorBanner message={formError} />
            <div><label className={lbl}>Vehicle</label>
              <select required value={expForm.vehicleId} onChange={e => setExpForm(f => ({ ...f, vehicleId: e.target.value }))} className={inp}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>Type</label>
                <select value={expForm.type} onChange={e => setExpForm(f => ({ ...f, type: e.target.value }))} className={inp}>
                  {['Toll', 'Parking', 'Insurance', 'Misc'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={lbl}>Amount (₹)</label><input required type="number" min="0" placeholder="500" value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))} className={inp} /></div>
            </div>
            <div><label className={lbl}>Date</label><input required type="date" value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} className={inp} /></div>
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2.5 rounded-lg mt-1">Save Expense</button>
          </form>
        </Modal>
      )}
    </div>
  );
}
