import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import http from '../../lib/http';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await http.post('/auth/login', { email, password });
      login(data.token, data.user);
      navigate('/dashboard');
    } catch {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="bg-panel border border-border rounded-lg p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <span className="w-7 h-7 rounded bg-accent flex items-center justify-center text-sm font-bold text-white">T</span>
          <span className="text-text-primary font-semibold text-lg">TransitOps</span>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-bg border border-border rounded px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-bg border border-border rounded px-3 py-2 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
            required
          />
          {error && <p className="text-rose-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="bg-accent hover:bg-accent-hover text-white rounded py-2 font-medium transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
