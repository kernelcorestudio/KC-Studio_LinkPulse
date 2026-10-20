// Login + Register pages (shared modern SaaS form shell).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { EyeIcon, EyeOffIcon, GoogleIcon } from '../components/Icons';

function GoogleModal({ isOpen, onClose, onSelect, busy, error }) {
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      gradient: 'from-amber-500 to-orange-600',
    },
    {
      name: 'Alex Developer',
      email: 'alex.dev@gmail.com',
      gradient: 'from-blue-500 to-cyan-500',
    },
  ];

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    onSelect({
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[400px] rounded-2xl border border-white/10 bg-[#16110d] p-6 shadow-2xl text-white transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Google Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2.5 rounded-full bg-white/5 border border-white/10 shadow-inner mb-3">
            <GoogleIcon className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight">Choose an account</h3>
          <p className="text-xs text-zinc-400 mt-1">
            to continue to <span className="text-[#FBB931] font-medium">LinkPulse</span>
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-300">
            {error}
          </div>
        )}

        {/* 1-Click Accounts */}
        <div className="space-y-2 mb-4">
          {defaultAccounts.map((acc) => (
            <button
              key={acc.email}
              type="button"
              disabled={busy}
              onClick={() => onSelect(acc)}
              className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-white/5 bg-white/[0.03] hover:bg-white/[0.08] hover:border-amber-500/30 active:scale-[0.99] transition-all duration-150 text-left group"
            >
              <div
                className={`h-9 w-9 rounded-full bg-gradient-to-tr ${acc.gradient} flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0`}
              >
                {acc.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white group-hover:text-amber-200 transition-colors truncate">
                  {acc.name}
                </div>
                <div className="text-xs text-zinc-400 truncate">{acc.email}</div>
              </div>
              <div className="text-xs text-zinc-500 group-hover:text-amber-400 transition-colors">
                ➔
              </div>
            </button>
          ))}
        </div>

        {/* Use another Google account toggle/section */}
        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-white/15 bg-transparent hover:bg-white/[0.04] text-xs font-medium text-zinc-300 hover:text-white transition-all text-left"
          >
            <div className="h-8 w-8 rounded-full border border-white/20 flex items-center justify-center text-zinc-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
            </div>
            <span>Use another Google account</span>
          </button>
        ) : (
          <form onSubmit={handleCustomSubmit} className="space-y-3 rounded-xl border border-white/10 bg-black/40 p-3.5 mt-2">
            <div className="text-xs font-medium text-amber-200/80 mb-1">Enter Google Account Details</div>
            <div>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Name (e.g. Karan Nayal)"
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <input
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="Google Email (e.g. you@gmail.com)"
                required
                className="w-full rounded-lg border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCustom(false)}
                className="w-1/3 rounded-lg border border-white/10 py-1.5 text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={busy}
                className="w-2/3 rounded-lg bg-gradient-to-r from-[#EA6113] to-[#F88F22] py-1.5 text-xs font-semibold text-white hover:from-[#F88F22] hover:to-[#FBB931] shadow transition disabled:opacity-50"
              >
                {busy ? 'Signing in…' : 'Continue'}
              </button>
            </div>
          </form>
        )}

        <p className="text-[10px] text-zinc-500 text-center mt-5 leading-relaxed">
          To continue, Google will share your name, email address, and profile picture with LinkPulse.
        </p>
      </div>
    </div>
  );
}

