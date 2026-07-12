import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { reportsApi } from '../../api/reports';

interface Summary {
  avgKmL: number;
  utilization: number;
  totalCost: number;
  avgRoi: number;
  cost: { regNumber: string; name: string; totalCost: number }[];
}

const KPI_DEFS = [
  { key: 'avgKmL',       label: 'FUEL EFFICIENCY',   color: 'border-blue-500',   fmt: (v: number) => `${v} km/l` },
  { key: 'utilization',  label: 'FLEET UTILIZATION',  color: 'border-green-500',  fmt: (v: number) => `${v}%`     },
  { key: 'totalCost',    label: 'OPERATIONAL COST',   color: 'border-amber-500',  fmt: (v: number) => `₹${v.toLocaleString()}` },
  { key: 'avgRoi',       label: 'VEHICLE ROI',        color: 'border-green-500',  fmt: (v: number) => `${v}%`     },
] as const;

const COST_COLORS = ['#e53e3e', '#ed8936', '#4299e1', '#68d391', '#9f7aea'];

export default function Analytics() {
  const [summary, setSummary]   = useState<Summary | null>(null);
  const [monthly, setMonthly]   = useState<{ month: string; revenue: number }[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([reportsApi.summary(), reportsApi.monthlyRevenue()])
      .then(([s, m]) => { setSummary(s.data); setMonthly(m.data); })
      .finally(() => setLoading(false));
  }, []);

  const topCostly = summary
    ? [...summary.cost].sort((a, b) => b.totalCost - a.totalCost).slice(0, 5)
    : [];

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-text-primary text-xl font-semibold">REPORTS &amp; ANALYTICS</h1>
        <button
          onClick={reportsApi.exportCsv}
          className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-2">
        {KPI_DEFS.map(({ key, label, color, fmt }) => (
          <div key={key} className={`bg-panel border border-border border-l-4 ${color} rounded-lg p-4`}>
            <p className="text-text-muted text-[10px] font-medium tracking-wide mb-2">{label}</p>
            <p className="text-text-primary text-2xl font-bold">
              {loading || !summary ? '—' : fmt(summary[key] as number)}
            </p>
          </div>
        ))}
      </div>

      {/* ROI formula hint */}
      <p className="text-text-muted text-xs mb-6">
        ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost &nbsp;·&nbsp; Revenue = ₹15 × km per completed trip
      </p>

      {/* Charts row */}
      <div className="flex gap-4">
        {/* Monthly Revenue — 55% */}
        <div className="flex-[55] bg-panel border border-border rounded-lg p-4">
          <p className="text-text-primary text-sm font-semibold tracking-wide mb-4">MONTHLY REVENUE</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly} barCategoryGap="30%">
              <XAxis dataKey="month" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#141414', border: '1px solid #262626', borderRadius: 6 }}
                labelStyle={{ color: '#F5F5F5', fontSize: 12 }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#4A7FA5" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Costliest Vehicles — 45% */}
        <div className="flex-[45] bg-panel border border-border rounded-lg p-4">
          <p className="text-text-primary text-sm font-semibold tracking-wide mb-4">TOP COSTLIEST VEHICLES</p>
          {loading ? (
            <p className="text-text-muted text-xs">Loading…</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topCostly} layout="vertical" barCategoryGap="25%">
                <XAxis type="number" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="regNumber" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip
                  contentStyle={{ background: '#141414', border: '1px solid #262626', borderRadius: 6 }}
                  labelStyle={{ color: '#F5F5F5', fontSize: 12 }}
                  formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Total Cost']}
                />
                <Bar dataKey="totalCost" radius={[0, 3, 3, 0]}>
                  {topCostly.map((_, i) => (
                    <Cell key={i} fill={COST_COLORS[i % COST_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
