import { useEffect, useState } from 'react';
import { dashboardApi, KPIs } from '../../api/dashboard';
import StatusBadge from '../../components/StatusBadge';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

const KPI_DEFS = [
  { key: 'totalOrgs',        label: 'Organizations',    accent: 'border-t-rose-500',   value_color: 'text-rose-400'   },
  { key: 'totalUsers',       label: 'Total Users',      accent: 'border-t-rose-500',   value_color: 'text-rose-400'   },
  { key: 'activeVehicles',   label: 'Active Vehicles',  accent: 'border-t-green-500',  value_color: 'text-green-400'  },
  { key: 'activeTrips',      label: 'Active Trips',     accent: 'border-t-blue-500',   value_color: 'text-blue-400'   },
  { key: 'driversOnDuty',    label: 'Drivers On Duty',  accent: 'border-t-purple-500', value_color: 'text-purple-400' },
  { key: 'inMaintenance',    label: 'In Maintenance',   accent: 'border-t-amber-500',  value_color: 'text-amber-400'  },
  { key: 'fleetUtilization', label: 'Fleet Utilization',accent: 'border-t-accent',     value_color: 'text-accent',    suffix: '%' as const },
] as const;

export default function AdminDashboard() {
  const [kpis, setKpis]   = useState<KPIs | null>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      dashboardApi.kpis().then(r => setKpis(r.data)),
      dashboardApi.recentTrips().then(r => setTrips(r.data)),
    ]).catch(err => setError(friendlyError(err)));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-text-primary text-lg font-semibold">Platform Overview</h1>
        <p className="text-text-muted text-xs mt-0.5">Global metrics across all organizations</p>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-7 gap-3">
        {KPI_DEFS.map(({ key, label, accent, value_color, ...rest }) => (
          <div key={key} className={`bg-panel border border-border border-t-2 ${accent} rounded-lg p-4`}>
            <p className="text-text-muted text-[10px] font-medium uppercase tracking-wider leading-none mb-2">{label}</p>
            <p className={`text-2xl font-bold ${kpis ? value_color : 'text-text-muted'}`}>
              {kpis ? `${kpis[key] ?? '—'}${'suffix' in rest ? rest.suffix : ''}` : '—'}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
          <span className="text-text-primary text-sm font-semibold">Recent Trips — All Organizations</span>
          <span className="text-text-muted text-xs">{trips.length} records</span>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-white/[0.01]">
                {['Trip ID', 'Route', 'Vehicle', 'Driver', 'Organization', 'Status'].map(h => (
                  <th key={h} className="text-left text-text-muted text-xs px-5 py-2.5 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 && (
                <tr><td colSpan={6} className="text-text-muted text-xs px-5 py-8 text-center">No trips yet</td></tr>
              )}
              {trips.map(t => (
                <tr key={t.id} className="border-b border-border/40 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3 text-text-muted font-mono text-xs">{t.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-5 py-3 text-text-primary text-xs">{t.source} → {t.destination}</td>
                  <td className="px-5 py-3 text-text-muted text-xs">{t.vehicle?.regNumber ?? '—'}</td>
                  <td className="px-5 py-3 text-text-muted text-xs">{t.driver?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-xs"><span className="text-rose-400 font-medium">{t.vehicle?.org?.name ?? '—'}</span></td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
