// Login + Register pages (shared modern SaaS form shell).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await register(form);
      nav('/app');
    } catch (err) {
      setError(err.details?.[0]?.message || err.message || 'Failed, try again');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-[#09090b] p-4 text-zinc-100">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute h-[400px] w-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block group transition">
            <div className="relative w-14 h-14 rounded-2xl bg-[#09090B] border border-indigo-500/30 p-2 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(99,102,241,0.35)] group-hover:border-indigo-400/60 group-hover:shadow-[0_0_35px_rgba(56,189,248,0.45)] transition-all duration-300 mx-auto mb-4 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-cyan-500/10 before:to-violet-500/15 before:opacity-80">
              <img
                src="/logo.jpg"
                alt="LinkPulse logo"
                className="relative z-10 w-full h-full object-contain rounded-xl select-none group-hover:scale-105 transition-transform duration-300 mix-blend-screen"
              />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-1.5 text-xs text-zinc-400">
            {isLogin ? 'Sign in to access your LinkPulse dashboard' : 'Start tracking and managing your links in seconds'}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-white/[0.08] bg-[#0e0f12]/95 p-7 shadow-2xl backdrop-blur-xl space-y-4">
          {!isLogin && (
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={form.name}
                onChange={set('name')}
                placeholder="Ada Lovelace"
                required
              />
            </div>
          )}
          <div>
            <label className="label">Email Address</label>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="name@company.com"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-400">Password</label>
            </div>
            <input
              className="input"
              type="password"
              value={form.password}
              onChange={set('password')}
              placeholder="••••••••"
              required
              minLength={isLogin ? 1 : 8}
            />
            {!isLogin && <p className="mt-1.5 text-[11px] text-zinc-500">Must be at least 8 characters.</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-indigo-500/25 transition hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50"
            disabled={busy}
          >
            {busy ? 'Authenticating…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          <p className="text-center text-xs text-zinc-400 pt-1">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {isLogin && (
            <div className="mt-4 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-3 text-center text-xs font-mono text-zinc-400">
              <div className="text-[10px] uppercase font-sans text-zinc-500 mb-1">Demo Account Credentials</div>
              <div><span className="text-zinc-200">ada@example.com</span> / <span className="text-zinc-200">password123</span></div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
