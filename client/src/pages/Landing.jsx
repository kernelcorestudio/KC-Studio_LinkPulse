// Public landing page: Modern Dark SaaS hero with 3D Taffy Chain background + interactive feature grid.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../lib/theme';
import {
  ChartIcon, ZapIcon, CampaignIcon, BioIcon, QrIcon, ImportIcon, SparkleIcon,
  SunIcon, MoonIcon,
} from '../components/Icons';
import MouseGlow from '../components/MouseGlow';
import TaffyChain from '../components/TaffyChain';
import {
  AnalyticsGraphic,
  SmartLinksGraphic,
  CampaignsGraphic,
  BioGraphic,
  QrGraphic,
  BulkGraphic,
} from '../components/FeatureGraphics';

const FEATURES = [
  {
    Icon: ChartIcon,
    title1: 'Real-time',
    title2: 'Analytics',
    desc: 'Watch every click land with millisecond telemetry — device, geography, referrer, and source on one live dashboard.',
    Graphic: AnalyticsGraphic,
  },
  {
    Icon: ZapIcon,
    title1: 'Smart',
    title2: 'Short Links',
    desc: 'Custom slugs, expiry dates, click limits, and password-protected links with seamless redirection.',
    Graphic: SmartLinksGraphic,
  },
  {
    Icon: CampaignIcon,
    title1: 'Campaigns',
    title2: '& Tags',
    desc: 'Group links into high-performance UTM campaigns, organize with folders and tags, and prevent clutter.',
    Graphic: CampaignsGraphic,
  },
  {
    Icon: BioIcon,
    title1: 'Link-in-Bio',
    title2: 'Pages',
    desc: 'Customizable public landing profiles that showcase all your important links in one fast, responsive page.',
    Graphic: BioGraphic,
  },
  {
    Icon: QrIcon,
    title1: 'Dynamic',
    title2: 'QR Codes',
    desc: 'Every link instantly generates high-resolution, scannable QR codes with live scan tracking.',
    Graphic: QrGraphic,
  },
  {
    Icon: ImportIcon,
    title1: 'High-Volume',
    title2: 'Bulk Import',
    desc: 'Paste bulk URLs or upload CSV files to batch-generate hundreds of short links in seconds.',
    Graphic: BulkGraphic,
  },
];


