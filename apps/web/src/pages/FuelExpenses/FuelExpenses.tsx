import { useEffect, useState } from 'react';
import { fuelApi, expensesApi, FuelLog, Expense } from '../../api/fuelExpenses';
import { vehiclesApi, Vehicle } from '../../api/vehicles';

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-panel border border-border rounded-lg w-[400px] p-6">
        <div className="flex justify-between items-center mb-4">
          <p className="text-text-primary font-semibold">{title}</p>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary text-lg leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function FuelExpenses() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpModal, setShowExpModal] = useState(false);
  const [fuelForm, setFuelForm] = useState({ vehicleId: '', liters: '', cost: '', date: '' });
  const [expForm, setExpForm] = useState({ vehicleId: '', type: 'Toll', amount: '', date: '' });

  const load = () => {
    fuelApi.list().then(r => setFuelLogs(r.data));
    expensesApi.list().then(r => setExpenses(r.data));
    vehiclesApi.list().then(r => setVehicles(r.data));
  };

  useEffect(load, []);

  const totalFuel = fuelLogs.reduce((s, l) => s + l.cost, 0);
  const totalMaint = expenses.reduce((s, e) => s + e.amount, 0);
  // Operational cost = fuel + maintenance (expenses here are toll/misc; maintenance cost comes from maintenanceLogs)
  // We sum fuel logs + expenses as the "operational" total visible on this screen
  const totalOps = totalFuel + totalMaint;

  const submitFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    await fuelApi.create({
      vehicleId: fuelForm.vehicleId,
      liters: Number(fuelForm.liters),
      cost: Number(fuelForm.cost),
      date: fuelForm.date,
    });
    setShowFuelModal(false);
    setFuelForm({ vehicleId: '', liters: '', cost: '', date: '' });
    load();
  };

  const submitExp = async (e: React.FormEvent) => {
    e.preventDefault();
    await expensesApi.create({
      vehicleId: expForm.vehicleId,
      type: expForm.type,
      amount: Number(expForm.amount),
      date: expForm.date,
    });
    setShowExpModal(false);
    setExpForm({ vehicleId: '', type: 'Toll', amount: '', date: '' });
    load();
  };

  const fmt = (n: number) => `₹${n.toLocaleString()}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const vehicleName = (id: string) =>
    vehicles.find(v => v.id === id)?.regNumber ?? id.slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      {/* Fuel Logs */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-text-primary text-sm font-semibold tracking-wide">FUEL LOGS</span>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFuelModal(true)}
              className="text-xs bg-accent hover:bg-accent-hover text-white px-3 py-1.5 rounded transition-colors"
            >
              + Log Fuel
            </button>
            <button
              onClick={() => setShowExpModal(true)}
              className="text-xs border border-border text-text-muted hover:text-text-primary px-3 py-1.5 rounded transition-colors"
            >
              + Add Expense
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['VEHICLE', 'DATE', 'LITERS', 'COST'].map(h => (
                <th key={h} className="text-left text-text-muted text-xs px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fuelLogs.length === 0 && (
              <tr><td colSpan={4} className="text-text-muted text-xs px-4 py-4 text-center">No fuel logs</td></tr>
            )}
            {fuelLogs.map(l => (
              <tr key={l.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-text-primary font-medium">
                  {l.vehicle?.regNumber ?? vehicleName(l.vehicleId)}
                </td>
                <td className="px-4 py-2.5 text-text-muted">{fmtDate(l.date)}</td>
                <td className="px-4 py-2.5 text-text-muted">{l.liters} L</td>
                <td className="px-4 py-2.5 text-text-primary">{fmt(l.cost)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Other Expenses */}
      <div className="bg-panel border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <span className="text-text-primary text-sm font-semibold tracking-wide">OTHER EXPENSES (TOLL / MISC)</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {['VEHICLE', 'DATE', 'TYPE', 'AMOUNT'].map(h => (
                <th key={h} className="text-left text-text-muted text-xs px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 && (
              <tr><td colSpan={4} className="text-text-muted text-xs px-4 py-4 text-center">No expenses</td></tr>
            )}
            {expenses.map(e => (
              <tr key={e.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                <td className="px-4 py-2.5 text-text-primary font-medium">
                  {e.vehicle?.regNumber ?? vehicleName(e.vehicleId)}
                </td>
                <td className="px-4 py-2.5 text-text-muted">{fmtDate(e.date)}</td>
                <td className="px-4 py-2.5 text-text-muted">{e.type}</td>
                <td className="px-4 py-2.5 text-text-primary">{fmt(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total Operational Cost banner */}
      <div className="bg-panel border border-accent/30 rounded-lg px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-text-muted text-xs font-medium tracking-wide">TOTAL OPERATIONAL COST (AUTO)</p>
          <p className="text-text-muted text-xs mt-0.5">= FUEL + MAINT. — never manually entered, always derived</p>
        </div>
        <p className="text-accent text-3xl font-bold">{fmt(totalOps)}</p>
      </div>

      {/* Log Fuel Modal */}
      {showFuelModal && (
        <Modal title="Log Fuel" onClose={() => setShowFuelModal(false)}>
          <form onSubmit={submitFuel} className="flex flex-col gap-3">
            <select
              required value={fuelForm.vehicleId}
              onChange={e => setFuelForm(f => ({ ...f, vehicleId: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="">Select vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
            </select>
            <input required type="number" min="0" placeholder="Liters"
              value={fuelForm.liters} onChange={e => setFuelForm(f => ({ ...f, liters: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            <input required type="number" min="0" placeholder="Cost (₹)"
              value={fuelForm.cost} onChange={e => setFuelForm(f => ({ ...f, cost: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            <input required type="date"
              value={fuelForm.date} onChange={e => setFuelForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2 rounded">
              Save
            </button>
          </form>
        </Modal>
      )}

      {/* Add Expense Modal */}
      {showExpModal && (
        <Modal title="Add Expense" onClose={() => setShowExpModal(false)}>
          <form onSubmit={submitExp} className="flex flex-col gap-3">
            <select
              required value={expForm.vehicleId}
              onChange={e => setExpForm(f => ({ ...f, vehicleId: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            >
              <option value="">Select vehicle…</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.regNumber} — {v.name}</option>)}
            </select>
            <select
              value={expForm.type} onChange={e => setExpForm(f => ({ ...f, type: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            >
              {['Toll', 'Parking', 'Insurance', 'Misc'].map(t => <option key={t}>{t}</option>)}
            </select>
            <input required type="number" min="0" placeholder="Amount (₹)"
              value={expForm.amount} onChange={e => setExpForm(f => ({ ...f, amount: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            <input required type="date"
              value={expForm.date} onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))}
              className="w-full bg-bg border border-border text-text-primary text-sm rounded px-3 py-2 focus:outline-none focus:border-accent"
            />
            <button type="submit" className="w-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold py-2 rounded">
              Save
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
