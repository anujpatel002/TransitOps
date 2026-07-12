import { useState } from 'react';
import { Link } from 'react-router-dom';
import http from '../../lib/http';

const inp = 'w-full bg-panel border border-border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all disabled:opacity-40';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', orgName: '', password: '', confirm: '' });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      await http.post('/registration-requests', {
        name: form.name,
        email: form.email,
        orgName: form.orgName,
        password: form.password,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Left panel */}
      <div className="hidden lg:flex w-[440px] shrink-0 flex-col justify-between p-10 relative overflow-hidden" style={{ background: '#F5F1EA' }}>
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ background: '#D68910' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ background: '#D68910' }} />

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-black text-white shadow-lg">T</div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">TransitOps</span>
          </div>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Fleet Operations Platform</p>
          <h2 className="text-3xl font-bold text-gray-900 leading-tight mb-3">
            Request Access<br />to TransitOps
          </h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Submit your company details to request a Fleet Manager account. An administrator will review and approve your request.
          </p>

          <div className="space-y-3">
            {[
              { step: '1', label: 'Fill in your details', desc: 'Name, company, email & password' },
              { step: '2', label: 'Admin reviews request', desc: 'Usually within 24 hours' },
              { step: '3', label: 'Your org is created', desc: 'Log in as Fleet Manager' },
            ].map(({ step, label, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-400/20 flex items-center justify-center text-amber-600 font-bold text-xs shrink-0 mt-0.5">{step}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-gray-400 text-xs relative">TRANSITOPS © 2026 · ADMIN-CONTROLLED ACCESS</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center font-black text-white text-sm">T</div>
            <span className="font-bold text-lg text-text-primary">TransitOps</span>
          </div>

          {success ? (
            <div className="bg-panel border border-border rounded-xl p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-text-primary text-xl font-bold mb-2">Request Submitted!</h2>
              <p className="text-text-muted text-sm mb-6 leading-relaxed">
                Your registration request has been sent to the administrator for review. You'll be able to log in once it's approved.
              </p>
              <Link to="/login" className="inline-block w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-semibold transition-colors text-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-text-primary mb-1">Create an account</h1>
              <p className="text-text-muted text-sm mb-8">
                Already have an account?{' '}
                <Link to="/login" className="text-accent hover:underline">Sign in</Link>
              </p>

              {error && (
                <div className="mb-5 flex items-start gap-2.5 px-4 py-3 rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400 text-sm">
                  <span className="shrink-0 mt-0.5">⚠</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" placeholder="e.g. Rohan Kumar" value={form.name} onChange={set('name')} className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Company / Organization</label>
                  <input type="text" placeholder="e.g. Acme Logistics" value={form.orgName} onChange={set('orgName')} className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Work Email</label>
                  <input type="email" placeholder="you@company.com" value={form.email} onChange={set('email')} className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" placeholder="Min. 6 characters" value={form.password} onChange={set('password')} className={inp} required disabled={loading} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <input type="password" placeholder="Repeat your password" value={form.confirm} onChange={set('confirm')} className={inp} required disabled={loading} />
                </div>

                <p className="text-text-muted text-xs leading-relaxed pt-1">
                  By submitting, you're requesting a <span className="text-text-primary font-medium">Fleet Manager</span> account for your organization. An admin will review before access is granted.
                </p>

                <button type="submit" disabled={loading}
                  className="w-full bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg py-2.5 font-semibold text-sm transition-all shadow-lg shadow-amber-900/20"
                >
                  {loading ? 'Submitting…' : 'Request Access →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
