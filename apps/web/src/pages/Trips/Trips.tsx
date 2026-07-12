import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, Trip } from '../../api/trips';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import { driversApi, Driver } from '../../api/drivers';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] as const;

const inp = 'w-full bg-panel border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';
const lbl = 'block text-text-muted text-xs font-medium uppercase tracking-wider mb-1.5';

function Stepper() {
  return (
    <div className="flex items-center gap-1 mb-5">
      {STEPS.map((s, i) => {
        const colors: Record<string, string> = { DRAFT: 'bg-white/10 text-text-muted', DISPATCHED: 'bg-blue-500/20 text-blue-400', COMPLETED: 'bg-green-500/20 text-green-400', CANCELLED: 'bg-rose-500/20 text-rose-400' };
        return (
          <div key={s} className="flex items-center gap-1">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[s]}`}>{s}</span>
            {i < STEPS.length - 1 && <span className="text-text-muted text-xs">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function Trips() {
  const qc = useQueryClient();
  const { data: trips = [] }    = useQuery({ queryKey: ['trips'],          queryFn: () => tripsApi.list().then(r => r.data) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles-avail'], queryFn: () => vehiclesApi.available().then(r => r.data) });
  const { data: drivers = [] }  = useQuery({ queryKey: ['drivers-avail'],  queryFn: () => driversApi.available().then(r => r.data) });

  const [form, setForm]                   = useState({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' });
  const [formError, setFormError]         = useState('');
  const [boardError, setBoardError]       = useState('');
  const [completeModal, setCompleteModal] = useState<{ tripId: string } | null>(null);
  const [completeForm, setCompleteForm]   = useState({ finalOdometer: '', fuelConsumed: '' });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['trips'] });
    qc.invalidateQueries({ queryKey: ['vehicles-avail'] });
    qc.invalidateQueries({ queryKey: ['drivers-avail'] });
  };

  const createMut = useMutation({
    mutationFn: () => tripsApi.create({ source: form.source, destination: form.destination, vehicleId: form.vehicleId, driverId: form.driverId, cargoWeight: Number(form.cargoWeight), plannedDist: Number(form.plannedDist), status: 'DRAFT' }),
    onSuccess: () => { setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' }); setFormError(''); invalidate(); },
    onError: (e: any) => setFormError(friendlyError(e)),
  });
  const dispatchMut  = useMutation({ mutationFn: (id: string) => tripsApi.dispatch(id),  onSuccess: invalidate, onError: (e: any) => setBoardError(friendlyError(e)) });
  const cancelMut    = useMutation({ mutationFn: (id: string) => tripsApi.cancel(id),    onSuccess: invalidate, onError: (e: any) => setBoardError(friendlyError(e)) });
  const completeMut  = useMutation({
    mutationFn: ({ id, odometer, fuel }: { id: string; odometer: number; fuel: number }) => tripsApi.complete(id, odometer, fuel),
    onSuccess: () => { setCompleteModal(null); invalidate(); },
    onError: (e: any) => setBoardError(friendlyError(e)),
  });

  const selectedVehicle = vehicles.find((v: Vehicle) => v.id === form.vehicleId);
  const cargo           = Number(form.cargoWeight);
  const exceeded        = selectedVehicle && cargo > 0 && cargo > selectedVehicle.maxLoadKg;
  const canCreate       = form.source && form.destination && form.vehicleId && form.driverId && form.cargoWeight && form.plannedDist && !exceeded;

  return (
    <div className="flex gap-5 h-full min-h-0">
      {/* LEFT — Create form */}
      <div className="w-[42%] shrink-0 flex flex-col gap-4 overflow-y-auto">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Trip Dispatcher</h1>
          <p className="text-text-muted text-xs mt-0.5">Create and manage trip lifecycle</p>
        </div>

        <Stepper />

        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col gap-4">
          <p className="text-text-primary text-sm font-semibold">New Trip</p>
          <ErrorBanner message={formError} />

          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Source</label><input className={inp} value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))} placeholder="Mumbai" /></div>
            <div><label className={lbl}>Destination</label><input className={inp} value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} placeholder="Pune" /></div>
          </div>

          <div>
            <label className={lbl}>Vehicle</label>
            <select value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))} className={inp}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v: Vehicle) => <option key={v.id} value={v.id}>{v.name} ({v.regNumber}) — {v.maxLoadKg} kg</option>)}
            </select>
          </div>

          <div>
            <label className={lbl}>Driver</label>
            <select value={form.driverId} onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))} className={inp}>
              <option value="">Select driver…</option>
              {drivers.map((d: Driver) => <option key={d.id} value={d.id}>{d.name} — Score {d.safetyScore}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={lbl}>Cargo Weight (kg)</label><input type="number" className={inp} value={form.cargoWeight} onChange={e => setForm(f => ({ ...f, cargoWeight: e.target.value }))} placeholder="450" /></div>
            <div><label className={lbl}>Planned Distance (km)</label><input type="number" className={inp} value={form.plannedDist} onChange={e => setForm(f => ({ ...f, plannedDist: e.target.value }))} placeholder="150" /></div>
          </div>

          {exceeded && selectedVehicle && (
            <div className="border border-rose-500/40 bg-rose-500/8 rounded-lg p-3.5 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-text-muted">Vehicle capacity</span><span className="text-text-primary font-medium">{selectedVehicle.maxLoadKg} kg</span></div>
              <div className="flex justify-between"><span className="text-text-muted">Cargo weight</span><span className="text-rose-400 font-medium">{cargo} kg</span></div>
              <div className="border-t border-rose-500/20 pt-1 mt-1">
                <span className="text-rose-400 text-xs font-semibold">✗ Exceeds capacity by {cargo - selectedVehicle.maxLoadKg} kg — dispatch blocked</span>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => createMut.mutate()} disabled={!canCreate || createMut.isPending}
              className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 text-sm font-semibold transition-colors shadow-lg shadow-amber-900/20">
              {createMut.isPending ? 'Creating…' : '⚡ Create Trip'}
            </button>
            <button onClick={() => setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' })}
              className="px-4 border border-border text-text-muted hover:text-text-primary hover:border-border/80 rounded-lg text-sm transition-colors">
              Clear
            </button>
          </div>
        </div>

        <p className="text-text-muted text-xs text-center pb-2">
          On Complete → odometer + fuel logged · vehicle & driver set to Available
        </p>
      </div>

      {/* RIGHT — Live Board */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-text-primary font-semibold">Live Board</p>
          <span className="text-text-muted text-xs">{trips.length} trip{trips.length !== 1 ? 's' : ''}</span>
        </div>
        <ErrorBanner message={boardError} />

        {trips.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-text-muted text-sm">No trips yet. Create one to get started.</p>
          </div>
        )}

        {trips.map((trip: Trip) => (
          <div key={trip.id} className="bg-panel border border-border rounded-lg p-4 hover:border-border/80 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="text-text-primary font-semibold text-sm">{trip.source} → {trip.destination}</p>
                <p className="text-text-muted text-xs mt-0.5 font-mono">{trip.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <StatusBadge status={trip.status} />
            </div>
            <div className="flex gap-4 text-xs text-text-muted mb-3">
              <span>🚛 {trip.vehicle?.name ?? '—'} ({trip.vehicle?.regNumber ?? '—'})</span>
              <span>👤 {trip.driver?.name ?? '—'}</span>
              <span>📦 {trip.cargoWeight} kg</span>
              <span>📍 {trip.plannedDist} km</span>
            </div>
            {(trip.status === 'DRAFT' || trip.status === 'DISPATCHED') && (
              <div className="flex gap-2 pt-2 border-t border-border/50">
                {trip.status === 'DRAFT' && (
                  <button onClick={() => dispatchMut.mutate(trip.id)} disabled={dispatchMut.isPending}
                    className="text-xs px-3 py-1.5 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/20 rounded-lg transition-colors font-medium">
                    ▶ Dispatch
                  </button>
                )}
                {trip.status === 'DISPATCHED' && (
                  <>
                    <button onClick={() => { setCompleteModal({ tripId: trip.id }); setCompleteForm({ finalOdometer: '', fuelConsumed: '' }); }}
                      className="text-xs px-3 py-1.5 bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20 rounded-lg transition-colors font-medium">
                      ✓ Complete
                    </button>
                    <button onClick={() => cancelMut.mutate(trip.id)} disabled={cancelMut.isPending}
                      className="text-xs px-3 py-1.5 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/20 rounded-lg transition-colors font-medium">
                      ✕ Cancel
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Complete modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-panel border border-border rounded-xl p-6 w-80 flex flex-col gap-4 shadow-2xl">
            <div>
              <h3 className="text-text-primary font-semibold">Complete Trip</h3>
              <p className="text-text-muted text-xs mt-0.5">Enter final readings to close this trip</p>
            </div>
            <div><label className={lbl}>Final Odometer (km)</label><input type="number" className={inp} value={completeForm.finalOdometer} onChange={e => setCompleteForm(f => ({ ...f, finalOdometer: e.target.value }))} placeholder="12550" /></div>
            <div><label className={lbl}>Fuel Consumed (L)</label><input type="number" className={inp} value={completeForm.fuelConsumed} onChange={e => setCompleteForm(f => ({ ...f, fuelConsumed: e.target.value }))} placeholder="42" /></div>
            <div className="flex gap-2">
              <button
                onClick={() => completeMut.mutate({ id: completeModal.tripId, odometer: Number(completeForm.finalOdometer), fuel: Number(completeForm.fuelConsumed) })}
                disabled={!completeForm.finalOdometer || !completeForm.fuelConsumed || completeMut.isPending}
                className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-semibold transition-colors">
                {completeMut.isPending ? 'Saving…' : '✓ Confirm'}
              </button>
              <button onClick={() => setCompleteModal(null)} className="px-4 border border-border text-text-muted rounded-lg text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
