import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';

export default function ChangePassword() {
  const { user, clearMustChange } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm]         = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) return setError('Password must be at least 6 characters.');
    if (newPassword !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await http.post('/auth/change-password', { newPassword });
      clearMustChange();
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const inp = 'w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[400px]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-black text-white shadow-lg">T</div>
          <span className="font-bold text-xl text-text-primary tracking-tight">TransitOps</span>
        </div>

        <div className="bg-panel border border-border rounded-xl p-7">
          <div className="mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-400/10 flex items-center justify-center mb-4">
              <span className="text-xl">🔑</span>
            </div>
            <h1 className="text-text-primary text-xl font-bold mb-1">Set your password</h1>
            <p className="text-text-muted text-sm">
              Welcome, <span className="text-text-primary font-medium">{user?.name || user?.email?.split('@')[0]}</span>!
              Your account was created with a temporary password. Please set a new one to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400 text-sm">
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                placeholder="Min. 6 characters"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className={inp}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className={inp}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-semibold text-sm transition-all shadow-lg shadow-amber-900/20 mt-2"
            >
              {loading ? 'Saving…' : 'Set Password & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