export default function Landing() {
  const [isMetallic, setIsMetallic] = useState(false);
  const { isLight, toggleTheme } = useTheme();

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#000000] text-[#FFE3B3]">
      {/* Background ambient gradient glow & grid */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden="true" />
      <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-[#EA6113]/15 blur-[120px]" />
      <MouseGlow />

      {/* Full-Bleed 3D Taffy Chain Hero Background (z-0, pointer-events-auto) */}
      <div className="absolute top-0 left-0 w-full h-[100vh] z-0 overflow-hidden pointer-events-auto select-none">
        <TaffyChain
          background="transparent"
          metallic={isMetallic}
          colors={isMetallic ? ['#C0C0C0', '#E5E4E2', '#8A9EA7', '#FFFFFF'] : ['#EA6113', '#F88F22', '#FBB931', '#FFE3B3']}
          density={37}
          speed={50}
          sway={100}
          distance={100}
          direction="down"
          drag={60}
          chain={{ spread: 94.5, linkLength: 58, linkThickness: 36 }}
          gradient={{ scale: 100, drift: 50, morph: 50 }}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 pb-20 pointer-events-none">
        {/* Navigation Bar */}
        <header className="relative z-10 flex items-center justify-between py-6 pointer-events-auto">
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

            {/* Finish Switcher (Amber vs Metallic) */}
            <button
              type="button"
              onClick={() => setIsMetallic(!isMetallic)}
              className="flex items-center gap-1.5 rounded-lg border border-[#F88F22]/35 bg-[#1e0e00]/90 px-2.5 py-1 text-xs text-amber-200 shadow-sm transition hover:border-[#FBB931] hover:bg-[#2a1400] active:scale-95"
              title="Switch between Branded Amber & Polished Steel finish"
            >
              <span className="text-[10px] uppercase tracking-wider text-amber-400/80">Finish:</span>
              <span className="font-semibold text-white">
                {isMetallic ? 'Steel' : 'Amber'}
              </span>
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

        {/* Hero Section (Non-blocking text, clickable buttons) */}
        <section className="pointer-events-none relative z-10 pt-14 pb-10 text-center md:pt-16 md:pb-12 select-none">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F88F22]/30 bg-[#120600]/80 px-3.5 py-1 text-xs font-medium text-[#FBB931] backdrop-blur-md mb-6 shadow-sm">
            <SparkleIcon className="h-3.5 w-3.5 text-[#FBB931]" />
            <span>Next-Gen URL Management & Real-Time Analytics</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            Short Links.{' '}
            <span className="bg-gradient-to-r from-[#EA6113] via-[#F88F22] to-[#FBB931] bg-clip-text text-transparent">
              Infinite Reach.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-sm sm:text-base text-amber-200/80 leading-relaxed drop-shadow-sm">
            Create memorable branded short links, capture real-time visitor telemetry,
            build link-in-bio hubs, and automate UTM campaigns with a sleek, developer-grade platform.
          </p>

          <div className="pointer-events-auto mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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


          {/* Make it Short Card */}
          <div className="mt-8 flex flex-col items-center">
            <Link
              to="/register"
              className={`pointer-events-auto group inline-flex items-center gap-3.5 sm:gap-4 rounded-full p-2 pl-3.5 pr-3 border backdrop-blur-md transition-all duration-300 active:scale-[0.98] ${
                isLight
                  ? 'border-[#EA6113]/35 bg-[#FFF8EB]/95 shadow-[0_6px_25px_rgba(234,97,19,0.12)] hover:border-[#EA6113]/60 hover:shadow-[0_8px_30px_rgba(234,97,19,0.22)]'
                  : 'border-[#F88F22]/35 bg-[#0e0602]/85 shadow-[0_0_30px_rgba(234,97,19,0.22)] hover:border-[#FBB931]/60 hover:shadow-[0_0_40px_rgba(251,185,49,0.35)]'
              }`}
            >
              {/* Left Link Chain Icon Circle */}
              <div
                className={`flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full border transition-transform duration-300 group-hover:scale-105 ${
                  isLight
                    ? 'border-[#EA6113]/35 bg-[#FFEDCC] text-[#EA6113] shadow-[0_2px_8px_rgba(234,97,19,0.15)]'
                    : 'border-[#F88F22]/40 bg-[#1a0a03]/90 text-[#F88F22] shadow-[0_0_15px_rgba(234,97,19,0.35)]'
                }`}
              >
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 transition-transform duration-300 group-hover:rotate-12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>

              {/* Vertical Divider */}
              <div
                className={`h-7 sm:h-8 w-px ${isLight ? 'bg-[#EA6113]/25' : 'bg-white/10'}`}
              />

              {/* Middle Text */}
              <div className="text-left pr-2 sm:pr-4">
                <div
                  className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                    isLight ? 'text-[#1F0E02] group-hover:text-[#EA6113]' : 'text-white group-hover:text-[#FBB931]'
                  }`}
                >
                  Make it Short
                </div>
                <div
                  className={`text-[11px] sm:text-xs font-normal ${
                    isLight ? 'text-[#6B3B10]/80' : 'text-zinc-400'
                  }`}
                >
                  Turn your long link into a short one
                </div>
              </div>

              {/* Right Arrow Button Circle */}
              <div
                className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white shadow-[0_0_18px_rgba(234,97,19,0.55)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_26px_rgba(251,185,49,0.7)] group-hover:from-[#F88F22] group-hover:to-[#FBB931]"
              >
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </div>
            </Link>

            {/* Feature Highlights beneath Make it Short */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-[13px] font-medium select-none">
              <div className="inline-flex items-center gap-1.5">
                <svg className={`h-4 w-4 shrink-0 ${isLight ? 'text-[#EA6113]' : 'text-[#F88F22]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span className={isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}>Fast</span>
              </div>

              <div className="inline-flex items-center gap-1.5">
                <svg className={`h-4 w-4 shrink-0 ${isLight ? 'text-[#EA6113]' : 'text-[#F88F22]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <polyline points="9 12 11 14 15 10" />
                </svg>
                <span className={isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}>Secure</span>
              </div>

              <div className="inline-flex items-center gap-1.5">
                <svg className={`h-4 w-4 shrink-0 ${isLight ? 'text-[#EA6113]' : 'text-[#F88F22]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.33-6 4Z" />
                </svg>
                <span className={isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}>No expiry</span>
              </div>

              <div className="inline-flex items-center gap-1.5">
                <svg className={`h-4 w-4 shrink-0 ${isLight ? 'text-[#EA6113]' : 'text-[#F88F22]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 20v-5M10 20v-9M15 20V4M20 20v-7" />
                </svg>
                <span className={isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}>Track analytics</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20 md:mt-24 pointer-events-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Engineered for Performance & Scale</h2>
            <p className="text-xs sm:text-sm text-amber-200/60 mt-2">Everything you need to deliver, track, and optimize every redirection.</p>
          </div>

          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => {
              const Icon = f.Icon;
              const Graphic = f.Graphic;
              return (
                <div
                  key={f.title1 + f.title2}
                  className={`relative rounded-3xl border p-5 sm:p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 group overflow-hidden flex flex-col justify-between ${
                    isLight
                      ? 'border-[#EA6113]/25 bg-[#FFF8EB]/95 shadow-[0_8px_30px_rgba(234,97,19,0.08)] hover:border-[#EA6113]/60 hover:shadow-[0_12px_35px_rgba(234,97,19,0.18)]'
                      : 'border-[#F88F22]/25 bg-[#0a0401]/90 shadow-[0_0_20px_rgba(0,0,0,0.8)] hover:border-[#FBB931]/60 hover:shadow-[0_0_35px_rgba(248,143,34,0.3)]'
                  }`}
                >
                  {/* Ambient background glow inside card */}
                  <div className="pointer-events-none absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[#EA6113]/10 blur-2xl group-hover:bg-[#EA6113]/20 transition-colors" />

                  {/* Card body: 2-column layout (Left content, Right mockup) */}
                  <div className="relative z-10 grid grid-cols-1 min-[420px]:grid-cols-12 gap-3 sm:gap-4 items-center">
                    {/* Left Column: Icon + Title + Description + Action */}
                    <div className="min-[420px]:col-span-7 flex flex-col justify-between h-full">
                      <div>
                        {/* Top Icon Badge */}
                        <div
                          className={`mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                            isLight
                              ? 'border-[#EA6113]/30 bg-[#FFEDCC] text-[#EA6113]'
                              : 'border-[#F88F22]/35 bg-[#180a03] text-[#F88F22] shadow-[0_0_12px_rgba(234,97,19,0.25)]'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        {/* 2-line title matching reference image */}
                        <h3 className="text-lg sm:text-xl font-bold tracking-tight leading-tight">
                          <span className={`block ${isLight ? 'text-[#1F0E02]' : 'text-white'}`}>{f.title1}</span>
                          <span className="block bg-gradient-to-r from-[#EA6113] via-[#F88F22] to-[#FBB931] bg-clip-text text-transparent">
                            {f.title2}
                          </span>
                        </h3>

                        {/* Description */}
                        <p className={`mt-2.5 text-xs leading-relaxed ${isLight ? 'text-[#6B3B10]/80' : 'text-zinc-400'}`}>
                          {f.desc}
                        </p>
                      </div>

                      {/* Bottom Action: Learn more with circular arrow */}
                      <Link
                        to="/register"
                        className="mt-5 inline-flex items-center gap-2 text-xs font-semibold transition-all group/link"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 group-hover:bg-gradient-to-r group-hover:from-[#EA6113] group-hover:to-[#F88F22] group-hover:text-white group-hover:border-[#FBB931]/60 group-hover:shadow-[0_0_12px_rgba(234,97,19,0.5)] ${
                            isLight
                              ? 'border-[#EA6113]/30 bg-[#FFEDCC] text-[#EA6113]'
                              : 'border-[#F88F22]/40 bg-[#160a03] text-[#F88F22]'
                          }`}
                        >
                          <svg
                            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        </div>
                        <span
                          className={`transition-colors ${
                            isLight ? 'text-[#6B3B10] group-hover:text-[#EA6113]' : 'text-zinc-300 group-hover:text-[#FBB931]'
                          }`}
                        >
                          Learn more →
                        </span>
                      </Link>
                    </div>

                    {/* Right Column: Visual Mockup matching reference image */}
                    <div className="min-[420px]:col-span-5 flex items-center justify-center py-1 sm:py-2">
                      <Graphic isLight={isLight} />
                    </div>
                  </div>
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
