// App navigation shell (Top Horizontal Navbar — pill-style active)
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import {
  DashboardIcon, LinksIcon, CampaignIcon, TagIcon,
  CreateIcon, ImportIcon, BioIcon, AdminIcon,
} from './Icons';

const NAV = [
  { to: '/app', label: 'Dashboard', Icon: DashboardIcon, end: true },
  { to: '/links', label: 'Links', Icon: LinksIcon },
  { to: '/campaigns', label: 'Campaigns', Icon: CampaignIcon },
  { to: '/tags', label: 'Tags', Icon: TagIcon },
  { to: '/create', label: 'Create', Icon: CreateIcon },
  { to: '/import', label: 'Import', Icon: ImportIcon },
  { to: '/bio', label: 'Bio Pages', Icon: BioIcon },
  { to: '/admin', label: 'Admin', Icon: AdminIcon, adminOnly: true },
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
    `relative flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive
      ? 'bg-[#1c1000] border border-[#3d2200]/80 text-white shadow-[0_0_12px_rgba(248,143,34,0.15)]'
      : 'text-amber-200/50 hover:text-amber-100 hover:bg-[#1c1000]/50'
    }`;

  return (
    <div className="relative flex min-h-screen flex-col bg-[#100800]">
      {/* Subtle background grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />

      {/* ── TOP NAVBAR ── */}
      <header className="relative z-20 border-b border-[#2a1800]/80 bg-[#0e0600]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-2">

          {/* Logo */}
          <Link to="/app" className="group flex items-center gap-2.5 shrink-0 mr-2 transition">
            <div className="relative w-9 h-9 shrink-0 rounded-xl bg-[#100800] border border-[#F88F22]/35 p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_18px_rgba(234,97,19,0.3)] group-hover:border-[#FBB931]/60 group-hover:shadow-[0_0_24px_rgba(251,185,49,0.45)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#EA6113]/15 before:to-[#FBB931]/20">
              <img
                src="/logo.jpg"
                alt="LinkPulse Logo"
                className="relative z-10 w-full h-full object-contain rounded-lg select-none scale-105 group-hover:scale-110 transition-transform duration-300 mix-blend-screen drop-shadow-[0_0_8px_rgba(251,185,49,0.4)]"
              />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-white leading-tight">LinkPulse</span>
                <span className="rounded bg-[#F88F22]/15 text-[#FFE3B3] border border-[#F88F22]/30 text-[10px] font-mono px-1.5 py-0.5">PRO</span>
              </div>
            </div>
          </Link>

          {/* ── Nav pill container — dark rounded strip ── */}
          <nav
            className="flex items-center gap-1 rounded-full border border-[#2a1800]/70 bg-[#0a0400]/80 px-2 py-1.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {NAV.filter((n) => !n.adminOnly || user?.role === 'admin').map((n) => {
              const Icon = n.Icon;
              return (
                <NavLink key={n.to} to={n.to} end={n.end} className={linkClass}>
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`h-3.5 w-3.5 shrink-0 transition-colors duration-200 ${isActive ? 'text-[#FBB931]' : 'text-amber-200/40'
                          }`}
                      />
                      <span>{n.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Status pill */}
          <div className="hidden md:flex items-center gap-1.5 rounded-full border border-[#2a1800]/80 bg-[#1c1000]/60 px-3 py-1 font-mono text-[10px] text-amber-200/60">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]"></span>
            </span>
            <span className="font-semibold tracking-wider text-emerald-400/90">LIVE</span>
          </div>

          {/* User + actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User pill */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-[#2a1800]/80 bg-[#1c1000]/60 px-3 py-1 text-xs text-amber-200/70">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F88F22]/20 text-[10px] font-semibold text-[#FBB931] border border-[#F88F22]/30">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </span>
              <span className="font-medium text-amber-100 max-w-[120px] truncate">{user?.email}</span>
              {user?.role === 'admin' && (
                <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/20">
                  ADMIN
                </span>
              )}
            </div>

            {/* Create Link CTA */}
            <Link
              to="/create"
              className="group inline-flex items-center gap-1.5 rounded-full border border-[#F88F22]/30 bg-gradient-to-r from-[#EA6113] to-[#F88F22] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_16px_rgba(234,97,19,0.35)] transition-all duration-200 hover:from-[#F88F22] hover:to-[#FBB931] hover:shadow-[0_0_24px_rgba(234,97,19,0.55)] active:scale-[0.98]"
            >
              <span className="text-sm leading-none transition-transform duration-200 group-hover:rotate-90">+</span>
              <span className="hidden sm:inline">Create</span>
            </Link>

            {/* Logout */}
            <button
              className="inline-flex items-center justify-center rounded-full border border-[#2a1800]/80 bg-[#1c1000]/60 p-2 text-amber-200/50 transition hover:border-[#3d2200] hover:bg-[#2a1800] hover:text-white"
              onClick={handleLogout}
              title="Disconnect session"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
