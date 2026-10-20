// Interactive 3D Feature Graphics Mockups for Landing Page Grid
// Recreates the custom UI designs for the 6 feature cards matching user reference image.

export function AnalyticsGraphic({ isLight }) {
  return (
    <div
      className={`relative w-full max-w-[185px] rounded-2xl border p-2.5 sm:p-3 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-[1.03] ${
        isLight
          ? 'bg-[#FFF8EB] border-[#EA6113]/25 shadow-[0_8px_20px_rgba(234,97,19,0.1)]'
          : 'bg-[#100702]/95 border-[#F88F22]/30 shadow-[0_0_25px_rgba(234,97,19,0.25)]'
      }`}
    >
      {/* Top Badge */}
      <div
        className={`flex items-center justify-between rounded-lg px-2 py-1.5 border mb-2.5 ${
          isLight ? 'bg-[#FFEDCC] border-[#EA6113]/20' : 'bg-[#180a03] border-[#F88F22]/25'
        }`}
      >
        <div>
          <div className={`text-xs font-bold leading-none ${isLight ? 'text-[#1F0E02]' : 'text-white'}`}>12.4K</div>
          <div className={`text-[9px] ${isLight ? 'text-[#6B3B10]/70' : 'text-zinc-400'}`}>Total Clicks</div>
        </div>
        <div className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-400">
          <span>↑</span>
          <span>12%</span>
        </div>
      </div>

      {/* 3D Vertical Amber Bars + Trend Curve */}
      <div className="relative h-20 flex items-end justify-between px-1">
        {/* Background wave curve overlay */}
        <svg className="absolute inset-0 h-full w-full pointer-events-none" viewBox="0 0 160 80" fill="none">
          <path
            d="M 0 52 Q 30 18, 60 42 T 110 22 T 160 38"
            stroke="#FBB931"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="drop-shadow(0 0 6px rgba(251,185,49,0.7))"
          />
          <path
            d="M 0 52 Q 30 18, 60 42 T 110 22 T 160 38 L 160 80 L 0 80 Z"
            fill="url(#analyticsTrendGrad)"
            opacity="0.25"
          />
          <defs>
            <linearGradient id="analyticsTrendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EA6113" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        {/* 4 Glowing Amber Bars */}
        <div className="relative z-10 w-3.5 h-16 rounded-t-sm bg-gradient-to-t from-[#EA6113] to-[#FBB931] shadow-[0_0_12px_rgba(234,97,19,0.55)] transition-all duration-300 group-hover:h-17" />
        <div className="relative z-10 w-3.5 h-11 rounded-t-sm bg-gradient-to-t from-[#EA6113] to-[#F88F22] shadow-[0_0_8px_rgba(234,97,19,0.4)] transition-all duration-300 group-hover:h-12" />
        <div className="relative z-10 w-3.5 h-7 rounded-t-sm bg-gradient-to-t from-[#EA6113] to-[#F88F22] shadow-[0_0_6px_rgba(234,97,19,0.3)] transition-all duration-300 group-hover:h-8" />
        <div className="relative z-10 w-3.5 h-14 rounded-t-sm bg-gradient-to-t from-[#EA6113] to-[#FBB931] shadow-[0_0_10px_rgba(234,97,19,0.5)] transition-all duration-300 group-hover:h-15" />
      </div>

      {/* Subtle bottom ambient wave glow */}
      <div className="mt-1.5 h-0.5 w-full bg-gradient-to-r from-transparent via-[#F88F22]/40 to-transparent" />
    </div>
  );
}

