// 3D Isometric Extruded Donut / Pie Chart (Retro-Future Cyberpunk SaaS)
import { useState } from 'react';
import { useTheme } from '../lib/theme';

const DEFAULT_COLORS = [
  '#FF5757', // Coral Red (like reference)
  '#FF8E3C', // Warm Orange
  '#FFC043', // Golden Amber
  '#4EBA6F', // Vibrant Green
  '#22B8A6', // Teal
  '#25B6D2', // Cyan
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

// Comprehensive country name mapping for regional analytics
const COUNTRY_INFO = {
  US: 'United States',
  CA: 'Canada',
  JP: 'Japan',
  FR: 'France',
  AU: 'Australia',
  BR: 'Brazil',
  GB: 'United Kingdom',
  DE: 'Germany',
  IN: 'India',
  ES: 'Spain',
  IT: 'Italy',
  NL: 'Netherlands',
  MX: 'Mexico',
  KR: 'South Korea',
  SG: 'Singapore',
  SE: 'Sweden',
  CH: 'Switzerland',
  CN: 'China',
  RU: 'Russia',
  ZA: 'South Africa',
  NZ: 'New Zealand',
  IE: 'Ireland',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  AR: 'Argentina',
  PL: 'Poland',
  BE: 'Belgium',
  AT: 'Austria',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PT: 'Portugal',
  TR: 'Turkey',
  IL: 'Israel',
  ID: 'Indonesia',
  MY: 'Malaysia',
  TH: 'Thailand',
  VN: 'Vietnam',
  PH: 'Philippines',
};

function formatRegion(rawLabel) {
  if (!rawLabel) return { name: 'Unknown', code: '' };
  const upper = String(rawLabel).toUpperCase().trim();
  const name = COUNTRY_INFO[upper];
  if (name) {
    return { name, code: upper };
  }
  // Generic fallback if not a recognized country code (e.g. device types)
  const capitalized = rawLabel.charAt(0).toUpperCase() + rawLabel.slice(1);
  return { name: capitalized, code: '' };
}

export function PieChart3D({
  labels = [],
  data = [],
  colors = DEFAULT_COLORS,
  items = [],
  title = '3D PIE CHART',
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const { isLight } = useTheme();

  // Normalize numbers and filter out zeroes or invalid values
  const rawItems = labels.map((label, i) => {
    const extra = items[i] || {};
    return {
      label: String(label || `Item ${i + 1}`),
      value: Math.max(0, Number(data[i]) || 0),
      color: colors[i % colors.length] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      origIndex: i,
      uniques: extra.uniques !== undefined ? Number(extra.uniques) : undefined,
      change: extra.change !== undefined ? Number(extra.change) : undefined,
      ...extra,
    };
  });

  const validItems = rawItems.filter((it) => it.value > 0);
  const total = validItems.reduce((acc, it) => acc + it.value, 0);

  if (!validItems.length || total === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-center">
        <div className="relative flex h-24 w-24 items-center justify-center opacity-40">
          <div className="absolute inset-0 rounded-full border border-dashed border-[#F88F22]/40 animate-spin" />
          <div className="h-10 w-10 rounded-full border border-[#F88F22]/30" />
        </div>
        <p className="mt-3 text-xs text-amber-200/50 font-mono">No telemetry recorded yet</p>
      </div>
    );
  }

  // Calculate slice angles (starting at top-back: -PI/2)
  let currentAngle = -Math.PI / 2;
  const slices = validItems.map((item, idx) => {
    const fraction = item.value / total;
    const startAngle = currentAngle;
    const endAngle = currentAngle + fraction * 2 * Math.PI;
    const midAngle = (startAngle + endAngle) / 2;
    currentAngle = endAngle;

    return {
      ...item,
      id: idx,
      fraction,
      percentage: Math.round(fraction * 100),
      startAngle,
      endAngle,
      midAngle,
    };
  });

  // 3D Geometry configuration
  const cx = 270;
  const cy = 125;
  const Rx = 105; // Outer horizontal radius
  const Ry = 54;  // Outer vertical radius (perspective tilt)
  const rx = 46;  // Inner hole horizontal radius
  const ry = 24;  // Inner hole vertical radius
  const H = 26;   // 3D cylinder extrusion height

  // Precompute base coordinates for all slices
  const baseGap = slices.length > 1 ? 5 : 0;
  const computedSlices = slices.map((slice) => {
    const baseOx = cx + Math.cos(slice.midAngle) * baseGap;
    const baseOy = cy + Math.sin(slice.midAngle) * baseGap * (Ry / Rx);

    // Center of mass of the slice for scale transformOrigin
    const midR = (Rx + rx) / 2;
    const midr = (Ry + ry) / 2;
    const sliceCenterX = baseOx + midR * Math.cos(slice.midAngle);
    const sliceCenterY = baseOy + midr * Math.sin(slice.midAngle) + H / 2;

    // Exploded hover translation: 14px outward along midAngle + 4px 3D lift
    const explodeDist = 14;
    const moveX = Math.cos(slice.midAngle) * explodeDist;
    const moveY = Math.sin(slice.midAngle) * explodeDist * (Ry / Rx) - 4;

    const t1 = slice.startAngle;
    const t2 = slice.endAngle;
    const delta = t2 - t1;
    const isFullCircle = delta >= 2 * Math.PI - 0.001;

    // Top face path coordinates
    const xOut1 = baseOx + Rx * Math.cos(t1);
    const yOut1 = baseOy + Ry * Math.sin(t1);
    const xOut2 = baseOx + Rx * Math.cos(t2);
    const yOut2 = baseOy + Ry * Math.sin(t2);
    const xIn1 = baseOx + rx * Math.cos(t1);
    const yIn1 = baseOy + ry * Math.sin(t1);
    const xIn2 = baseOx + rx * Math.cos(t2);
    const yIn2 = baseOy + ry * Math.sin(t2);

    const largeArc = delta > Math.PI ? 1 : 0;

    let topFacePath = '';
    if (isFullCircle) {
      const mid = t1 + Math.PI;
      const xOutM = baseOx + Rx * Math.cos(mid);
      const yOutM = baseOy + Ry * Math.sin(mid);
      const xInM = baseOx + rx * Math.cos(mid);
      const yInM = baseOy + ry * Math.sin(mid);

      topFacePath = `M ${xOut1} ${yOut1}
        A ${Rx} ${Ry} 0 1 1 ${xOutM} ${yOutM}
        A ${Rx} ${Ry} 0 1 1 ${xOut1} ${yOut1}
        M ${xIn1} ${yIn1}
        A ${rx} ${ry} 0 1 0 ${xInM} ${yInM}
        A ${rx} ${ry} 0 1 0 ${xIn1} ${yIn1} Z`;
    } else {
      topFacePath = `M ${xOut1} ${yOut1}
        A ${Rx} ${Ry} 0 ${largeArc} 1 ${xOut2} ${yOut2}
        L ${xIn2} ${yIn2}
        A ${rx} ${ry} 0 ${largeArc} 0 ${xIn1} ${yIn1}
        Z`;
    }

    // Outer rim highlight arc along the front/top boundary
    const outerHighlightArc = isFullCircle
      ? ''
      : `M ${xOut1} ${yOut1} A ${Rx} ${Ry} 0 ${largeArc} 1 ${xOut2} ${yOut2}`;

    // Radial Cut 1 (start wall): visible when cos(t1) > 0.01 (facing right)
    const showCut1 = !isFullCircle && Math.cos(t1) > 0.01;
    const cut1Path = `M ${xIn1} ${yIn1}
      L ${xOut1} ${yOut1}
      L ${xOut1} ${yOut1 + H}
      L ${xIn1} ${yIn1 + H} Z`;

    // Radial Cut 2 (end wall): visible when cos(t2) < -0.01 (facing left)
    const showCut2 = !isFullCircle && Math.cos(t2) < -0.01;
    const cut2Path = `M ${xOut2} ${yOut2}
      L ${xIn2} ${yIn2}
      L ${xIn2} ${yIn2 + H}
      L ${xOut2} ${yOut2 + H} Z`;

    // Outer cylinder wall segments (front half: sin > 0)
    const outerSegments = [];
    const STEPS = Math.max(8, Math.ceil(delta * 10));
    for (let s = 0; s < STEPS; s++) {
      const a1 = t1 + (delta * s) / STEPS;
      const a2 = t1 + (delta * (s + 1)) / STEPS;
      const aMid = (a1 + a2) / 2;

      if (Math.sin(aMid) > 0) {
        const xa = baseOx + Rx * Math.cos(a1);
        const ya = baseOy + Ry * Math.sin(a1);
        const xb = baseOx + Rx * Math.cos(a2);
        const yb = baseOy + Ry * Math.sin(a2);

        outerSegments.push(
          `M ${xa} ${ya} L ${xb} ${yb} L ${xb} ${yb + H} L ${xa} ${ya + H} Z`
        );
      }
    }

    // Inner hole cylinder wall segments (back half: sin < 0)
    const innerSegments = [];
    for (let s = 0; s < STEPS; s++) {
      const a1 = t1 + (delta * s) / STEPS;
      const a2 = t1 + (delta * (s + 1)) / STEPS;
      const aMid = (a1 + a2) / 2;

      if (Math.sin(aMid) < 0) {
        const xa = baseOx + rx * Math.cos(a1);
        const ya = baseOy + ry * Math.sin(a1);
        const xb = baseOx + rx * Math.cos(a2);
        const yb = baseOy + ry * Math.sin(a2);

        innerSegments.push(
          `M ${xa} ${ya} L ${xb} ${yb} L ${xb} ${yb + H} L ${xa} ${ya + H} Z`
        );
      }
    }

    // Label anchor on top face
    const labelX = baseOx + midR * Math.cos(slice.midAngle);
    const labelY = baseOy + midr * Math.sin(slice.midAngle);

    return {
      ...slice,
      baseOx,
      baseOy,
      sliceCenterX,
      sliceCenterY,
      moveX,
      moveY,
      topFacePath,
      outerHighlightArc,
      showCut1,
      cut1Path,
      showCut2,
      cut2Path,
      outerSegments,
      innerSegments,
      labelX,
      labelY,
    };
  });

  // Sort slices from back to front using Painter's algorithm
  const sortedSlices = [...computedSlices].sort(
    (a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle)
  );

  const hoveredSlice = slices.find((s) => s.id === hoveredIndex);
  const hoveredRegion = hoveredSlice ? formatRegion(hoveredSlice.label) : null;

  return (
    <div
      className="relative flex flex-col items-center select-none w-full"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* 3D SVG Canvas (Completely unobstructed — never covered by any popup) */}
      <div className="relative w-full max-w-[540px]">
        <svg
          viewBox="0 0 540 280"
          className="w-full h-auto overflow-visible"
          style={{ filter: 'drop-shadow(0 15px 25px rgba(0,0,0,0.65))' }}
        >
          <defs>
            {/* Soft ground drop shadow beneath 3D pie */}
            <radialGradient id="pie-ground-shadow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
              <stop offset="60%" stopColor="rgba(0,0,0,0.3)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </radialGradient>

            {/* Cylindrical lighting gradient for side walls */}
            <linearGradient id="wall-lighting" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="40%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.48" />
            </linearGradient>

            {/* Inner hole depth shadow */}
            <linearGradient id="hole-shadow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#000000" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* 1. Ground Shadow */}
          <ellipse
            cx={cx}
            cy={cy + H + 28}
            rx={Rx * 1.08}
            ry={Ry * 0.75}
            fill="url(#pie-ground-shadow)"
          />

          {/* 2. Slices rendered with Smooth Slice Expansion & Radiant White Glow */}
          {sortedSlices.map((slice) => {
            const isHovered = hoveredIndex === slice.id;
            const region = formatRegion(slice.label);

            return (
              <g
                key={slice.id}
                role="button"
                tabIndex={0}
                aria-label={`${region.name}: ${slice.value} clicks, ${slice.percentage}%`}
                className="cursor-pointer outline-none"
                style={{
                  pointerEvents: 'all',
                  transform: isHovered
                    ? `translate(${slice.moveX.toFixed(2)}px, ${slice.moveY.toFixed(2)}px) scale(1.10)`
                    : 'translate(0px, 0px) scale(1)',
                  transformOrigin: `${slice.sliceCenterX.toFixed(1)}px ${slice.sliceCenterY.toFixed(1)}px`,
                  transformBox: 'view-box',
                  transition:
                    'transform 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms cubic-bezier(0.22, 1, 0.36, 1), filter 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                  opacity: hoveredIndex === null || isHovered ? 1 : 0.55,
                  filter: isHovered
                    ? 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 14px rgba(255, 255, 255, 0.55)) drop-shadow(0 0 28px rgba(255, 255, 255, 0.25)) brightness(1.08)'
                    : hoveredIndex !== null
                    ? 'saturate(0.85) brightness(0.85)'
                    : 'none',
                }}
                onPointerEnter={() => setHoveredIndex(slice.id)}
                onPointerLeave={() => setHoveredIndex(null)}
                onFocus={() => setHoveredIndex(slice.id)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => setHoveredIndex(hoveredIndex === slice.id ? null : slice.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setHoveredIndex(hoveredIndex === slice.id ? null : slice.id);
                  }
                }}
              >
                {/* A. Inner hole back wall */}
                {slice.innerSegments.map((d, i) => (
                  <g key={`in-${i}`}>
                    <path d={d} fill={slice.color} pointerEvents="all" />
                    <path d={d} fill="url(#hole-shadow)" pointerEvents="none" />
                    {isHovered && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.2"
                        strokeOpacity="0.75"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                ))}

                {/* B. Radial Cut 1 */}
                {slice.showCut1 && (
                  <g>
                    <path d={slice.cut1Path} fill={slice.color} pointerEvents="all" />
                    <path d={slice.cut1Path} fill="rgba(0,0,0,0.22)" pointerEvents="none" />
                    {isHovered && (
                      <path
                        d={slice.cut1Path}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeOpacity="0.9"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                )}

                {/* C. Radial Cut 2 */}
                {slice.showCut2 && (
                  <g>
                    <path d={slice.cut2Path} fill={slice.color} pointerEvents="all" />
                    <path d={slice.cut2Path} fill="rgba(0,0,0,0.32)" pointerEvents="none" />
                    {isHovered && (
                      <path
                        d={slice.cut2Path}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeOpacity="0.9"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                )}

                {/* D. Outer front cylinder wall with edge highlight */}
                {slice.outerSegments.map((d, i) => (
                  <g key={`out-${i}`}>
                    <path d={d} fill={slice.color} pointerEvents="all" />
                    <path d={d} fill="url(#wall-lighting)" pointerEvents="none" />
                    {isHovered && (
                      <path
                        d={d}
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="1.4"
                        strokeOpacity="0.9"
                        strokeLinejoin="round"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                ))}

                {/* E. Top Face Cap with Crisp White Outline */}
                <path
                  d={slice.topFacePath}
                  fill={slice.color}
                  stroke={isHovered ? (isLight ? '#1F0E02' : '#ffffff') : (isLight ? 'rgba(31,14,2,0.35)' : 'rgba(255,255,255,0.22)')}
                  strokeWidth={isHovered ? 2.5 : (isLight ? 1.2 : 0.8)}
                  strokeLinejoin="round"
                  pointerEvents="all"
                  style={{
                    transition: 'stroke 300ms ease, stroke-width 300ms ease',
                  }}
                />

                {/* E2. Specular Top Rim Highlight on hover */}
                {isHovered && slice.outerHighlightArc && (
                  <path
                    d={slice.outerHighlightArc}
                    fill="none"
                    stroke={isLight ? '#1F0E02' : '#ffffff'}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    pointerEvents="none"
                    style={{
                      filter: isLight ? 'none' : 'drop-shadow(0 0 5px #ffffff)',
                    }}
                  />
                )}

                {/* F. Percentage on top surface (matching reference image) */}
                {slice.percentage >= 6 && (
                  <text
                    x={slice.labelX}
                    y={slice.labelY + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={slice.percentage >= 15 ? '13' : '11'}
                    fontWeight="800"
                    className="font-mono select-none pointer-events-none"
                    style={{
                      textShadow: isHovered
                        ? '0 0 6px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,1)'
                        : '0 1px 3px rgba(0,0,0,0.85)',
                    }}
                  >
                    {slice.percentage}%
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Callout Pointer Lines & Text */}
          {computedSlices.map((slice) => {
            const isHovered = hoveredIndex === slice.id;
            const isRight = Math.cos(slice.midAngle) >= 0;

            // Start on outer boundary
            const startX = cx + Rx * Math.cos(slice.midAngle);
            const startY = cy + Ry * Math.sin(slice.midAngle) + H / 2;

            // Elbow direction
            const elbowX = startX + (isRight ? 32 : -32);
            const elbowY = startY + (Math.sin(slice.midAngle) > 0 ? 14 : -14);
            const endX = elbowX + (isRight ? 38 : -38);

            const pathData = `M ${startX} ${startY} L ${elbowX} ${elbowY} L ${endX} ${elbowY}`;

            return (
              <g
                key={`callout-${slice.id}`}
                className="cursor-pointer outline-none"
                style={{
                  pointerEvents: 'all',
                  opacity: hoveredIndex === null || isHovered ? 1 : 0.25,
                  transition: 'opacity 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                }}
                onPointerEnter={() => setHoveredIndex(slice.id)}
                onPointerLeave={() => setHoveredIndex(null)}
              >
                {/* Pointer Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHovered ? slice.color : (isLight ? '#1F0E02' : 'rgba(255,227,179,0.35)')}
                  strokeWidth={isHovered ? 2 : (isLight ? 1.8 : 1)}
                  strokeLinecap="round"
                  style={{
                    filter: isHovered ? `drop-shadow(0 0 6px ${slice.color})` : 'none',
                    transition: 'all 300ms ease',
                  }}
                />

                {/* Small indicator dot at anchor */}
                <circle
                  cx={startX}
                  cy={startY}
                  r={isHovered ? 3.5 : (isLight ? 2.5 : 2)}
                  fill={isHovered ? (isLight ? slice.color : '#ffffff') : slice.color}
                  stroke={isLight ? '#1F0E02' : (isHovered ? slice.color : 'none')}
                  strokeWidth={isLight ? 1 : (isHovered ? 1.5 : 0)}
                  style={{
                    filter: isHovered && !isLight ? 'drop-shadow(0 0 6px #ffffff)' : 'none',
                    transition: 'all 300ms ease',
                  }}
                />

                {/* Callout Label & Value */}
                <text
                  x={endX + (isRight ? 6 : -6)}
                  y={elbowY - 3}
                  textAnchor={isRight ? 'start' : 'end'}
                  fill={isHovered ? slice.color : (isLight ? '#1F0E02' : '#FFE3B3')}
                  fontSize="11"
                  fontWeight={isLight ? '700' : '600'}
                  className="select-none font-sans"
                >
                  {slice.label.length > 14 ? `${slice.label.slice(0, 12)}…` : slice.label}
                </text>
                <text
                  x={endX + (isRight ? 6 : -6)}
                  y={elbowY + 11}
                  textAnchor={isRight ? 'start' : 'end'}
                  fill={isHovered ? slice.color : (isLight ? '#8C4300' : 'rgba(251,185,49,0.7)')}
                  fontSize="10"
                  fontWeight={isLight ? '700' : '600'}
                  className="font-mono select-none"
                >
                  {slice.value.toLocaleString()} ({slice.percentage}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 4. Dedicated Telemetry Details Card (Positioned BELOW the 3D donut — NEVER overlaps the chart) */}
      <div className="w-full max-w-[420px] px-2 min-h-[56px] flex items-center justify-center mt-0.5 mb-1">
        {hoveredSlice ? (
          <div
            className="w-full rounded-xl border border-[#F88F22]/40 bg-[#0d0906]/95 px-3.5 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.85),0_0_15px_rgba(248,143,34,0.18)] backdrop-blur-md transition-all duration-200 ease-out"
          >
            {/* Header: Region Name + Country Code Badge */}
            <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-1.5 mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 shadow-sm transition-transform duration-200"
                  style={{
                    backgroundColor: hoveredSlice.color,
                    boxShadow: `0 0 10px ${hoveredSlice.color}`,
                    transform: 'scale(1.2)',
                  }}
                />
                <span className="text-xs font-bold text-white tracking-wide truncate">
                  {hoveredRegion?.name}
                </span>
                {hoveredRegion?.code && (
                  <span className="text-[11px] font-mono text-zinc-400">
                    ({hoveredRegion.code})
                  </span>
                )}
              </div>
              {hoveredRegion?.code && (
                <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300 shrink-0">
                  {hoveredRegion.code}
                </span>
              )}
            </div>

            {/* Metrics Row: Clicks • Traffic Share • Uniques / Delta */}
            <div className="flex items-center justify-between text-xs gap-3">
              <div className="flex items-baseline gap-1.5">
                <span className="text-zinc-400 text-[11px]">Clicks:</span>
                <span className="font-mono font-bold text-white tracking-tight">
                  {hoveredSlice.value.toLocaleString()}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-zinc-400 text-[11px]">Share:</span>
                <span className="font-mono font-semibold text-[#FBB931]">
                  {hoveredSlice.percentage}% of Total
                </span>
              </div>
              {hoveredSlice.change !== undefined ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-zinc-400 text-[11px]">Change:</span>
                  <span
                    className={`font-mono font-semibold ${
                      hoveredSlice.change >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {hoveredSlice.change >= 0 ? `+${hoveredSlice.change}%` : `${hoveredSlice.change}%`}
                  </span>
                </div>
              ) : hoveredSlice.uniques !== undefined ? (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-zinc-400 text-[11px]">Uniques:</span>
                  <span className="font-mono text-zinc-300 font-medium">
                    {hoveredSlice.uniques.toLocaleString()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-zinc-800/40 bg-zinc-900/30 px-3 py-1.5 text-[11px] text-zinc-500 font-mono transition-opacity duration-200">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F88F22]/70 animate-pulse" />
            <span>Hover or tap a segment to inspect regional telemetry</span>
          </div>
        )}
      </div>

      {/* 5. Interactive Legend Pills Below */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2 max-w-md px-2">
        {computedSlices.map((slice) => {
          const isHovered = hoveredIndex === slice.id;
          const region = formatRegion(slice.label);

          return (
            <button
              key={slice.id}
              type="button"
              tabIndex={0}
              onMouseEnter={() => setHoveredIndex(slice.id)}
              onMouseLeave={() => setHoveredIndex(null)}
              onFocus={() => setHoveredIndex(slice.id)}
              onBlur={() => setHoveredIndex(null)}
              onClick={() => setHoveredIndex(hoveredIndex === slice.id ? null : slice.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-200 outline-none ${
                isHovered
                  ? 'border-white/90 bg-white/10 text-white scale-105 shadow-[0_0_15px_rgba(255,255,255,0.35),0_0_3px_#ffffff] ring-1 ring-white/60'
                  : hoveredIndex !== null
                  ? 'border-zinc-800/60 bg-[#0d0905]/60 text-zinc-500 opacity-60 hover:opacity-100 hover:border-zinc-700'
                  : 'border-zinc-800 bg-[#121212] text-amber-200/70 hover:border-[#F88F22]/40 hover:text-white'
              }`}
              title={`${region.name} (${slice.label}): ${slice.value.toLocaleString()} clicks (${slice.percentage}%)`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0 transition-transform duration-200"
                style={{
                  backgroundColor: slice.color,
                  boxShadow: isHovered ? `0 0 8px ${slice.color}` : 'none',
                  transform: isHovered ? 'scale(1.3)' : 'scale(1)',
                }}
              />
              <span className="font-semibold tracking-wide">
                {slice.label}
              </span>
              <span className="font-mono text-[10px] text-amber-200/60 font-semibold ml-0.5">
                {slice.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
