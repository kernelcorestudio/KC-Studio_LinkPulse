// App navigation shell (Sleek Floating Dock Navbar with Neon Aura & Tactile Micro-Interactions)
import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { useTheme } from '../lib/theme';
import {
  DashboardIcon, LinksIcon, CampaignIcon, TagIcon,
  CreateIcon, ImportIcon, BioIcon, AdminIcon,
  SunIcon, MoonIcon, MenuIcon, CloseIcon,
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

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    setMobileDrawerOpen(false);
    setProfileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

        <div className="w-full flex items-center justify-between gap-2 px-3 sm:px-6 py-2.5">

          {/* ── LEFT: Logo & Brand ── */}
          <Link
            to="/app"
            className="group flex items-center gap-2.5 shrink-0 transition-transform active:scale-95 duration-200"
          >
            <div className="brand-logo-badge relative w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-[#000000] border border-[#F88F22]/40 p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_22px_rgba(234,97,19,0.35)] group-hover:border-[#FBB931]/80 group-hover:shadow-[0_0_30px_rgba(251,185,49,0.6)] group-hover:scale-105 transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#EA6113]/20 before:to-[#FBB931]/25">
              <img
                src="/logo.jpg"
                alt="LinkPulse Logo"
                className="relative z-10 w-full h-full object-contain rounded-xl select-none scale-105 group-hover:scale-115 transition-transform duration-300 mix-blend-screen drop-shadow-[0_0_10px_rgba(251,185,49,0.5)]"
              />
            </div>
            <span className="text-sm sm:text-base font-bold tracking-tight text-white group-hover:text-amber-100 transition-colors leading-tight">
              LinkPulse
            </span>
          </Link>

          {/* ── CENTER: Floating Dock (Desktop only) ── */}
          <div className="hidden md:flex relative items-center justify-center min-w-0 max-w-fit mx-auto px-1">
            {/* Radiant neon underglow behind the dock */}
            <div className="pointer-events-none absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#EA6113]/25 via-[#F88F22]/45 to-[#EA6113]/25 blur-xl opacity-75 animate-dock-glow -z-10" />

            {/* Dock bar */}
            <nav
              className="relative flex items-center gap-1 sm:gap-1.5 rounded-2xl border border-[#F88F22]/40 bg-[#080808]/95 backdrop-blur-2xl p-1 sm:p-1.5 shadow-[0_0_35px_-5px_rgba(234,97,19,0.4),0_15px_30px_-10px_rgba(0,0,0,0.9),inset_0_1px_1px_rgba(251,185,49,0.3)] no-scrollbar overflow-x-auto max-w-full"
            >
              {NAV.filter((n) => !n.adminOnly || user?.role === 'admin').map((n) => {
                const Icon = n.Icon;
                const active = isTabActive(n);

                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    className={`group relative flex items-center gap-1.5 sm:gap-2 rounded-xl px-2 sm:px-2.5 xl:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                      active
                        ? 'bg-gradient-to-b from-[#EA6113]/25 to-[#F88F22]/15 border border-[#F88F22] text-white font-semibold shadow-[0_0_18px_rgba(234,97,19,0.35)] active:scale-95'
                        : 'text-amber-200/60 border border-transparent hover:text-white hover:bg-[#141414] hover:border-[#F88F22]/40 hover:shadow-[0_0_16px_rgba(234,97,19,0.25)] hover:-translate-y-0.5 active:scale-95 active:translate-y-0'
                    }`}
                  >
                    <Icon
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-all duration-200 ${
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

          {/* ── RIGHT: User Profile Dropdown + Theme Toggle + Direct Logout Button ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* User Profile with Clickable Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 transition-all duration-200 cursor-pointer ${
                  isLight
                    ? 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-800 shadow-sm'
                    : 'border-zinc-800 bg-[#080808]/90 hover:border-[#F88F22]/40 text-white shadow-[0_2px_10px_rgba(0,0,0,0.6)]'
                }`}
                title="Click for account options"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#EA6113] to-[#F88F22] text-[10px] font-bold text-white shadow-[0_0_8px_rgba(234,97,19,0.5)]">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
                <span className="hidden sm:inline text-xs font-medium max-w-[120px] truncate" title={user?.email}>
                  {user?.email}
                </span>
                {user?.role === 'admin' && (
                  <span className="rounded bg-amber-500/10 px-1 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-amber-400 border border-amber-500/25">
                    ADMIN
                  </span>
                )}
                <svg className="h-3 w-3 text-zinc-400 transition-transform duration-200" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none' }} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Dropdown Menu on Profile Click */}
              {profileMenuOpen && (
                <div className={`absolute right-0 mt-2 w-56 rounded-xl border p-2 shadow-2xl backdrop-blur-2xl z-50 animate-fade-in ${
                  isLight
                    ? 'bg-white border-zinc-200 shadow-[0_10px_35px_rgba(0,0,0,0.15)]'
                    : 'bg-[#121212] border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.9)]'
                }`}>
                  <div className="px-3 py-2 border-b border-white/5 mb-1.5">
                    <p className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Signed in as</p>
                    <p className="text-xs font-bold text-amber-200 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 border border-amber-500/30">
                      ROLE: {user?.role?.toUpperCase()}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    <span>Log Out of Session</span>
                  </button>
                </div>
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

            {/* Mobile Hamburger / Menu Button */}
            <button
              onClick={() => setMobileDrawerOpen((prev) => !prev)}
              type="button"
              className={`flex md:hidden items-center justify-center rounded-xl border p-2 transition-all duration-200 cursor-pointer ${
                mobileDrawerOpen
                  ? 'border-[#EA6113] bg-[#EA6113]/20 text-[#FBB931]'
                  : isLight
                  ? 'border-zinc-300 bg-white hover:border-[#EA6113]/40 text-zinc-800'
                  : 'border-zinc-800 bg-[#080808]/90 hover:border-[#F88F22]/40 text-white'
              }`}
              title="Toggle Navigation Menu"
              aria-label="Toggle Navigation Menu"
            >
              {mobileDrawerOpen ? (
                <CloseIcon className="h-4 w-4 text-[#EA6113]" />
              ) : (
                <MenuIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 flex-1 overflow-y-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8">
        {/* Ambient top spotlight */}
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[450px] w-full max-w-4xl rounded-full bg-[#EA6113]/[0.08] blur-[120px] -z-10" aria-hidden="true" />
        <div key={location.pathname} className="page-transition-enter min-h-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>

      {/* ── MOBILE BOTTOM NAVIGATION DOCK (Native App Feel) ── */}
      <nav
        className={`fixed bottom-0 inset-x-0 z-40 md:hidden border-t px-2 py-1.5 backdrop-blur-2xl transition-colors duration-200 ${
          isLight
            ? 'bg-white/95 border-amber-900/15 shadow-[0_-4px_20px_rgba(234,97,19,0.12)]'
            : 'bg-[#080808]/95 border-white/[0.08] shadow-[0_-8px_30px_rgba(0,0,0,0.85)]'
        }`}
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Dashboard */}
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[#EA6113] font-bold scale-105'
                  : isLight
                  ? 'text-amber-900/60 hover:text-amber-900'
                  : 'text-amber-200/50 hover:text-white'
              }`
            }
          >
            <DashboardIcon className="h-5 w-5" />
            <span>Dashboard</span>
          </NavLink>

          {/* Links */}
          <NavLink
            to="/links"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[#EA6113] font-bold scale-105'
                  : isLight
                  ? 'text-amber-900/60 hover:text-amber-900'
                  : 'text-amber-200/50 hover:text-white'
              }`
            }
          >
            <LinksIcon className="h-5 w-5" />
            <span>Links</span>
          </NavLink>

          {/* Elevated Center Create Button */}
          <NavLink
            to="/create"
            className="flex flex-col items-center -mt-5 group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#EA6113] via-[#F88F22] to-[#FBB931] text-white shadow-[0_0_20px_rgba(234,97,19,0.65)] border-2 border-black active:scale-90 transition-transform">
              <CreateIcon className="h-6 w-6" />
            </div>
            <span className="text-[10px] font-semibold text-[#EA6113] mt-0.5">Create</span>
          </NavLink>

          {/* Campaigns */}
          <NavLink
            to="/campaigns"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all ${
                isActive
                  ? 'text-[#EA6113] font-bold scale-105'
                  : isLight
                  ? 'text-amber-900/60 hover:text-amber-900'
                  : 'text-amber-200/50 hover:text-white'
              }`
            }
          >
            <CampaignIcon className="h-5 w-5" />
            <span>Campaigns</span>
          </NavLink>

          {/* More Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((v) => !v)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${
              mobileDrawerOpen
                ? 'text-[#EA6113] font-bold scale-105'
                : isLight
                ? 'text-amber-900/60 hover:text-amber-900'
                : 'text-amber-200/50 hover:text-white'
            }`}
          >
            <MenuIcon className="h-5 w-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* ── MOBILE SLIDE-UP DRAWER ("MORE" MENU) ── */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Drawer Sheet */}
          <div
            className={`relative z-10 w-full rounded-t-3xl border-t p-5 shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto animate-fade-in-up ${
              isLight
                ? 'bg-[#FFFDF9] border-amber-900/20 text-[#1F0E02]'
                : 'bg-[#0c0d0e] border-white/10 text-white'
            }`}
          >
            {/* Grab Handle */}
            <div className="mx-auto w-12 h-1 rounded-full bg-zinc-700/50 mb-4" />

            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3 mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-500">Navigation Hub</p>
                <p className="text-sm font-bold truncate max-w-[240px]">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="rounded-full p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Grid of All Links */}
            <div className="grid grid-cols-2 gap-2.5 mb-5">
              {NAV.filter((n) => !n.adminOnly || user?.role === 'admin').map((n) => {
                const Icon = n.Icon;
                const active = isTabActive(n);
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={() => setMobileDrawerOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs font-semibold transition-all ${
                      active
                        ? 'border-[#EA6113] bg-[#EA6113]/15 text-[#EA6113] shadow-sm'
                        : isLight
                        ? 'border-amber-900/10 bg-white hover:border-[#EA6113]/40 text-[#1F0E02]'
                        : 'border-zinc-800 bg-[#121212] hover:border-zinc-700 text-amber-200/80 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#EA6113]" />
                    <span>{n.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Direct Logout Action in Drawer */}
            <button
              onClick={() => {
                setMobileDrawerOpen(false);
                handleLogout();
              }}
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 py-3 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Log Out of Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
