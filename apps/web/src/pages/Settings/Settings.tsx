import { useState } from 'react';

const RBAC = [
  { role: 'Fleet Manager',     fleet: '✓',    drivers: '✓',    trips: '–',    fuel: '✓',    analytics: '✓'    },
  { role: 'Dispatcher',        fleet: 'View', drivers: '–',    trips: '✓',    fuel: '–',    analytics: '–'    },
  { role: 'Safety Officer',    fleet: '–',    drivers: '✓',    trips: 'View', fuel: '–',    analytics: '–'    },
  { role: 'Financial Analyst', fleet: 'View', drivers: '–',    trips: '–',    fuel: '✓',    analytics: '✓'    },
];

const COLS = ['Role', 'Fleet', 'Drivers', 'Trips', 'Fuel/Exp', 'Analytics'] as const;

function cellStyle(val: string) {
  if (val === '✓') return 'text-green-400';
  if (val === 'View') return 'text-blue-400';
  return 'text-text-muted';
}

export default function Settings() {
  const [form, setForm] = useState({ depot: 'Mumbai Central Depot', currency: 'INR', distUnit: 'km' });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div>
      <h1 className="text-text-primary text-xl font-semibold mb-6">SETTINGS &amp; RBAC</h1>

      <div className="flex gap-6">
        {/* General — 30% */}
        <div className="w-[30%] shrink-0 bg-panel border border-border rounded-lg p-5">
          <p className="text-text-primary text-sm font-semibold tracking-wide mb-4">GENERAL</p>

          <label className="block mb-4">
            <span className="text-text-muted text-xs block mb-1">Depot Name</span>
            <input
              value={form.depot}
              onChange={set('depot')}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-blue-500"
            />
          </label>

          <label className="block mb-4">
            <span className="text-text-muted text-xs block mb-1">Currency</span>
            <select
              value={form.currency}
              onChange={set('currency')}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </label>

          <label className="block mb-6">
            <span className="text-text-muted text-xs block mb-1">Distance Unit</span>
            <select
              value={form.distUnit}
              onChange={set('distUnit')}
              className="w-full bg-bg border border-border rounded px-3 py-2 text-text-primary text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="km">Kilometres (km)</option>
              <option value="mi">Miles (mi)</option>
            </select>
          </label>

          <button
            onClick={() => alert('Settings saved (demo)')}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Save Changes
          </button>
        </div>

        {/* RBAC matrix — 70% */}
        <div className="flex-1 bg-panel border border-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-border">
            <p className="text-text-primary text-sm font-semibold tracking-wide">ROLE-BASED ACCESS (RBAC)</p>
            <p className="text-text-muted text-xs mt-0.5">Read-only reference — mirrors server-side permission matrix</p>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {COLS.map(c => (
                  <th key={c} className="text-left text-text-muted text-xs px-5 py-3 font-medium">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC.map(row => (
                <tr key={row.role} className="border-b border-border/50 hover:bg-white/[0.02]">
                  <td className="px-5 py-3 text-text-primary font-medium">{row.role}</td>
                  {(['fleet', 'drivers', 'trips', 'fuel', 'analytics'] as const).map(col => (
                    <td key={col} className={`px-5 py-3 font-medium ${cellStyle(row[col])}`}>
                      {row[col]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-5 py-3 border-t border-border flex gap-5">
            {[['✓', 'text-green-400', 'Full access'], ['View', 'text-blue-400', 'Read-only'], ['–', 'text-text-muted', 'No access']].map(([sym, cls, label]) => (
              <span key={sym} className="flex items-center gap-1.5 text-xs text-text-muted">
                <span className={`font-semibold ${cls}`}>{sym}</span> {label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
