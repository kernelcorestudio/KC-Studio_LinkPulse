// 3D Isometric Extruded Donut / Pie Chart (Retro-Future Cyberpunk SaaS)
import { useState } from 'react';

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

export function PieChart3D({
  labels = [],
  data = [],
  colors = DEFAULT_COLORS,
  title = '3D PIE CHART',
  height = 320,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Normalize numbers and filter out zeroes or invalid values
  const rawItems = labels.map((label, i) => ({
    label: String(label || `Item ${i + 1}`),
    value: Math.max(0, Number(data[i]) || 0),
    color: colors[i % colors.length] || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    origIndex: i,
  }));

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

  // Calculate slice angles
  // Start at top-back: -PI/2
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

  // Sort slices from back to front using Painter's algorithm
  // In SVG, +y goes down (towards the viewer). Slices with minimum y_mid are at the back.
  const sortedSlices = [...slices].sort(
    (a, b) => Math.sin(a.midAngle) - Math.sin(b.midAngle)
  );

  return (
    <div className="relative flex flex-col items-center select-none w-full">
      {/* 3D SVG Canvas */}
      <div className="relative w-full max-w-[540px]" style={{ minHeight: height }}>
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
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#000000" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
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

          {/* 2. Slices rendered from Back to Front (Painter's algorithm) */}
          {sortedSlices.map((slice) => {
            const isHovered = hoveredIndex === slice.id;

            // Explode gap + 3D lift on hover
            const baseGap = slices.length > 1 ? 5 : 0;
            const gap = isHovered ? baseGap + 7 : baseGap;
            const liftY = isHovered ? -6 : 0;

            const ox = cx + Math.cos(slice.midAngle) * gap;
            const oy = cy + Math.sin(slice.midAngle) * gap * (Ry / Rx) + liftY;

            const t1 = slice.startAngle;
            const t2 = slice.endAngle;
            const delta = t2 - t1;
            const isFullCircle = delta >= 2 * Math.PI - 0.001;

            // Top face path coordinates
            const xOut1 = ox + Rx * Math.cos(t1);
            const yOut1 = oy + Ry * Math.sin(t1);
            const xOut2 = ox + Rx * Math.cos(t2);
            const yOut2 = oy + Ry * Math.sin(t2);
            const xIn1 = ox + rx * Math.cos(t1);
            const yIn1 = oy + ry * Math.sin(t1);
            const xIn2 = ox + rx * Math.cos(t2);
            const yIn2 = oy + ry * Math.sin(t2);

            const largeArc = delta > Math.PI ? 1 : 0;

            let topFacePath = '';
            if (isFullCircle) {
              const mid = t1 + Math.PI;
              const xOutM = ox + Rx * Math.cos(mid);
              const yOutM = oy + Ry * Math.sin(mid);
              const xInM = ox + rx * Math.cos(mid);
              const yInM = oy + ry * Math.sin(mid);

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

              // Facing viewer when sin(aMid) > 0 (front of chart)
              if (Math.sin(aMid) > 0) {
                const xa = ox + Rx * Math.cos(a1);
                const ya = oy + Ry * Math.sin(a1);
                const xb = ox + Rx * Math.cos(a2);
                const yb = oy + Ry * Math.sin(a2);

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

              // Facing viewer inside the hole when sin(aMid) < 0
              if (Math.sin(aMid) < 0) {
                const xa = ox + rx * Math.cos(a1);
                const ya = oy + ry * Math.sin(a1);
                const xb = ox + rx * Math.cos(a2);
                const yb = oy + ry * Math.sin(a2);

                innerSegments.push(
                  `M ${xa} ${ya} L ${xb} ${yb} L ${xb} ${yb + H} L ${xa} ${ya + H} Z`
                );
              }
            }

            // Percentage label position (center of top face)
            const midR = (Rx + rx) / 2;
            const midr = (Ry + ry) / 2;
            const labelX = ox + midR * Math.cos(slice.midAngle);
            const labelY = oy + midr * Math.sin(slice.midAngle);

            return (
              <g
                key={slice.id}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredIndex(slice.id)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* A. Inner hole back wall */}
                {innerSegments.map((d, i) => (
                  <g key={`in-${i}`}>
                    <path d={d} fill={slice.color} />
                    <path d={d} fill="url(#hole-shadow)" />
                  </g>
                ))}

                {/* B. Radial Cut 1 */}
                {showCut1 && (
                  <g>
                    <path d={cut1Path} fill={slice.color} />
                    <path d={cut1Path} fill="rgba(0,0,0,0.22)" />
                  </g>
                )}

                {/* C. Radial Cut 2 */}
                {showCut2 && (
                  <g>
                    <path d={cut2Path} fill={slice.color} />
                    <path d={cut2Path} fill="rgba(0,0,0,0.32)" />
                  </g>
                )}

                {/* D. Outer front cylinder wall */}
                {outerSegments.map((d, i) => (
                  <g key={`out-${i}`}>
                    <path d={d} fill={slice.color} />
                    <path d={d} fill="url(#wall-lighting)" />
                  </g>
                ))}

                {/* E. Top Face Cap */}
                <path
                  d={topFacePath}
                  fill={slice.color}
                  stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.18)'}
                  strokeWidth={isHovered ? 1.8 : 0.8}
                  style={{
                    filter: isHovered
                      ? `drop-shadow(0 0 8px ${slice.color}99)`
                      : undefined,
                  }}
                />

                {/* F. Percentage on top surface (matching reference image) */}
                {slice.percentage >= 6 && (
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize={slice.percentage >= 15 ? '13' : '11'}
                    fontWeight="800"
                    className="font-mono select-none pointer-events-none"
                    style={{
                      textShadow: '0 1px 3px rgba(0,0,0,0.85)',
                    }}
                  >
                    {slice.percentage}%
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Callout Pointer Lines & Text (like reference image) */}
          {slices.map((slice) => {
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
                className="cursor-pointer transition-opacity duration-150"
                style={{ opacity: hoveredIndex === null || isHovered ? 1 : 0.45 }}
                onMouseEnter={() => setHoveredIndex(slice.id)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Pointer Line */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={isHovered ? slice.color : 'rgba(255,227,179,0.35)'}
                  strokeWidth={isHovered ? 1.8 : 1}
                  strokeLinecap="round"
                />

                {/* Small indicator dot at anchor */}
                <circle
                  cx={startX}
                  cy={startY}
                  r={isHovered ? 3 : 2}
                  fill={slice.color}
                />

                {/* Callout Label & Value */}
                <text
                  x={endX + (isRight ? 6 : -6)}
                  y={elbowY - 3}
                  textAnchor={isRight ? 'start' : 'end'}
                  fill={isHovered ? '#ffffff' : '#FFE3B3'}
                  fontSize="11"
                  fontWeight="600"
                  className="select-none font-sans"
                >
                  {slice.label.length > 14 ? `${slice.label.slice(0, 12)}…` : slice.label}
                </text>
                <text
                  x={endX + (isRight ? 6 : -6)}
                  y={elbowY + 11}
                  textAnchor={isRight ? 'start' : 'end'}
                  fill={isHovered ? slice.color : 'rgba(251,185,49,0.7)'}
                  fontSize="10"
                  fontWeight="600"
                  className="font-mono select-none"
                >
                  {slice.value.toLocaleString()} ({slice.percentage}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Interactive Legend Pills Below */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 max-w-md px-2">
        {slices.map((slice) => {
          const isHovered = hoveredIndex === slice.id;
          return (
            <button
              key={slice.id}
              type="button"
              onMouseEnter={() => setHoveredIndex(slice.id)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all duration-150 ${
                isHovered
                  ? 'border-[#F88F22] bg-[#F88F22]/20 text-white scale-105 shadow-[0_0_12px_rgba(234,97,19,0.4)]'
                  : 'border-zinc-800 bg-[#121212] text-amber-200/70 hover:border-[#F88F22]/40 hover:text-white'
              }`}
            >
              <span
                className="h-2 w-2 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: slice.color }}
              />
              <span className="truncate max-w-[100px]">{slice.label}</span>
              <span className="font-mono text-[10px] text-amber-200/50">
                {slice.percentage}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
