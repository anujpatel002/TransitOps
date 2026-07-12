import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/fleet', label: 'Fleet' },
  { to: '/drivers', label: 'Drivers' },
  { to: '/trips', label: 'Trips' },
  { to: '/maintenance', label: 'Maintenance' },
  { to: '/fuel-expenses', label: 'Fuel & Expenses' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/settings', label: 'Settings' },
];

export default function Sidebar() {
  return (
    <aside className="w-[200px] shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Wordmark */}
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="w-6 h-6 rounded bg-accent flex items-center justify-center text-xs font-bold text-white">T</span>
        <span className="text-text-primary font-semibold tracking-wide">TransitOps</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded text-sm transition-colors ${
                isActive
                  ? 'border-l-[3px] border-accent text-text-primary bg-white/5 pl-[9px]'
                  : 'text-text-muted hover:text-text-primary hover:bg-white/5'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
