import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, Trip } from '../../api/trips';
import { vehiclesApi, Vehicle } from '../../api/vehicles';
import { driversApi, Driver } from '../../api/drivers';
import StatusBadge from '../../components/StatusBadge';

const STEPS = ['DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'] as const;

const STEP_COLORS: Record<string, string> = {
  DRAFT:      'text-text-muted',
  DISPATCHED: 'text-blue-400',
  COMPLETED:  'text-green-400',
  CANCELLED:  'text-rose-400',
};

function Stepper({ current }: { current: string }) {
  return (
    <div className="flex items-center gap-1 mb-6">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <span className={`text-xs font-medium px-2 py-0.5 rounded ${
            s === current ? 'bg-accent text-white' : 'text-text-muted'
          }`}>{s}</span>
          {i < STEPS.length - 1 && <span className="text-text-muted text-xs">→</span>}
        </div>
      ))}
    </div>
  );
}

interface CompleteModal { tripId: string; }

export default function Trips() {
  const qc = useQueryClient();

  const { data: trips = [] }    = useQuery({ queryKey: ['trips'],            queryFn: () => tripsApi.list().then(r => r.data) });
  const { data: vehicles = [] } = useQuery({ queryKey: ['vehicles-avail'],   queryFn: () => vehiclesApi.available().then(r => r.data) });
  const { data: drivers = [] }  = useQuery({ queryKey: ['drivers-avail'],    queryFn: () => driversApi.available().then(r => r.data) });

  const [form, setForm] = useState({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' });
  const [apiError, setApiError] = useState('');
  const [completeModal, setCompleteModal] = useState<CompleteModal | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: '', fuelConsumed: '' });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['trips'] });
    qc.invalidateQueries({ queryKey: ['vehicles-avail'] });
    qc.invalidateQueries({ queryKey: ['drivers-avail'] });
  };

  const createMut = useMutation({
    mutationFn: () => tripsApi.create({
      source: form.source, destination: form.destination,
      vehicleId: form.vehicleId, driverId: form.driverId,
      cargoWeight: Number(form.cargoWeight), plannedDist: Number(form.plannedDist),
      status: 'DRAFT',
    }),
    onSuccess: () => { setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' }); setApiError(''); invalidate(); },
    onError: (e: any) => setApiError(e?.response?.data?.message ?? 'Error creating trip'),
  });

  const dispatchMut = useMutation({
    mutationFn: (id: string) => tripsApi.dispatch(id),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Dispatch failed'),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => tripsApi.cancel(id),
    onSuccess: invalidate,
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Cancel failed'),
  });

  const completeMut = useMutation({
    mutationFn: ({ id, odometer, fuel }: { id: string; odometer: number; fuel: number }) =>
      tripsApi.complete(id, odometer, fuel),
    onSuccess: () => { setCompleteModal(null); invalidate(); },
    onError: (e: any) => alert(e?.response?.data?.message ?? 'Complete failed'),
  });

  // Capacity validation
  const selectedVehicle: Vehicle | undefined = vehicles.find((v: Vehicle) => v.id === form.vehicleId);
  const cargo = Number(form.cargoWeight);
  const capacityExceeded = selectedVehicle && cargo > 0 && cargo > selectedVehicle.maxLoadKg;

  return (
    <div className="flex gap-6 h-full">
      {/* LEFT — Create form */}
      <div className="w-[45%] shrink-0 flex flex-col gap-4">
        <Stepper current="DRAFT" />

        <div className="bg-panel border border-border rounded-lg p-5 flex flex-col gap-4">
          <h2 className="text-text-primary font-semibold">Create Trip</h2>

          {apiError && (
            <div className="bg-rose-500/10 border border-rose-500/40 text-rose-400 text-sm px-3 py-2 rounded">
              {apiError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Source" value={form.source} onChange={v => setForm(f => ({ ...f, source: v }))} placeholder="Mumbai" />
            <Field label="Destination" value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))} placeholder="Pune" />
          </div>

          {/* Vehicle dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-xs uppercase tracking-wider">Vehicle</label>
            <select
              value={form.vehicleId}
              onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
              className="bg-bg border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select vehicle…</option>
              {vehicles.map((v: Vehicle) => (
                <option key={v.id} value={v.id}>{v.name} ({v.regNumber}) — {v.maxLoadKg} kg capacity</option>
              ))}
            </select>
          </div>

          {/* Driver dropdown */}
          <div className="flex flex-col gap-1">
            <label className="text-text-muted text-xs uppercase tracking-wider">Driver</label>
            <select
              value={form.driverId}
              onChange={e => setForm(f => ({ ...f, driverId: e.target.value }))}
              className="bg-bg border border-border rounded px-3 py-2 text-text-primary focus:outline-none focus:border-accent"
            >
              <option value="">Select driver…</option>
              {drivers.map((d: Driver) => (
                <option key={d.id} value={d.id}>{d.name} — Score {d.safetyScore}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cargo Weight (kg)" type="number" value={form.cargoWeight} onChange={v => setForm(f => ({ ...f, cargoWeight: v }))} placeholder="450" />
            <Field label="Planned Distance (km)" type="number" value={form.plannedDist} onChange={v => setForm(f => ({ ...f, plannedDist: v }))} placeholder="150" />
          </div>

          {/* Capacity exceeded warning */}
          {capacityExceeded && selectedVehicle && (
            <div className="border border-rose-500/50 bg-rose-500/10 rounded p-3 text-sm space-y-0.5">
              <p className="text-text-muted">Vehicle Capacity: <span className="text-text-primary">{selectedVehicle.maxLoadKg} kg</span></p>
              <p className="text-text-muted">Cargo Weight: <span className="text-text-primary">{cargo} kg</span></p>
              <p className="text-rose-400 font-medium">✗ Capacity exceeded by {cargo - selectedVehicle.maxLoadKg} kg — dispatch blocked</p>
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={() => createMut.mutate()}
              disabled={!form.source || !form.destination || !form.vehicleId || !form.driverId || !form.cargoWeight || !form.plannedDist || !!capacityExceeded || createMut.isPending}
              className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded py-2 font-medium transition-colors"
            >
              {createMut.isPending ? 'Creating…' : 'Dispatch'}
            </button>
            <button
              onClick={() => setForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDist: '' })}
              className="px-4 border border-rose-500/50 text-rose-400 hover:bg-rose-500/10 rounded py-2 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

        <p className="text-text-muted text-xs text-center">
          On Complete: odometer + fuel + expense → Vehicle &amp; Driver Available.
        </p>
      </div>

      {/* RIGHT — Live Board */}
      <div className="flex-1 flex flex-col gap-3 overflow-auto">
        <h2 className="text-text-primary font-semibold shrink-0">LIVE BOARD</h2>
        {trips.length === 0 && (
          <p className="text-text-muted text-sm">No trips yet.</p>
        )}
        {trips.map((trip: Trip) => (
          <TripCard
            key={trip.id}
            trip={trip}
            onDispatch={() => dispatchMut.mutate(trip.id)}
            onCancel={() => cancelMut.mutate(trip.id)}
            onComplete={() => { setCompleteModal({ tripId: trip.id }); setCompleteForm({ finalOdometer: '', fuelConsumed: '' }); }}
          />
        ))}
      </div>

      {/* Complete modal */}
      {completeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-panel border border-border rounded-lg p-6 w-80 flex flex-col gap-4">
            <h3 className="text-text-primary font-semibold">Complete Trip</h3>
            <Field label="Final Odometer (km)" type="number" value={completeForm.finalOdometer} onChange={v => setCompleteForm(f => ({ ...f, finalOdometer: v }))} placeholder="12550" />
            <Field label="Fuel Consumed (L)" type="number" value={completeForm.fuelConsumed} onChange={v => setCompleteForm(f => ({ ...f, fuelConsumed: v }))} placeholder="42" />
            <div className="flex gap-2">
              <button
                onClick={() => completeMut.mutate({ id: completeModal.tripId, odometer: Number(completeForm.finalOdometer), fuel: Number(completeForm.fuelConsumed) })}
                disabled={!completeForm.finalOdometer || !completeForm.fuelConsumed || completeMut.isPending}
                className="flex-1 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded py-2 font-medium transition-colors"
              >
                {completeMut.isPending ? 'Saving…' : 'Confirm'}
              </button>
              <button onClick={() => setCompleteModal(null)} className="px-4 border border-border text-text-muted rounded py-2 text-sm hover:bg-white/5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TripCard({ trip, onDispatch, onCancel, onComplete }: {
  trip: Trip;
  onDispatch: () => void;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="bg-panel border border-border rounded-lg p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-text-primary font-medium">{trip.source} → {trip.destination}</span>
        <StatusBadge status={trip.status} />
      </div>
      <div className="flex gap-4 text-xs text-text-muted">
        <span>🚛 {trip.vehicle?.name ?? trip.vehicleId}</span>
        <span>👤 {trip.driver?.name ?? trip.driverId}</span>
        <span>{trip.cargoWeight} kg · {trip.plannedDist} km</span>
      </div>
      <div className="flex gap-2 mt-1">
        {trip.status === 'DRAFT' && (
          <button onClick={onDispatch} className="text-xs px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded transition-colors">
            Dispatch
          </button>
        )}
        {trip.status === 'DISPATCHED' && (
          <>
            <button onClick={onComplete} className="text-xs px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors">
              Complete
            </button>
            <button onClick={onCancel} className="text-xs px-3 py-1 bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 rounded transition-colors">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-text-muted text-xs uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-bg border border-border rounded px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
      />
    </div>
  );
}
