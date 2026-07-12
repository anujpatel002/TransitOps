import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { reportsApi } from '../../api/reports';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

interface Summary {
  avgKmL: number; utilization: number; totalCost: number; avgRoi: number;
  cost: { regNumber: string; name: string; totalCost: number }[];
}

const KPI_DEFS = [
  { key: 'avgKmL',      label: 'Fuel Efficiency',   fmt: (v: number) => `${v} km/L`,              accent: 'border-t-blue-500',   color: 'text-blue-400'   },
  { key: 'utilization', label: 'Fleet Utilization',  fmt: (v: number) => `${v}%`,                  accent: 'border-t-green-500',  color: 'text-green-400'  },
  { key: 'totalCost',   label: 'Operational Cost',   fmt: (v: number) => `₹${v.toLocaleString()}`, accent: 'border-t-amber-500',  color: 'text-amber-400'  },
  { key: 'avgRoi',      label: 'Avg Vehicle ROI',    fmt: (v: number) => `${v}%`,                  accent: 'border-t-accent',     color: 'text-accent'     },
] as const;

const CHART_COLORS = ['#e53e3e', '#ed8936', '#4299e1', '#68d391', '#9f7aea'];

const tooltipStyle = { contentStyle: { background: '#141414', border: '1px solid #262626', borderRadius: 8, fontSize: 12 }, labelStyle: { color: '#F5F5F5' } };

export default function Analytics() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [monthly, setMonthly] = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([reportsApi.summary(), reportsApi.monthlyRevenue()])
      .then(([s, m]) => { setSummary(s.data); setMonthly(m.data); })
      .catch(err => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  const topCostly = summary ? [...summary.cost].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5) : [];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Analytics & Reports</h1>
          <p className="text-text-muted text-xs mt-0.5">Fleet performance metrics and financial overview</p>
        </div>
        <button onClick={reportsApi.exportCsv} className="border border-border text-text-muted hover:text-text-primary text-sm px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
          ↓ Export CSV
        </button>
      </div>

      <ErrorBanner message={error} />

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-3">
        {KPI_DEFS.map(({ key, label, fmt, accent, color }) => (
          <div key={key} className={`bg-panel border border-border border-t-2 ${accent} rounded-lg p-4`}>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${loading || !summary ? 'text-text-muted' : color}`}>
              {loading || !summary ? '—' : fmt(summary[key] as number)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-text-muted text-xs">
        ROI = (Revenue − Maintenance − Fuel) ÷ Acquisition Cost &nbsp;·&nbsp; Revenue = ₹15 × km per completed trip
      </p>

      {/* Charts */}
      <div className="flex gap-4">
        {/* Monthly Revenue */}
        <div className="flex-[55] bg-panel border border-border rounded-lg p-5">
          <p className="text-text-primary text-sm font-semibold mb-4">Monthly Revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#D68910" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Costliest */}
        <div className="flex-[45] bg-panel border border-border rounded-lg p-5">
          <p className="text-text-primary text-sm font-semibold mb-4">Top Costliest Vehicles</p>
          {loading ? (
            <div className="h-[220px] flex items-center justify-center"><p className="text-text-muted text-sm">Loading…</p></div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCostly} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="regNumber" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Total Cost']} />
                <Bar dataKey="totalCost" radius={[0, 4, 4, 0]}>
                  {topCostly.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
