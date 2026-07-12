import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { reportsApi } from '../../api/reports';
import ErrorBanner from '../../components/ErrorBanner';
import { friendlyError } from '../../lib/friendlyError';

type OrgBreakdown = { name: string; fuelCost: number; maintCost: number; revenue: number; totalCost: number };

const tooltipStyle = {
  contentStyle: { background: '#141414', border: '1px solid #262626', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#F5F5F5' },
};

const KPI_DEFS = [
  { key: 'avgKmL',      label: 'Avg Fuel Efficiency', fmt: (v: number) => `${v} km/L`,              accent: 'border-t-blue-500',  color: 'text-blue-400'  },
  { key: 'utilization', label: 'Fleet Utilization',   fmt: (v: number) => `${v}%`,                  accent: 'border-t-green-500', color: 'text-green-400' },
  { key: 'totalCost',   label: 'Total Platform Cost', fmt: (v: number) => `₹${v.toLocaleString()}`, accent: 'border-t-amber-500', color: 'text-amber-400' },
  { key: 'avgRoi',      label: 'Avg Vehicle ROI',     fmt: (v: number) => `${v}%`,                  accent: 'border-t-accent',    color: 'text-accent'    },
] as const;

export default function AdminAnalytics() {
  const [summary, setSummary]           = useState<any | null>(null);
  const [monthly, setMonthly]           = useState<{ month: string; revenue: number }[]>([]);
  const [orgBreakdown, setOrgBreakdown] = useState<OrgBreakdown[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    Promise.all([reportsApi.summary(), reportsApi.monthlyRevenue(), reportsApi.orgBreakdown()])
      .then(([s, m, ob]) => { setSummary(s.data); setMonthly(m.data); setOrgBreakdown(ob.data); })
      .catch(err => setError(friendlyError(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-lg font-semibold">Platform Analytics</h1>
          <p className="text-text-muted text-xs mt-0.5">Cross-organization performance and financial overview</p>
        </div>
        <button onClick={reportsApi.exportCsv} className="border border-border text-text-muted hover:text-text-primary text-sm px-4 py-2 rounded-lg transition-colors">
          ↓ Export CSV
        </button>
      </div>

      <ErrorBanner message={error} />

      <div className="grid grid-cols-4 gap-3">
        {KPI_DEFS.map(({ key, label, fmt, accent, color }) => (
          <div key={key} className={`bg-panel border border-border border-t-2 ${accent} rounded-lg p-4`}>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-2">{label}</p>
            <p className={`text-2xl font-bold ${loading || !summary ? 'text-text-muted' : color}`}>
              {loading || !summary ? '—' : fmt(summary[key])}
            </p>
          </div>
        ))}
      </div>

      {/* Org Breakdown */}
      <div className="bg-panel border border-border rounded-lg p-5">
        <p className="text-text-primary text-sm font-semibold mb-1">Organization Breakdown</p>
        <p className="text-text-muted text-xs mb-4">Revenue vs operational cost per organization</p>
        {loading ? (
          <div className="h-[240px] flex items-center justify-center"><p className="text-text-muted text-sm">Loading…</p></div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={orgBreakdown} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => [`₹${v.toLocaleString()}`, name]} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#8A8A8A' }} />
              <Bar dataKey="revenue"   name="Revenue"    fill="#68d391" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fuelCost"  name="Fuel Cost"  fill="#ed8936" radius={[4, 4, 0, 0]} />
              <Bar dataKey="maintCost" name="Maint Cost" fill="#e53e3e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Revenue */}
      <div className="bg-panel border border-border rounded-lg p-5">
        <p className="text-text-primary text-sm font-semibold mb-4">Monthly Revenue — All Orgs</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthly} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8A8A8A', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip {...tooltipStyle} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
            <Bar dataKey="revenue" fill="#D68910" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