export function SmartLinksGraphic({ isLight }) {
  return (
    <div className="relative w-full max-w-[185px] h-[155px] flex items-center justify-center">
      {/* Concentric Orbital Rings */}
      <div
        className={`absolute w-36 h-36 rounded-full border border-dashed transition-transform duration-700 group-hover:rotate-45 ${
          isLight ? 'border-[#EA6113]/25' : 'border-[#F88F22]/25'
        }`}
      />
      <div
        className={`absolute w-28 h-28 rounded-full border ${
          isLight ? 'border-[#EA6113]/30' : 'border-[#F88F22]/30'
        }`}
      />

      {/* Orbiting Orbital Dots */}
      <div className="absolute top-3 right-6 h-2 w-2 rounded-full bg-[#FBB931] shadow-[0_0_8px_#FBB931]" />
      <div className="absolute bottom-4 left-6 h-1.5 w-1.5 rounded-full bg-[#EA6113] shadow-[0_0_6px_#EA6113]" />

      {/* Center Golden Token */}
      <div
        className={`relative z-10 flex h-13 w-13 items-center justify-center rounded-2xl border-2 transition-transform duration-300 group-hover:scale-110 ${
          isLight
            ? 'border-[#EA6113]/40 bg-[#FFEDCC] text-[#EA6113] shadow-[0_4px_16px_rgba(234,97,19,0.25)]'
            : 'border-[#F88F22]/60 bg-gradient-to-br from-[#EA6113]/40 to-[#120601] text-[#FBB931] shadow-[0_0_25px_rgba(234,97,19,0.55)]'
        }`}
      >
        <svg
          className="h-7 w-7 transition-transform duration-300 group-hover:rotate-12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      </div>

      {/* 4 Floating Pills matching reference image */}
      {/* Top Right: Custom Slug */}
      <div
        className={`absolute top-0.5 right-1 z-20 rounded-full border px-2 py-0.5 text-[9px] font-medium shadow-md transition-transform duration-300 group-hover:-translate-y-1 ${
          isLight ? 'border-[#EA6113]/30 bg-[#FFF8EB] text-[#1F0E02]' : 'border-[#F88F22]/40 bg-[#160a03]/95 text-zinc-200'
        }`}
      >
        Custom Slug
      </div>

      {/* Left: Expiry Date */}
      <div
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-20 rounded-full border px-2 py-0.5 text-[9px] font-medium shadow-md transition-transform duration-300 group-hover:-translate-x-1 ${
          isLight ? 'border-[#EA6113]/30 bg-[#FFF8EB] text-[#1F0E02]' : 'border-[#F88F22]/40 bg-[#160a03]/95 text-zinc-200'
        }`}
      >
        Expiry Date
      </div>

      {/* Right: Password */}
      <div
        className={`absolute right-0 top-1/2 -translate-y-1/2 z-20 rounded-full border px-2 py-0.5 text-[9px] font-medium shadow-md transition-transform duration-300 group-hover:translate-x-1 ${
          isLight ? 'border-[#EA6113]/30 bg-[#FFF8EB] text-[#1F0E02]' : 'border-[#F88F22]/40 bg-[#160a03]/95 text-zinc-200'
        }`}
      >
        Password
      </div>

      {/* Bottom: utm_campaign=sale */}
      <div
        className={`absolute bottom-0 z-20 rounded-full border px-2.5 py-0.5 text-[9px] font-mono font-medium shadow-md transition-transform duration-300 group-hover:translate-y-1 ${
          isLight ? 'border-[#EA6113]/40 bg-[#FFF8EB] text-[#EA6113]' : 'border-[#F88F22]/50 bg-[#160a03]/95 text-[#FBB931]'
        }`}
      >
        utm_campaign=sale
      </div>
    </div>
  );
}

export function CampaignsGraphic({ isLight }) {
  return (
    <div
      className={`relative w-full max-w-[175px] rounded-2xl border p-2.5 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:rotate-0 rotate-[3deg] ${
        isLight
          ? 'bg-[#FFF8EB] border-[#EA6113]/25 shadow-[0_8px_20px_rgba(234,97,19,0.1)]'
          : 'bg-[#100702]/95 border-[#F88F22]/30 shadow-[0_0_25px_rgba(234,97,19,0.25)]'
      }`}
    >
      {/* Tag 1: Active Product Tag */}
      <div className="flex items-center justify-between rounded-xl p-1.5 px-2.5 mb-1.5 border border-[#F88F22]/50 bg-gradient-to-r from-[#EA6113]/35 to-[#F88F22]/20 shadow-[0_0_12px_rgba(234,97,19,0.35)]">
        <span className="text-[11px] font-bold text-white"># Product</span>
        <span className="rounded-full bg-[#EA6113] px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">124</span>
      </div>

      {/* Tag 2: Marketing */}
      <div
        className={`flex items-center justify-between rounded-xl p-1.5 px-2.5 mb-1.5 border ${
          isLight ? 'bg-black/[0.02] border-black/5 text-[#1F0E02]' : 'bg-white/[0.03] border-white/5 text-zinc-300'
        }`}
      >
        <span className="text-[11px] font-medium"># Marketing</span>
        <span className={`text-[10px] font-semibold ${isLight ? 'text-[#6B3B10]' : 'text-zinc-400'}`}>86</span>
      </div>

      {/* Tag 3: Campaign */}
      <div
        className={`flex items-center justify-between rounded-xl p-1.5 px-2.5 mb-1.5 border ${
          isLight ? 'bg-black/[0.02] border-black/5 text-[#1F0E02]' : 'bg-white/[0.03] border-white/5 text-zinc-300'
        }`}
      >
        <span className="text-[11px] font-medium"># Campaign</span>
        <span className={`text-[10px] font-semibold ${isLight ? 'text-[#6B3B10]' : 'text-zinc-400'}`}>42</span>
      </div>

      {/* Tag 4: Social */}
      <div
        className={`flex items-center justify-between rounded-xl p-1.5 px-2.5 border ${
          isLight ? 'bg-black/[0.02] border-black/5 text-[#1F0E02]' : 'bg-white/[0.03] border-white/5 text-zinc-300'
        }`}
      >
        <span className="text-[11px] font-medium"># Social</span>
        <span className={`text-[10px] font-semibold ${isLight ? 'text-[#6B3B10]' : 'text-zinc-400'}`}>31</span>
      </div>
    </div>
  );
}

export function BioGraphic({ isLight }) {
  return (
    <div className="relative w-full max-w-[175px] flex items-center justify-center">
      {/* Amber burst rays on the right edge */}
      <div className="absolute -right-2 top-8 flex flex-col gap-1 text-[#FBB931] opacity-80 group-hover:scale-115 transition-transform duration-300">
        <span className="text-xs font-bold leading-none transform rotate-12">\</span>
        <span className="text-xs font-bold leading-none">—</span>
        <span className="text-xs font-bold leading-none transform -rotate-12">/</span>
      </div>

      {/* Smartphone frame */}
      <div
        className={`w-34 sm:w-36 rounded-2xl border-2 p-2 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1 ${
          isLight
            ? 'border-[#EA6113]/35 bg-[#FFF8EB] shadow-[0_8px_25px_rgba(234,97,19,0.15)]'
            : 'border-[#F88F22]/35 bg-[#0e0602] shadow-[0_0_25px_rgba(234,97,19,0.3)]'
        }`}
      >
        {/* User avatar + verified check */}
        <div className="flex flex-col items-center mb-2">
          <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-[#EA6113] to-[#FBB931] flex items-center justify-center text-white shadow-sm">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] font-bold ${isLight ? 'text-[#1F0E02]' : 'text-zinc-200'}`}>@yourname</span>
            <span className="flex h-3 w-3 items-center justify-center rounded-full bg-sky-500 text-[8px] text-white">✓</span>
          </div>
        </div>

        {/* Links list inside phone */}
        <div className="space-y-1">
          <div
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1 px-2 text-[9px] font-medium border ${
              isLight ? 'bg-white border-black/5 text-[#1F0E02]' : 'bg-white/[0.05] border-white/5 text-zinc-200'
            }`}
          >
            <span>🔗</span>
            <span>Website</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1 px-2 text-[9px] font-medium border ${
              isLight ? 'bg-white border-black/5 text-[#1F0E02]' : 'bg-white/[0.05] border-white/5 text-zinc-200'
            }`}
          >
            <span className="text-red-500">▶</span>
            <span>YouTube</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1 px-2 text-[9px] font-medium border ${
              isLight ? 'bg-white border-black/5 text-[#1F0E02]' : 'bg-white/[0.05] border-white/5 text-zinc-200'
            }`}
          >
            <span>🐙</span>
            <span>GitHub</span>
          </div>
          <div
            className={`flex items-center justify-center gap-1.5 rounded-lg py-1 px-2 text-[9px] font-medium border ${
              isLight ? 'bg-white border-black/5 text-[#1F0E02]' : 'bg-white/[0.05] border-white/5 text-zinc-200'
            }`}
          >
            <span>🌐</span>
            <span>Portfolio</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QrGraphic({ isLight }) {
  return (
    <div className="relative w-full max-w-[175px] flex flex-col items-center justify-center">
      {/* Corner Brackets Frame around QR */}
      <div className="relative p-2">
        <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#FBB931]" />
        <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#FBB931]" />
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#FBB931]" />
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#FBB931]" />

        {/* Orbiting Curved Tracking Arrow */}
        <svg
          className="absolute -inset-2.5 h-[calc(100%+20px)] w-[calc(100%+20px)] pointer-events-none transition-transform duration-700 group-hover:rotate-45"
          viewBox="0 0 100 100"
        >
          <path d="M 90 50 A 40 40 0 0 1 50 90" fill="none" stroke="#FBB931" strokeWidth="2" strokeDasharray="4 2" />
          <polygon points="48,93 54,87 53,93" fill="#FBB931" />
        </svg>

        {/* QR Code Glass Card */}
        <div
          className={`rounded-xl border p-2.5 shadow-xl transition-transform duration-300 group-hover:scale-105 ${
            isLight
              ? 'bg-[#FFF8EB] border-[#EA6113]/30 shadow-[0_0_20px_rgba(234,97,19,0.2)]'
              : 'bg-[#120702] border-[#F88F22]/40 shadow-[0_0_25px_rgba(234,97,19,0.4)]'
          }`}
        >
          <svg className="h-16 w-16" viewBox="0 0 70 70" fill={isLight ? '#EA6113' : '#FBB931'}>
            {/* Top-left marker */}
            <rect x="5" y="5" width="20" height="20" rx="3" fill="none" stroke={isLight ? '#EA6113' : '#FBB931'} strokeWidth="4" />
            <rect x="10" y="10" width="10" height="10" rx="1" />
            {/* Top-right marker */}
            <rect x="45" y="5" width="20" height="20" rx="3" fill="none" stroke={isLight ? '#EA6113' : '#FBB931'} strokeWidth="4" />
            <rect x="50" y="10" width="10" height="10" rx="1" />
            {/* Bottom-left marker */}
            <rect x="5" y="45" width="20" height="20" rx="3" fill="none" stroke={isLight ? '#EA6113' : '#FBB931'} strokeWidth="4" />
            <rect x="10" y="50" width="10" height="10" rx="1" />
            {/* QR Data Dots */}
            <rect x="30" y="8" width="5" height="5" />
            <rect x="30" y="18" width="5" height="5" />
            <rect x="38" y="12" width="5" height="5" />
            <rect x="12" y="30" width="5" height="5" />
            <rect x="20" y="35" width="5" height="5" />
            <rect x="30" y="30" width="8" height="8" rx="1" />
            <rect x="42" y="32" width="6" height="6" />
            <rect x="52" y="30" width="5" height="5" />
            <rect x="60" y="36" width="5" height="5" />
            <rect x="30" y="45" width="6" height="6" />
            <rect x="40" y="45" width="5" height="5" />
            <rect x="55" y="48" width="8" height="8" />
            <rect x="34" y="56" width="6" height="6" />
            <rect x="46" y="58" width="5" height="5" />
            <rect x="58" y="60" width="6" height="6" />
          </svg>
        </div>
      </div>

      {/* Floating Bottom Badge */}
      <div
        className={`-mt-2.5 z-10 flex items-center gap-2 rounded-xl border px-2.5 py-1 text-[10px] font-semibold shadow-lg backdrop-blur-md ${
          isLight ? 'bg-[#FFEDCC] border-[#EA6113]/30 text-[#1F0E02]' : 'bg-[#180a03] border-[#F88F22]/35 text-white'
        }`}
      >
        <span className="text-amber-400">👥</span>
        <span>
          2.3K <span className={`font-normal ${isLight ? 'text-[#6B3B10]/70' : 'text-zinc-400'}`}>Scans</span>
        </span>
        <span className="text-emerald-400 font-bold">↑ 18%</span>
      </div>
    </div>
  );
}

export function BulkGraphic({ isLight }) {
  return (
    <div
      className={`relative w-full max-w-[180px] rounded-2xl border p-2.5 shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:rotate-0 rotate-[3deg] ${
        isLight
          ? 'bg-[#FFF8EB] border-[#EA6113]/25 shadow-[0_8px_20px_rgba(234,97,19,0.1)]'
          : 'bg-[#100702]/95 border-[#F88F22]/30 shadow-[0_0_25px_rgba(234,97,19,0.25)]'
      }`}
    >
      {/* Top Upload Box */}
      <div
        className={`rounded-xl border border-dashed p-2 flex items-center justify-between mb-2 ${
          isLight ? 'bg-[#FFEDCC] border-[#EA6113]/35' : 'bg-[#180a03] border-[#F88F22]/40'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <svg
            className={`h-4 w-4 shrink-0 ${isLight ? 'text-[#EA6113]' : 'text-[#FBB931]'}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <div>
            <div className={`text-[10px] font-bold leading-tight ${isLight ? 'text-[#1F0E02]' : 'text-white'}`}>
              Upload CSV
            </div>
            <div className={`text-[8px] ${isLight ? 'text-[#6B3B10]/70' : 'text-zinc-400'}`}>Drag & drop or browse</div>
          </div>
        </div>
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-r from-[#EA6113] to-[#F88F22] text-white shadow-sm">
          <span className="text-[10px] font-bold">↑</span>
        </div>
      </div>

      {/* File status list */}
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between rounded-lg p-1 px-1.5 text-[9px] border ${
            isLight ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.02] border-white/5'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>📄</span>
            <span className={`font-mono ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`}>links.csv</span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">✓ 250 links</span>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg p-1 px-1.5 text-[9px] border ${
            isLight ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.02] border-white/5'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>📄</span>
            <span className={`font-mono ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`}>products.csv</span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">✓ 430 links</span>
        </div>

        <div
          className={`flex items-center justify-between rounded-lg p-1 px-1.5 text-[9px] border ${
            isLight ? 'bg-black/[0.02] border-black/5' : 'bg-white/[0.02] border-white/5'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>📄</span>
            <span className={`font-mono ${isLight ? 'text-[#1F0E02]' : 'text-zinc-300'}`}>campaign.csv</span>
          </div>
          <span className="text-emerald-400 font-bold flex items-center gap-0.5">✓ 120 links</span>
        </div>
      </div>
    </div>
  );
}