export default function AuthPage({ mode = 'login' }) {
  const isLogin = mode === 'login';
  const { login, register, loginWithGoogle } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleModalError, setGoogleModalError] = useState('');

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

  async function handleGoogleClick() {
    setError('');
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (googleClientId) {
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (res) => {
            if (res.credential) {
              setGoogleBusy(true);
              try {
                await loginWithGoogle({ credential: res.credential });
                nav('/app');
              } catch (err) {
                setError(err.message || 'Google authentication failed');
              } finally {
                setGoogleBusy(false);
              }
            }
          },
        });
        window.google.accounts.id.prompt();
        return;
      }
    }
    // Zero-config local/hackathon mode: open custom modal
    setGoogleModalError('');
    setShowGoogleModal(true);
  }

  async function handleGoogleAccountSelect(profile) {
    setGoogleModalError('');
    setGoogleBusy(true);
    try {
      await loginWithGoogle(profile);
      setShowGoogleModal(false);
      nav('/app');
    } catch (err) {
      setGoogleModalError(err.message || 'Failed to sign in with Google');
    } finally {
      setGoogleBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-[#100800] p-4 text-[#FFE3B3]">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute h-[400px] w-[500px] rounded-full bg-[#EA6113]/15 blur-[100px]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-block group transition">
            <div className="relative w-16 h-16 rounded-2xl bg-[#100800] border border-[#F88F22]/35 p-1 flex items-center justify-center overflow-hidden shadow-[0_0_35px_rgba(234,97,19,0.38)] group-hover:border-[#FBB931]/60 group-hover:shadow-[0_0_45px_rgba(251,185,49,0.55)] transition-all duration-300 mx-auto mb-4 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#EA6113]/15 before:to-[#FBB931]/25 before:opacity-80">
              <img
                src="/logo.jpg"
                alt="LinkPulse logo"
                className="relative z-10 w-full h-full object-contain rounded-xl select-none scale-105 group-hover:scale-115 transition-transform duration-300 mix-blend-screen drop-shadow-[0_0_12px_rgba(251,185,49,0.5)]"
              />
            </div>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {isLogin ? 'Welcome back' : 'Create an account'}
          </h1>
          <p className="mt-1.5 text-xs text-amber-200/60">
            {isLogin ? 'Sign in to access your LinkPulse dashboard' : 'Start tracking and managing your links in seconds'}
          </p>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-[#2a1800]/80 bg-[#150900]/95 p-7 shadow-2xl backdrop-blur-xl space-y-4">
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
              <label className="text-xs font-medium text-amber-200/60">Password</label>
            </div>
            <div className="relative flex items-center">
              <input
                className="input pr-10"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="••••••••"
                required
                minLength={isLogin ? 1 : 8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2.5 flex h-7 w-7 items-center justify-center rounded-md text-amber-200/40 hover:text-[#FBB931] hover:bg-[#F88F22]/10 transition-all duration-150 active:scale-90 focus:outline-none"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            {!isLogin && <p className="mt-1.5 text-[11px] text-amber-900/60">Must be at least 8 characters.</p>}
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-xs font-medium text-rose-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-lg border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-[#EA6113]/25 transition hover:from-[#F88F22] hover:to-[#FBB931] hover:shadow-[#FBB931]/40 active:scale-[0.98] disabled:opacity-50"
            disabled={busy || googleBusy}
          >
            {busy ? 'Authenticating…' : isLogin ? 'Sign In' : 'Create Account'}
          </button>

          {/* Divider */}
          <div className="relative my-5 flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-[#150900] px-3 text-xs text-zinc-400 whitespace-nowrap">
              or continue with
            </span>
            <div className="border-t border-white/10 w-full"></div>
          </div>

          {/* Continue with Google button */}
          <button
            type="button"
            onClick={handleGoogleClick}
            disabled={busy || googleBusy}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/15 hover:border-amber-500/40 text-sm font-medium text-white shadow-sm hover:shadow-[0_0_20px_rgba(248,143,34,0.15)] active:scale-[0.99] transition-all duration-200 disabled:opacity-50"
          >
            <GoogleIcon className="h-4 w-4 shrink-0" />
            <span>{googleBusy ? 'Connecting…' : 'Continue with Google'}</span>
          </button>

          <p className="text-center text-xs text-amber-200/60 pt-2">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link to="/register" className="font-semibold text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
                  Create one
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#FBB931] hover:text-[#FFE3B3] hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </p>

          {isLogin && (
            <div className="mt-4 rounded-lg border border-[#2a1800]/80 bg-[#1c1000]/60 p-3 text-center text-xs font-mono text-amber-200/60">
              <div className="text-[10px] uppercase font-sans text-amber-900/60 mb-1">Demo Account Credentials</div>
              <div><span className="text-[#FFE3B3]">ada@example.com</span> / <span className="text-[#FFE3B3]">password123</span></div>
            </div>
          )}
        </form>
      </div>

      {/* Google Chooser Modal Overlay */}
      <GoogleModal
        isOpen={showGoogleModal}
        onClose={() => {
          if (!googleBusy) {
            setShowGoogleModal(false);
            setGoogleModalError('');
          }
        }}
        onSelect={handleGoogleAccountSelect}
        busy={googleBusy}
        error={googleModalError}
      />
    </div>
  );
}
