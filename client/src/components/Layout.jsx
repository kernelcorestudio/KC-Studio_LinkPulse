// App navigation shell (Sleek Dark SaaS sidebar + header)
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  DashboardIcon, LinksIcon, CampaignIcon, TagIcon,
  CreateIcon, ImportIcon, BioIcon, AdminIcon,
} from './Icons';

const NAV = [
  { to: '/app', label: 'Dashboard', pathTag: '/app', Icon: DashboardIcon, end: true },
  { to: '/links', label: 'Links', pathTag: '/links', Icon: LinksIcon },
  { to: '/campaigns', label: 'Campaigns', pathTag: '/campaigns', Icon: CampaignIcon },
  { to: '/tags', label: 'Tags & Folders', pathTag: '/tags', Icon: TagIcon },
  { to: '/create', label: 'Create Link', pathTag: '/create', Icon: CreateIcon },
  { to: '/import', label: 'Bulk Import', pathTag: '/import', Icon: ImportIcon },
  { to: '/bio', label: 'Bio Pages', pathTag: '/bio', Icon: BioIcon },
  { to: '/admin', label: 'Admin', pathTag: '/admin', Icon: AdminIcon, adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    nav('/login');
  }

  const linkClass = ({ isActive }) =>
    `group relative flex items-center justify-between rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-200 ease-out ${
      isActive
        ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 shadow-sm before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r-full before:bg-indigo-500 before:shadow-[0_0_8px_rgba(99,102,241,0.8)]'
        : 'border-transparent text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900/60 hover:text-zinc-200 hover:translate-x-0.5'
    }`;

  return (
    <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col md:flex-row bg-[#09090b]">
      {/* Sleek subtle background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />

      {/* Left Sidebar */}
      <aside className="relative z-10 border-b border-zinc-800/80 bg-[#0c0d0e]/95 p-4 backdrop-blur-xl md:w-64 md:border-b-0 md:border-r shrink-0">
        <Link to="/app" className="group mb-5 flex items-center gap-3 transition">
          <div className="relative w-10 h-10 shrink-0 rounded-xl bg-[#09090B] border border-indigo-500/30 p-1.5 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(99,102,241,0.28)] group-hover:border-indigo-400/60 group-hover:shadow-[0_0_25px_rgba(56,189,248,0.4)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-cyan-500/10 before:to-violet-500/15 before:opacity-80">
            <img
              src="/logo.jpg"
              alt="LinkPulse Logo"
              className="relative z-10 w-full h-full object-contain rounded-lg select-none group-hover:scale-105 transition-transform duration-300 mix-blend-screen"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-bold tracking-tight text-white leading-tight">LinkPulse</p>
              <span className="rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono px-1.5 py-0.5">PRO</span>
            </div>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">TELEMETRY ENGINE</p>
          </div>
        </Link>

        {/* Live Dual-Ring Status Pill */}
        <div className="mb-4 flex items-center gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 font-mono text-[10px] text-zinc-300 shadow-inner">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
          </span>
          <span className="font-semibold tracking-wider text-emerald-400/90">STATUS: ONLINE</span>
          <span className="ml-auto text-[9px] text-zinc-500">PROD</span>
        </div>

        {/* Navigation Links */}
        <nav className="flex gap-1 overflow-x-auto md:flex-col">
          {NAV.filter((n) => !n.adminOnly || user?.role === 'admin').map((n) => {
            const Icon = n.Icon;
            return (
              <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-2.5">
                      <Icon className={`h-4 w-4 shrink-0 transition-all duration-200 group-hover:text-indigo-400 group-hover:scale-105 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span className="whitespace-nowrap">{n.label}</span>
                    </div>
                    {isActive && (
                      <span className="hidden md:inline-block font-mono text-[10px] text-indigo-400/80 opacity-80">
                        {n.pathTag}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      {/* Main Area */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/80 px-6 py-3 backdrop-blur-md">
          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-300 shadow-sm">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/20 text-[10px] font-semibold text-indigo-400 border border-indigo-500/30">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </span>
            <span className="font-medium text-zinc-200">{user?.email}</span>
            {user?.role === 'admin' && (
              <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                ADMIN
              </span>
            )}
          </div>

          {/* Quick Actions & Logout */}
          <div className="flex items-center gap-2.5">
            <Link
              to="/create"
              className="group inline-flex items-center gap-1.5 rounded-lg border border-indigo-400/30 bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(99,102,241,0.35)] transition-all duration-200 hover:from-indigo-400 hover:to-violet-500 hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] active:scale-[0.98]"
            >
              <span className="text-sm leading-none transition-transform duration-200 group-hover:rotate-90">+</span>
              <span>Create Link</span>
            </Link>
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
              onClick={handleLogout}
              title="Disconnect session"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8">
          {/* Ambient Top Spotlight Glow */}
          <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-full max-w-4xl rounded-full bg-indigo-500/[0.12] blur-[120px] -z-10" aria-hidden="true" />
          <div key={location.pathname} className="page-transition-enter min-h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
