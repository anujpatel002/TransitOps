import { useAuth } from '../lib/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 shrink-0 border-b border-border bg-panel flex items-center justify-between px-6">
      <input
        type="search"
        placeholder="Search..."
        className="bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent w-64"
      />
      <div className="flex items-center gap-3">
        <span className="text-sm text-text-primary">{user?.email}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent font-medium">
          {user?.role?.replace('_', ' ')}
        </span>
        <button onClick={logout} className="text-xs text-text-muted hover:text-text-primary transition-colors">
          Logout
        </button>
      </div>
    </header>
  );
}
