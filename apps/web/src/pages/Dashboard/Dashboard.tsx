import { useEffect, useState } from 'react';
import { dashboardApi, KPIs } from '../../api/dashboard';
import StatusBadge from '../../components/StatusBadge';

const VEHICLE_TYPES = ['All', 'Truck', 'Van', 'Mini'];
const STATUSES = ['All', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const REGIONS = ['All', 'Mumbai', 'Pune', 'Delhi', 'Nashik', 'Surat'];

interface KpiDef {
  key: keyof KPIs;
  label: string;
  color: string;
  suffix?: string;
}

const KPI_DEFS: KpiDef[] = [
  { key: 'activeVehicles',    label: 'ACTIVE VEHICLES',        color: 'border-green-500' },
  { key: 'availableVehicles', label: 'AVAILABLE VEHICLES',     color: 'border-green-500' },
  { key: 'inMaintenance',     label: 'VEHICLES IN MAINTENANCE',color: 'border-amber-500' },
  { key: 'activeTrips',       label: 'ACTIVE TRIPS',           color: 'border-blue-500'  },
  { key: 'pendingTrips',      label: 'PENDING TRIPS',          color: 'border-blue-500'  },
  { key: 'driversOnDuty',     label: 'DRIVERS ON DUTY',        color: 'border-blue-500'  },
  { key: 'fleetUtilization',  label: 'FLEET UTILIZATION',      color: 'border-green-500', suffix: '%' },
];

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary">{count} <span className="text-text-muted">({pct}%)</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: '', status: '', region: '' });

  useEffect(() => {
    const params = {
      type:   filters.type   !== 'All' ? filters.type   : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      region: filters.region !== 'All' ? filters.region : undefined,
    };
    dashboardApi.kpis(params).then(r => setKpis(r.data));
    dashboardApi.recentTrips().then(r => setTrips(r.data));
  }, [filters.type, filters.status, filters.region]);

  const setFilter = (k: keyof typeof filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      {/* Filter row */}
      <div className="flex gap-3 mb-6">
        {([['type', VEHICLE_TYPES, 'VEHICLE TYPE'], ['status', STATUSES, 'STATUS'], ['region', REGIONS, 'REGION']] as const).map(
          ([key, opts, placeholder]) => (
            <select
              key={key}
              value={filters[key] || 'All'}
              onChange={setFilter(key)}
              className="bg-panel border border-border text-text-primary text-sm rounded px-3 py-1.5 focus:outline-none focus:border-accent"
            >
              <option value="All">{placeholder}: All</option>
              {opts.filter(o => o !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-7 gap-3 mb-6">
        {KPI_DEFS.map(({ key, label, color, suffix }) => (
          <div key={key} className={`bg-panel border border-border border-l-4 ${color} rounded-lg p-4`}>
            <p className="text-text-muted text-[10px] font-medium tracking-wide leading-tight mb-2">{label}</p>
            <p className="text-text-primary text-2xl font-bold">
              {kpis ? String(kpis[key]).padStart(2, '0') : '—'}{suffix ?? ''}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom two-column */}
      <div className="flex gap-4">
        {/* Recent Trips — 65% */}
        <div className="flex-[65] bg-panel border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <span className="text-text-primary text-sm font-semibold tracking-wide">RECENT TRIPS</span>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['TRIP', 'VEHICLE', 'DRIVER', 'STATUS', 'ETA'].map(h => (
                  <th key={h} className="text-left text-text-muted text-xs px-4 py-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 && (
                <tr><td colSpan={5} className="text-text-muted text-xs px-4 py-4 text-center">No trips</td></tr>
              )}
              {trips.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-text-primary font-mono text-xs">{t.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-2.5 text-text-muted">{t.vehicle?.regNumber ?? '—'}</td>
                  <td className="px-4 py-2.5 text-text-muted">{t.driver?.name ?? '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={t.status} /></td>
                  <td className="px-4 py-2.5 text-text-muted text-xs">
                    {t.status === 'DISPATCHED' ? `${t.destination}` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Vehicle Status — 35% */}
        <div className="flex-[35] bg-panel border border-border rounded-lg p-4">
          <p className="text-text-primary text-sm font-semibold tracking-wide mb-4">VEHICLE STATUS</p>
          {kpis ? (
            <>
              <StatusBar label="Available" count={kpis.availableVehicles} total={kpis.total} color="bg-green-500" />
              <StatusBar label="On Trip"   count={kpis.onTrip}            total={kpis.total} color="bg-blue-500"  />
              <StatusBar label="In Shop"   count={kpis.inMaintenance}     total={kpis.total} color="bg-amber-500" />
              <StatusBar label="Retired"   count={kpis.retired}           total={kpis.total} color="bg-rose-500"  />
            </>
          ) : (
            <p className="text-text-muted text-xs">Loading…</p>
          )}
        </div>
      </div>
    </div>
  );
}
