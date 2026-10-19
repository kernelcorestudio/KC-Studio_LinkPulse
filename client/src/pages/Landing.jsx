// Public landing page: Modern Dark SaaS hero + product demo video + login / get-started CTA.
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import {
  ChartIcon, ZapIcon, CampaignIcon, BioIcon, QrIcon, ImportIcon, SparkleIcon,
  SunIcon, MoonIcon,
} from '../components/Icons';
import MouseGlow from '../components/MouseGlow';

const FEATURES = [
  {
    Icon: ChartIcon,
    title: 'Real-time Analytics',
    desc: 'Watch every click land with millisecond telemetry — device, geography, referrer, and source on one live dashboard.',
  },
  {
    Icon: ZapIcon,
    title: 'Smart Short Links',
    desc: 'Custom slugs, expiry dates, click limits, and password-protected gateways with seamless redirection.',
  },
  {
    Icon: CampaignIcon,
    title: 'Campaigns & Tags',
    desc: 'Group links into high-performance UTM campaigns, organize with folders and tags, and prevent clutter.',
  },
  {
    Icon: BioIcon,
    title: 'Link-in-Bio Pages',
    desc: 'Customizable public landing profiles that showcase all your important links in one fast, responsive page.',
  },
  {
    Icon: QrIcon,
    title: 'Dynamic QR Codes',
    desc: 'Every link instantly generates high-resolution scannable QR codes with live scan tracking.',
  },
  {
    Icon: ImportIcon,
    title: 'High-Volume Bulk Import',
    desc: 'Paste bulk URLs or upload CSV files to batch-generate hundreds of short links in seconds.',
  },
];

export default function Landing() {
  const { isLight, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#000000] text-[#FFE3B3]">
      {/* Background ambient gradient glow & grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#EA6113]/15 blur-[120px]" />
      <MouseGlow />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between py-6">
          <Link to="/" className="group flex items-center gap-3 transition">
            <div className="brand-logo-badge relative w-10 h-10 rounded-xl bg-[#000000] border border-[#F88F22]/35 p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_22px_rgba(234,97,19,0.32)] group-hover:border-[#FBB931]/60 group-hover:shadow-[0_0_30px_rgba(251,185,49,0.5)] transition-all duration-300 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-[#EA6113]/15 before:to-[#FBB931]/20 before:opacity-80">
              <img
                src="/logo.jpg"
                alt="LinkPulse Logo"
                className="relative z-10 w-full h-full object-contain rounded-lg select-none scale-105 group-hover:scale-115 transition-transform duration-300 mix-blend-screen drop-shadow-[0_0_10px_rgba(251,185,49,0.45)]"
              />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              LinkPulse
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
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

            <Link
              to="/login"
              className="rounded-lg px-3.5 py-1.5 text-xs font-medium text-amber-200/70 transition hover:text-white"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-lg border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_20px_rgba(234,97,19,0.35)] transition-all duration-200 hover:from-[#F88F22] hover:to-[#FBB931] hover:shadow-[0_0_28px_rgba(251,185,49,0.55)] active:scale-[0.98]"
            >
              Get Started Free
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="pt-14 pb-12 text-center md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F88F22]/30 bg-[#F88F22]/10 px-3.5 py-1 text-xs font-medium text-[#FBB931] backdrop-blur-md mb-6">
            <SparkleIcon className="h-3.5 w-3.5 text-[#FBB931]" />
            <span>Next-Gen URL Management & Real-Time Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Short Links.{' '}
            <span className="bg-gradient-to-r from-[#EA6113] via-[#F88F22] to-[#FBB931] bg-clip-text text-transparent">
              Infinite Reach.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-amber-200/70 leading-relaxed">
            Create memorable branded short links, capture real-time visitor telemetry,
            build link-in-bio hubs, and automate UTM campaigns with a sleek, developer-grade platform.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="w-full sm:w-auto rounded-lg border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(234,97,19,0.35)] transition-all duration-200 hover:from-[#F88F22] hover:to-[#FBB931] hover:shadow-[0_0_28px_rgba(251,185,49,0.55)] active:scale-[0.98]"
            >
              Start Free Trial →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto rounded-lg border border-zinc-800 bg-[#121212] px-6 py-2.5 text-sm font-medium text-amber-200 transition hover:border-[#F88F22]/40 hover:bg-[#1a1a1a] hover:text-white"
            >
              Sign In to Dashboard
            </Link>
          </div>

          <p className="mt-4 font-mono text-xs text-zinc-500">
            Instant Demo Account: <span className="text-amber-200/80">ada@example.com</span> / <span className="text-amber-200/80">password123</span>
          </p>
        </section>

        {/* Product Demo Video in Modern Window Frame */}
        <section className="mx-auto mt-8 max-w-4xl">
          <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#000000] shadow-2xl shadow-[#EA6113]/10">
            {/* Window title bar */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 bg-[#080808] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#EA6113]/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#F88F22]/80 inline-block" />
                <span className="h-3 w-3 rounded-full bg-[#FBB931]/80 inline-block" />
              </div>
              <span className="font-mono text-xs text-amber-200/60">linkpulse.mp4 — product overview</span>
              <div className="w-10" />
            </div>
            <video
              className="block w-full bg-black aspect-video object-cover"
              src="/linkpulse.mp4"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        </section>

        {/* Features Grid */}
        <section className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Engineered for Performance & Scale</h2>
            <p className="text-xs sm:text-sm text-amber-200/60 mt-2">Everything you need to deliver, track, and optimize every redirection.</p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              return (
                <div
                  key={f.title}
                  className="rounded-xl border border-zinc-800/80 bg-[#080808] p-6 shadow-sm transition duration-150 hover:border-[#F88F22]/40 hover:bg-[#121214]"
                >
                  <div className="mb-4 inline-flex rounded-lg border border-[#F88F22]/30 bg-[#F88F22]/10 p-2.5 text-[#FBB931] shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-100">{f.title}</h3>
                  <p className="mt-2 text-xs text-amber-200/60 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA Card */}
        <section className="mt-24">
          <div className="relative overflow-hidden rounded-2xl border border-[#F88F22]/30 bg-[#080808] px-6 py-14 text-center shadow-xl">
            <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-96 rounded-full bg-[#EA6113]/20 blur-3xl" />
            <h2 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Supercharge your link workflows today
            </h2>
            <p className="relative mx-auto mt-3 max-w-md text-xs sm:text-sm text-amber-200/60">
              Free account, 30-second setup. Bring your domains and links — we'll bring real-time intelligence.
            </p>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="w-full sm:w-auto rounded-lg border border-[#F88F22]/40 bg-gradient-to-r from-[#EA6113] to-[#F88F22] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg shadow-[#EA6113]/30 transition hover:from-[#F88F22] hover:to-[#FBB931]"
              >
                Create Free Account
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto rounded-lg border border-zinc-800 bg-[#121212] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-amber-200 transition hover:border-[#F88F22]/40 hover:bg-[#1a1a1a] hover:text-white"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-20 border-t border-zinc-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2.5">
            <div className="brand-logo-badge relative w-7 h-7 rounded-lg bg-[#000000] border border-[#F88F22]/35 p-0.5 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(234,97,19,0.25)]">
              <img src="/logo.jpg" alt="LinkPulse logo" className="w-full h-full object-contain mix-blend-screen scale-105" />
            </div>
            <span className="font-semibold text-amber-200/80">LinkPulse</span>
          </div>
          <p>© {new Date().getFullYear()} LinkPulse Inc. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
