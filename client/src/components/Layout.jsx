// App navigation shell (Sleek Floating Dock Navbar with Neon Aura & Tactile Micro-Interactions)
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import {
  DashboardIcon, LinksIcon, CampaignIcon, TagIcon,
  CreateIcon, ImportIcon, BioIcon, AdminIcon,
  SunIcon, MoonIcon,
} from './Icons';
import MouseGlow from './MouseGlow';

const NAV = [
  { to: '/app', label: 'Dashboard', Icon: DashboardIcon, end: true },
  { to: '/links', label: 'Links', Icon: LinksIcon },
  { to: '/campaigns', label: 'Campaigns', Icon: CampaignIcon },
  { to: '/tags', label: 'Tags', Icon: TagIcon },
  { to: '/create', label: 'Create', Icon: CreateIcon },
  { to: '/import', label: 'Import', Icon: ImportIcon },
  { to: '/bio', label: 'Bio', Icon: BioIcon },
  { to: '/admin', label: 'Admin', Icon: AdminIcon, adminOnly: true },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { isLight, toggleTheme } = useTheme();
  const nav = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    nav('/login');
  }

  function isTabActive(item) {
    const path = location.pathname;
    if (item.end) {
      return path === item.to || path === '/dashboard' || path === '/app/';
    }
    return path.startsWith(item.to) || (item.to !== '/app' && path.startsWith(`/app${item.to}`));
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#000000]">
      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <MouseGlow />

      {/* ── TOP FLOATING NAVBAR ── */}
      <header className="relative z-30 border-b border-white/[0.08] bg-[#000000]/95 backdrop-blur-2xl">
        {/* Ambient top spotlight spreading downwards */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-4xl h-24 bg-gradient-to-b from-[#EA6113]/15 via-[#F88F22]/10 to-transparent blur-2xl -z-10" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">

          {/* ── LEFT: Logo & Brand ── */}
          <Link
            to="/app"
            className="group flex items-center gap-3 shrink-0 transition-transform active:scale-95 duration-200"
          >
            <div className="brand-logo-badge relative w-10 h-10 rounded-2xl bg-[#000000] border border-[#F88F22]/40 p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_22px_rgba(234,97,19,0.35)] group-hover:border-[#FBB931]/80 group-hover:shadow-[0_0_30px_rgba(251,185,49,0.6)] group-hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#EA6113]/20 before:to-[#FBB931]/25">
              <img
                src="/logo.jpg"
                alt="LinkPulse Logo"
                className="relative z-10 w-full h-full object-contain rounded-xl select-none scale-105 group-hover:scale-115 transition-transform duration-300 mix-blend-screen drop-shadow-[0_0_10px_rgba(251,185,49,0.5)]"
              />
            </div>
            <span className="text-base font-bold tracking-tight text-white group-hover:text-amber-100 transition-colors leading-tight">
              LinkPulse
            </span>
          </Link>

          {/* ── CENTER: Floating Dock ── */}
          <div className="relative flex items-center justify-center shrink-0">
            {/* Radiant neon underglow behind the dock */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#EA6113]/25 via-[#F88F22]/45 to-[#EA6113]/25 blur-xl opacity-75 animate-dock-glow -z-10" />

            {/* Dock bar */}
            <nav
              className="relative flex items-center gap-1.5 rounded-2xl border border-[#F88F22]/40 bg-[#080808]/95 backdrop-blur-2xl p-1.5 shadow-[0_0_35px_-5px_rgba(234,97,19,0.4),0_15px_30px_-10px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(251,185,49,0.3)] no-scrollbar overflow-x-auto max-w-full"
            >
              {NAV.filter((n) => !n.adminOnly || user?.role === 'admin').map((n) => {
                const Icon = n.Icon;
                const active = isTabActive(n);

                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={`group relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                      active
                        ? 'bg-gradient-to-b from-[#EA6113]/25 to-[#F88F22]/15 border border-[#F88F22] text-white font-semibold shadow-[0_0_18px_rgba(234,97,19,0.35)] active:scale-95'
                        : 'text-amber-200/60 border border-transparent hover:text-white hover:bg-[#141414] hover:border-[#F88F22]/40 hover:shadow-[0_0_16px_rgba(234,97,19,0.25)] hover:-translate-y-0.5 active:scale-95 active:translate-y-0'
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                        active
                          ? 'text-[#FBB931] drop-shadow-[0_0_8px_rgba(251,185,49,0.7)]'
                          : 'text-amber-200/50 group-hover:text-[#FBB931] group-hover:scale-110'
                      }`}
                    />
                    <span className="tracking-wide">{n.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* ── RIGHT: User Profile Pill + Create CTA + Logout ── */}
          <div className="flex items-center gap-3 shrink-0">
            {/* User profile pill */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-zinc-800 bg-[#080808]/90 px-3 py-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.6)] hover:border-[#F88F22]/40 hover:shadow-[0_0_16px_rgba(234,97,19,0.2)] transition-all duration-200 group">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#EA6113] to-[#F88F22] text-[11px] font-bold text-white shadow-[0_0_10px_rgba(234,97,19,0.5)] group-hover:scale-105 transition-transform duration-200">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="text-xs font-medium text-amber-100/90 max-w-[130px] truncate">{user?.email}</span>
              {user?.role === 'admin' && (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/25">
                  ADMIN
                </span>
              )}
            </div>


            {/* Theme Toggle Button (Pure Black Dark vs #FFE3B3 Light) */}
            <button
              onClick={toggleTheme}
              type="button"
              title={isLight ? 'Switch to Dark Mode (Pure Black)' : 'Switch to Light Mode (#FFE3B3)'}
              aria-label={isLight ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              className="group inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-[#080808]/90 p-2 text-amber-200/80 transition-all duration-200 hover:border-[#F88F22]/60 hover:bg-[#141414] hover:text-[#FBB931] hover:shadow-[0_0_16px_rgba(234,97,19,0.3)] hover:-translate-y-0.5 active:scale-90 cursor-pointer"
            >
              {isLight ? (
                <MoonIcon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12 text-[#EA6113]" />
              ) : (
                <SunIcon className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45 text-[#FBB931]" />
              )}
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Disconnect session"
              className="group inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-[#080808]/90 p-2 text-amber-200/60 transition-all duration-200 hover:border-[#F88F22]/50 hover:bg-[#141414] hover:text-white hover:shadow-[0_0_16px_rgba(234,97,19,0.3)] hover:-translate-y-0.5 active:scale-90 cursor-pointer"
            >
              <svg className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-6 py-6 lg:px-8 lg:py-8">
        {/* Ambient top spotlight */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-full max-w-4xl rounded-full bg-[#EA6113]/[0.08] blur-[120px] -z-10" aria-hidden="true" />
        <div key={location.pathname} className="page-transition-enter min-h-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
