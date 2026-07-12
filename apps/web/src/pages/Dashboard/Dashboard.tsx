import { useEffect, useState } from 'react';
import { dashboardApi, KPIs } from '../../api/dashboard';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const VEHICLE_TYPES = ['All', 'Truck', 'Van', 'Mini'];
const STATUSES      = ['All', 'AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];
const REGIONS       = ['All', 'Mumbai', 'Pune', 'Delhi', 'Nashik', 'Surat'];

const KPI_DEFS = [
  { key: 'activeVehicles',    label: 'Active Vehicles',   accent: 'border-t-green-500',  value_color: 'text-green-400'  },
  { key: 'availableVehicles', label: 'Available Now',     accent: 'border-t-green-500',  value_color: 'text-green-400'  },
  { key: 'onTrip',            label: 'On Trip',           accent: 'border-t-blue-500',   value_color: 'text-blue-400'   },
  { key: 'inMaintenance',     label: 'In Maintenance',    accent: 'border-t-amber-500',  value_color: 'text-amber-400'  },
  { key: 'activeTrips',       label: 'Active Trips',      accent: 'border-t-blue-500',   value_color: 'text-blue-400'   },
  { key: 'driversOnDuty',     label: 'Drivers On Duty',   accent: 'border-t-purple-500', value_color: 'text-purple-400' },
  { key: 'fleetUtilization',  label: 'Fleet Utilization', accent: 'border-t-accent',     value_color: 'text-accent',    suffix: '%' as const },
] as const;

function StatusBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-text-muted">{label}</span>
        <span className="text-text-primary font-medium">{count} <span className="text-text-muted font-normal">({pct}%)</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

const selectCls = 'bg-panel border border-border text-text-primary text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-accent transition-colors';

export default function Dashboard() {
  const [kpis, setKpis]       = useState<KPIs | null>(null);
  const [trips, setTrips]     = useState<any[]>([]);
  const [filters, setFilters] = useState({ type: 'All', status: 'All', region: 'All' });
  const [error, setError]     = useState('');

  useEffect(() => {
    const params = {
      type:   filters.type   !== 'All' ? filters.type   : undefined,
      status: filters.status !== 'All' ? filters.status : undefined,
      region: filters.region !== 'All' ? filters.region : undefined,
    };
    setError('');
    Promise.all([
      dashboardApi.kpis(params).then(r => setKpis(r.data)),
      dashboardApi.recentTrips().then(r => setTrips(r.data)),
    ]).catch(err => setError(friendlyError(err)));
  }, [filters.type, filters.status, filters.region]);

  const setFilter = (k: keyof typeof filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilters(f => ({ ...f, [k]: e.target.value }));

  return (
    <div className="flex flex-col gap-5">
      <ErrorBanner message={error} />

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-text-muted text-xs mr-1">Filter:</span>
        {([['type', VEHICLE_TYPES, 'Type'], ['status', STATUSES, 'Status'], ['region', REGIONS, 'Region']] as const).map(
          ([key, opts, label]) => (
            <select key={key} value={filters[key]} onChange={setFilter(key)} className={selectCls}>
              <option value="All">{label}: All</option>
              {opts.filter(o => o !== 'All').map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          )
        )}
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-7 gap-3">
        {KPI_DEFS.map(({ key, label, accent, value_color, ...rest }) => (
          <div key={key} className={`bg-panel border border-border border-t-2 ${accent} rounded-lg p-4`}>
            <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider leading-none mb-2">{label}</p>
            <p className={`text-2xl font-bold ${kpis ? value_color : 'text-text-muted'}`}>
              {kpis ? `${String(kpis[key]).padStart(2, '0')}${'suffix' in rest ? rest.suffix : ''}` : '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="flex gap-4 min-h-0">
        {/* Recent Trips */}
        <div className="flex-[65] bg-panel border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <span className="text-text-primary text-sm font-semibold">Recent Trips</span>
            <span className="text-text-muted text-xs">{trips.length} records</span>
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-white/[0.01]">
                  {['Trip ID', 'Route', 'Vehicle', 'Driver', 'Status'].map(h => (
                    <th key={h} className="text-left text-text-muted text-xs px-5 py-2.5 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trips.length === 0 && (
                  <tr><td colSpan={5} className="text-text-muted text-xs px-5 py-8 text-center">No trips yet</td></tr>
                )}
                {trips.map(t => (
                  <tr key={t.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-text-muted font-mono text-xs">{t.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3 text-text-primary text-xs">{t.source} → {t.destination}</td>
                    <td className="px-5 py-3 text-text-muted text-xs">{t.vehicle?.regNumber ?? '—'}</td>
                    <td className="px-5 py-3 text-text-muted text-xs">{t.driver?.name ?? '—'}</td>
                    <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status */}
        <div className="flex-[35] bg-panel border border-border rounded-lg p-5 flex flex-col">
          <p className="text-text-primary text-sm font-semibold mb-5">Fleet Status</p>
          {kpis ? (
            <>
              <StatusBar label="Available" count={kpis.availableVehicles} total={kpis.total} color="bg-green-500" />
              <StatusBar label="On Trip"   count={kpis.onTrip}            total={kpis.total} color="bg-blue-500"  />
              <StatusBar label="In Shop"   count={kpis.inMaintenance}     total={kpis.total} color="bg-amber-500" />
              <StatusBar label="Retired"   count={kpis.retired}           total={kpis.total} color="bg-rose-500"  />
              <div className="mt-auto pt-4 border-t border-border">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Total Fleet</span>
                  <span className="text-text-primary font-semibold">{kpis.total} vehicles</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-text-muted text-xs">Loading…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
