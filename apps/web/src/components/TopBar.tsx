import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { useTheme } from '../lib/ThemeContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/fleet':         'Vehicle Registry',
  '/drivers':       'Drivers & Safety',
  '/trips':         'Trip Dispatcher',
  '/maintenance':   'Maintenance',
  '/fuel-expenses': 'Fuel & Expenses',
  '/analytics':     'Analytics & Reports',
  '/settings':      'Settings',
};

const ROLE_STYLES: Record<string, string> = {
  ADMIN:             'bg-rose-400/10 text-rose-400 border border-rose-400/20',
  FLEET_MANAGER:     'bg-amber-400/10 text-amber-400 border border-amber-400/20',
  DISPATCHER:        'bg-blue-400/10 text-blue-400 border border-blue-400/20',
  SAFETY_OFFICER:    'bg-green-400/10 text-green-400 border border-green-400/20',
  FINANCIAL_ANALYST: 'bg-purple-400/10 text-purple-400 border border-purple-400/20',
};

export default function TopBar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] ?? 'TransitOps';

  return (
    <header className="h-14 shrink-0 border-b border-border bg-panel flex items-center justify-between px-6 gap-4">
      <h1 className="text-text-primary font-semibold text-base tracking-wide">{title}</h1>

      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-xs">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-text-primary hidden sm:block">{user?.email?.split('@')[0]}</span>
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${ROLE_STYLES[user?.role ?? ''] ?? 'bg-white/5 text-text-muted'}`}>
            {user?.role?.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="w-px h-5 bg-border" />

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/[0.06] transition-all"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-border" />

        <button
          onClick={logout}
          className="text-xs text-text-muted hover:text-rose-400 transition-colors flex items-center gap-1"
        >
          <span>↩</span> Sign out
        </button>
      </div>
    </header>
  );
}
