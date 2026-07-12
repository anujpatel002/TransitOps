import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';

const NAV = [
  { to: '/dashboard',       label: 'Dashboard',      resource: 'dashboard',       icon: '▦'  },
  { to: '/admin-dashboard', label: 'Overview',        resource: 'admin-dashboard', icon: '▦'  },
  { to: '/fleet',           label: 'Fleet',           resource: 'fleet',           icon: '🚛' },
  { to: '/drivers',         label: 'Drivers',         resource: 'drivers',         icon: '👤' },
  { to: '/trips',           label: 'Trips',           resource: 'trips',           icon: '🗺' },
  { to: '/maintenance',     label: 'Maintenance',     resource: 'maintenance',     icon: '🔧' },
  { to: '/fuel-expenses',   label: 'Fuel & Expenses', resource: 'fuel-expenses',   icon: '⛽' },
  { to: '/analytics',       label: 'Analytics',       resource: 'analytics',       icon: '📊' },
  { to: '/admin-analytics', label: 'Analytics',       resource: 'admin-analytics', icon: '📊' },
  { to: '/settings',        label: 'Settings',        resource: 'settings',        icon: '⚙'  },
  { to: '/admin-settings',  label: 'Manage',          resource: 'admin-settings',  icon: '⚙'  },
];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:             'text-rose-400',
  FLEET_MANAGER:     'text-amber-400',
  DISPATCHER:        'text-blue-400',
  SAFETY_OFFICER:    'text-green-400',
  FINANCIAL_ANALYST: 'text-purple-400',
};

export default function Sidebar() {
  const { can, user } = useAuth();
  const location = useLocation();
  const visible = NAV.filter(n => can(n.resource));

  return (
    <aside className="w-[220px] shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-black text-white text-sm shadow-lg shadow-amber-900/30">T</div>
        <div>
          <p className="text-text-primary font-bold text-sm tracking-wide leading-none">TransitOps</p>
          <p className="text-text-muted text-[10px] mt-0.5">Fleet Management</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3 py-3 overflow-y-auto">
        {visible.map(({ to, label, icon }) => {
          const active = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-accent/15 text-accent border-l-2 border-accent pl-[10px]'
                  : 'text-text-muted hover:text-text-primary hover:bg-black/[0.04]'
              }`}
            >
              <span className="text-base leading-none w-5 text-center">{icon}</span>
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* User card */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-black/[0.05] border border-border">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs shrink-0">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-text-primary text-xs font-medium truncate">{user?.email?.split('@')[0]}</p>
            <p className={`text-[10px] font-medium ${ROLE_COLORS[user?.role ?? ''] ?? 'text-text-muted'}`}>
              {user?.role?.replace(/_/g, ' ')}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
