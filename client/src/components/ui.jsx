// Sleek Linear / Vercel Dark SaaS UI primitives + Chart.js wrappers
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { EmptyIcon, AlertIcon } from './Icons';
import { PieChart3D } from './PieChart3D';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

const SAAS_GRID = 'rgba(255, 255, 255, 0.04)';
ChartJS.defaults.color = '#71717a';
ChartJS.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';
ChartJS.defaults.font.size = 11;
ChartJS.defaults.plugins.tooltip = {
  ...ChartJS.defaults.plugins.tooltip,
  backgroundColor: '#18181b',
  titleColor: '#f4f4f5',
  bodyColor: '#a1a1aa',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 8,
  displayColors: false,
};

export function Spinner({ label = 'Loading…', inline = false, className = '' }) {
  if (inline) {
    return (
      <div className={`flex items-center gap-2 text-xs text-amber-200/60 ${className}`}>
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-800 border-t-[#F88F22]" />
        <span className="font-medium tracking-wide">{label}</span>
      </div>
    );
  }
  return (
    <div className={`flex min-h-[280px] w-full flex-col items-center justify-center gap-3.5 py-16 text-center animate-fade-in-up ${className}`}>
      <div className="relative flex h-8 w-8 items-center justify-center">
        <span className="absolute h-8 w-8 animate-ping rounded-full bg-[#F88F22]/20" />
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-800 border-t-[#F88F22] shadow-sm" />
      </div>
      <span className="font-mono text-[11px] font-medium tracking-wider uppercase text-amber-200/60">{label}</span>
    </div>
  );
}

export function EmptyState({ title, hint, action, icon }) {
  return (
    <div className="group relative overflow-hidden flex flex-col items-center justify-center gap-3.5 rounded-xl border border-dashed border-zinc-800/90 bg-[#080808] py-12 px-6 text-center shadow-inner">
      {/* Subtle animated telemetry pulse wave grid background */}
      <div className="pointer-events-none absolute inset-0 opacity-20" aria-hidden="true">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="telemetry-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(248, 143, 34, 0.35)" strokeWidth="0.8" />
            </pattern>
            <linearGradient id="shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="50%" stopColor="rgba(248, 143, 34, 0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#telemetry-grid)" />
          <rect width="100%" height="100%" fill="url(#shimmer-grad)" className="animate-pulse" />
        </svg>
      </div>

      {/* Glowing frosted-glass icon container */}
      <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#F88F22]/30 bg-[#F88F22]/10 text-[#FBB931] shadow-[0_0_25px_rgba(234,97,19,0.25)] transition duration-300 group-hover:scale-105">
        {icon || <EmptyIcon className="h-6 w-6" />}
      </div>

      <div className="relative z-10 max-w-sm space-y-1">
        <h3 className="text-sm font-semibold text-[#FFE3B3]">{title}</h3>
        {hint && <p className="text-xs text-amber-200/60 leading-relaxed">{hint}</p>}
      </div>

      {action && <div className="relative z-10 mt-1">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-950/10 py-10 px-6 text-center">
      <div className="rounded-xl border border-rose-500/30 bg-rose-950/30 p-2.5 text-rose-400">
        <AlertIcon className="h-6 w-6" />
      </div>
      <p className="text-xs font-medium text-rose-300">{message || 'An error occurred while loading data.'}</p>
      {onRetry && (
        <button className="btn-ghost mt-1 border-rose-500/30 text-rose-300 hover:border-rose-400 hover:bg-rose-950/30" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

export function StatCard({ label, value, sub, icon, className = '' }) {
  const isPositive = typeof sub === 'string' && sub.startsWith('+');
  return (
    <div className={`group relative overflow-hidden rounded-xl border border-zinc-800/80 bg-[#080808] p-5 shadow-[0_8px_30px_rgba(0,0,0,0.7)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-[#F88F22]/40 hover:shadow-[0_12px_35px_-10px_rgba(234,97,19,0.3)] ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-200/60">{label}</p>
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#F88F22]/20 bg-[#F88F22]/10 text-[#FBB931] shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:border-[#F88F22]/40 group-hover:bg-[#F88F22]/20 group-hover:text-amber-200">
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2.5">
        <p className="text-2xl lg:text-3xl font-bold tracking-tight text-white">{value ?? '—'}</p>
        {sub && (
          <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
              : 'bg-[#121212] text-amber-200/50 border border-zinc-800'
          }`}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

const lineOpts = (color) => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      display: true,
      position: 'top',
      align: 'start',
      labels: {
        boxWidth: 16,
        boxHeight: 2.5,
        usePointStyle: false,
        color: '#94a3b8',
        font: { family: 'Inter, sans-serif', size: 11, weight: '500' },
        padding: 14,
      },
    },
    tooltip: {
      backgroundColor: '#18181b',
      titleColor: '#e4e4e7',
      titleFont: { family: 'Inter, sans-serif', size: 11, weight: '600' },
      bodyColor: '#ffffff',
      bodyFont: { family: 'Inter, sans-serif', size: 12, weight: '600' },
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
      padding: { top: 8, bottom: 8, left: 12, right: 12 },
      cornerRadius: 8,
      displayColors: true,
      boxWidth: 8,
      boxHeight: 8,
      usePointStyle: true,
      callbacks: {
        label: (context) => ` ${context.dataset.label || 'Clicks'}: ${Number(context.parsed.y || 0).toLocaleString()}`,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false, // Clean look, no vertical grid lines
      },
      border: {
        display: true,
        color: 'rgba(255, 255, 255, 0.15)', // Clean baseline like reference
        width: 1.5,
      },
      ticks: {
        color: '#94a3b8',
        font: { family: 'Inter, sans-serif', size: 10 },
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 10,
        padding: 6,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(255, 255, 255, 0.05)', // Subtle horizontal guidelines
        drawTicks: false,
      },
      border: {
        display: true,
        color: 'rgba(255, 255, 255, 0.15)', // Clean vertical axis line on left
        width: 1.5,
      },
      ticks: {
        precision: 0,
        color: '#94a3b8',
        font: { family: 'Inter, sans-serif', size: 10 },
        padding: 8,
        callback: (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v),
      },
    },
  },
});

export function LineChart({ labels, data, label = 'Total Clicks', color = '#F88F22' }) {
  return (
    <div className="h-64">
      <Line
        options={lineOpts(color)}
        data={{
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            borderWidth: 2.2,
            cubicInterpolationMode: 'monotone', // Ultra-smooth organic curves matching reference
            tension: 0.45,
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            pointRadius: 0, // Clean continuous wave, points hidden by default
            pointHoverRadius: 5.5, // Shows crisp circular point only on hover
            pointHoverBackgroundColor: color,
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2,
            pointHitRadius: 15,
            fill: true,
            backgroundColor: `${color}18`,
          }],
        }}
      />
    </div>
  );
}

const barOpts = (horizontal = false) => ({
  indexAxis: horizontal ? 'y' : 'x',
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      grid: { color: 'rgba(248, 143, 34, 0.05)' },
      beginAtZero: true,
      ticks: { precision: 0, color: '#a77242', font: { family: 'Inter', size: 10 } },
      border: { display: false },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#d4a373', font: { family: 'Inter', size: 10 } },
      border: { display: false },
    },
  },
});

export function BarChart({ labels, data, label = 'Count', color = '#EA6113', horizontal = false }) {
  return (
    <div className="h-64">
      <Bar
        options={barOpts(horizontal)}
        data={{
          labels,
          datasets: [{
            label,
            data,
            backgroundColor: `${color}cc`,
            borderRadius: 4,
            hoverBackgroundColor: color,
          }],
        }}
      />
    </div>
  );
}

export { PieChart3D };

export function DoughnutChart({
  labels,
  data,
  colors,
}) {
  return (
    <div className="w-full flex items-center justify-center">
      <PieChart3D labels={labels} data={data} colors={colors} />
    </div>
  );
}

