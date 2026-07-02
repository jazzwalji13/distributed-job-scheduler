import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Panel } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', fullName: '', organizationName: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register(form);
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center px-4 py-10">
      <Panel className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="space-y-4 rounded-[24px] border border-white/10 bg-white/5 p-8" onSubmit={handleSubmit}>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Get started</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">Create account</h3>
          </div>

          {error ? <div className="rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</div> : null}

          {['fullName', 'organizationName', 'email', 'password'].map((field) => (
            <label key={field} className="block">
              <span className="mb-2 block text-sm text-slate-300">{field.replace(/([A-Z])/g, ' $1')}</span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-cyan-400/50"
                value={form[field]}
                onChange={(event) => setForm({ ...form, [field]: event.target.value })}
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                required={field !== 'organizationName'}
              />
            </label>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-ember-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ember-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-sm text-slate-400">
            Already registered? <Link className="text-cyan-300 hover:text-cyan-200" to="/login">Sign in</Link>
          </p>
        </form>

        <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-amber-500/10 via-slate-900/40 to-cyan-400/10 p-8">
          <div className="text-xs uppercase tracking-[0.35em] text-amber-200/80">Multi-tenant ready</div>
          <h2 className="mt-4 text-4xl font-semibold text-white">Bring your organization, projects, queues, and workers into one place.</h2>
          <p className="mt-4 max-w-xl text-sm text-slate-300">
            The scheduler creates a secure tenant boundary on registration and seeds ownership so you can start managing queues immediately.
          </p>
        </div>
      </Panel>
    </div>
  );
}
