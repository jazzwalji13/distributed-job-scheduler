import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Panel } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-10">
      <Panel className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-cyan-400/10 via-slate-900/40 to-amber-500/10 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-cyan-300/80">Welcome back</div>
          <h2 className="mt-4 text-4xl font-semibold text-white">Run the scheduler from a single control surface.</h2>
          <p className="mt-4 max-w-xl text-sm text-slate-300">
            Track queue throughput, retry pressure, worker health, and dead-letter activity without switching tools.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Live updates</div>
              <div className="mt-2 text-lg font-semibold text-white">Socket.IO</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Auth</div>
              <div className="mt-2 text-lg font-semibold text-white">JWT protected</div>
            </div>
          </div>
        </div>

        <form className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-8" onSubmit={handleSubmit}>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Authentication</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Sign in</h3>
          </div>

          {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              type="email"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              type="password"
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-sm text-slate-400">
            No account yet? <Link className="text-cyan-300 hover:text-cyan-200" to="/register">Register</Link>
          </p>
        </form>
      </Panel>
    </div>
  );
}
