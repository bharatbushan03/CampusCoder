'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton, SkeletonTable } from '@/components/ui/Skeleton';
import {
  ArrowLeft, TrendingUp, Users, Calendar, Activity, BarChart2,
  LineChart, PieChart, Download, AlertTriangle, CheckCircle,
  Clock, ExternalLink, Server, Wifi, Cpu, HardDrive,
  Search, Filter, Loader2
} from 'lucide-react';
import Link from 'next/link';

interface AnalyticsData {
  registrationsOverTime: { date: string; count: number }[];
  eventsByType: { type: string; count: number }[];
  eventsByStatus: { status: string; count: number }[];
  registrationsByEvent: { event: string; count: number }[];
  dailyActivity: { date: string; registrations: number; events: number }[];
  topColleges: { college: string; count: number }[];
  codingLevels: { level: string; count: number }[];
  preferredLanguages: { language: string; count: number }[];
}

const mockAnalytics: AnalyticsData = {
  registrationsOverTime: [
    { date: '2026-05-20', count: 2 },
    { date: '2026-05-21', count: 5 },
    { date: '2026-05-22', count: 8 },
    { date: '2026-05-23', count: 12 },
    { date: '2026-05-24', count: 7 },
    { date: '2026-05-25', count: 15 },
    { date: '2026-05-26', count: 22 },
    { date: '2026-05-27', count: 18 },
    { date: '2026-05-28', count: 31 },
    { date: '2026-05-29', count: 25 },
    { date: '2026-05-30', count: 19 },
    { date: '2026-05-31', count: 14 },
    { date: '2026-06-01', count: 28 },
    { date: '2026-06-02', count: 33 },
  ],
  eventsByType: [
    { type: 'Workshop', count: 8 },
    { type: 'Coding Session', count: 12 },
    { type: 'Webinar', count: 5 },
    { type: 'Orientation', count: 3 },
    { type: 'Challenge', count: 4 },
  ],
  eventsByStatus: [
    { status: 'Published', count: 18 },
    { status: 'Draft', count: 7 },
    { status: 'Completed', count: 12 },
    { status: 'Cancelled', count: 2 },
  ],
  registrationsByEvent: [
    { event: 'React & Next.js Workshop', count: 89 },
    { event: 'Cracking Coding Interview', count: 67 },
    { event: 'Weekly Coding Sprint', count: 45 },
    { event: 'DSA Masterclass', count: 123 },
    { event: 'System Design Basics', count: 56 },
    { event: 'Placement Prep Bootcamp', count: 78 },
  ],
  dailyActivity: [
    { date: '2026-05-25', registrations: 15, events: 1 },
    { date: '2026-05-26', registrations: 22, events: 2 },
    { date: '2026-05-27', registrations: 18, events: 0 },
    { date: '2026-05-28', registrations: 31, events: 1 },
    { date: '2026-05-29', registrations: 25, events: 2 },
    { date: '2026-05-30', registrations: 19, events: 0 },
    { date: '2026-05-31', registrations: 14, events: 1 },
  ],
  topColleges: [
    { college: 'Delhi Engineering College', count: 45 },
    { college: 'Mumbai Institute of Tech', count: 38 },
    { college: 'Bangalore Tech University', count: 32 },
    { college: 'Chennai Institute of Tech', count: 28 },
    { college: 'Pune Engineering College', count: 22 },
  ],
  codingLevels: [
    { level: 'Beginner', count: 89 },
    { level: 'Intermediate', count: 156 },
    { level: 'Advanced', count: 67 },
  ],
  preferredLanguages: [
    { language: 'JavaScript', count: 112 },
    { language: 'Python', count: 98 },
    { language: 'C++', count: 76 },
    { language: 'Java', count: 54 },
    { language: 'TypeScript', count: 43 },
    { language: 'Go', count: 18 },
    { language: 'Rust', count: 12 },
  ],
};

function LineChartComponent({ data, xKey, yKeys, colors, height = 200, width = 600 }: {
  data: Record<string, any>[];
  xKey: string;
  yKeys: string[];
  colors: string[];
  height?: number;
  width?: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width || width, height: rect.height || height });
    }
  }, [width, height]);

  const { width: w, height: h } = dimensions;
  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const innerWidth = w - padding.left - padding.right;
  const innerHeight = h - padding.top - padding.bottom;

  const xValues = data.map(d => d[xKey]);
  const yValues = yKeys.flatMap(key => data.map(d => d[key]));
  const yMax = Math.max(...yValues) * 1.1;
  const yMin = 0;

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * innerWidth;
  const yScale = (value: number) => padding.top + innerHeight - ((value - yMin) / (yMax - yMin)) * innerHeight;

  return (
    <svg ref={svgRef} width={w} height={h} className="w-full h-full" viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="gridGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1e293b" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      <g stroke="#1e293b" strokeWidth="0.5">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + frac * innerHeight}
            x2={w - padding.right}
            y2={padding.top + frac * innerHeight}
          />
        ))}
        {data.map((_, i) => (
          <line
            key={i}
            x1={xScale(i)}
            y1={padding.top}
            x2={xScale(i)}
            y2={h - padding.bottom}
          />
        ))}
      </g>

      {/* Y-axis labels */}
      <g fontSize="10" fill="#64748b" fontFamily="monospace">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + (1 - frac) * innerHeight + 4}
            textAnchor="end"
          >
            {Math.round(yMin + frac * (yMax - yMin))}
          </text>
        ))}
      </g>

      {/* X-axis labels */}
      <g fontSize="10" fill="#64748b" fontFamily="monospace">
        {data.map((d, i) => (
          <text
            key={i}
            x={xScale(i)}
            y={h - padding.bottom + 18}
            textAnchor="middle"
            transform={`rotate(-45 ${xScale(i)} ${h - padding.bottom + 18})`}
          >
            {d[xKey].split('-').slice(1).join('-')}
          </text>
        ))}
      </g>

      {/* Lines */}
      {yKeys.map((yKey, idx) => {
        const color = colors[idx % colors.length];
        const points = data.map((d, i) => `${xScale(i)},${yScale(d[yKey])}`).join(' ');
        return (
          <g key={yKey}>
            <path
              d={`M${points}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((d, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(d[yKey])}
                r={4}
                fill={color}
                stroke="#0f172a"
                strokeWidth="2"
              />
            ))}
          </g>
        );
      })}

      {/* Legend */}
      <g fontSize="11" fontFamily="monospace">
        {yKeys.map((yKey, idx) => (
          <g key={yKey} transform={`translate(${w - padding.right + 10}, ${padding.top + idx * 20})`}>
            <rect x={0} y={0} width={12} height={12} rx={2} fill={colors[idx % colors.length]} />
            <text x={18} y={10} fill="#94a3b8">{yKey}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}

function BarChartComponent({ data, xKey, yKey, color, height = 200, width = 400, label }: {
  data: Record<string, any>[];
  xKey: string;
  yKey: string;
  color: string;
  height?: number;
  width?: number;
  label?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setDimensions({ width: rect.width || width, height: rect.height || height });
    }
  }, [width, height]);

  const { width: w, height: h } = dimensions;
  const padding = { top: 20, right: 20, bottom: 60, left: 50 };
  const innerWidth = w - padding.left - padding.right;
  const innerHeight = h - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d[yKey])) * 1.15;
  const barWidth = innerWidth / data.length * 0.7;
  const gap = innerWidth / data.length * 0.3 / data.length;

  const inner = innerWidth / data.length;

  return (
    <svg ref={svgRef} width={w} height={h} className="w-full h-full" viewBox={`0 0 ${w} ${h}`}>
      {/* Grid lines */}
      <g stroke="#1e293b" strokeWidth="0.5">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + frac * innerHeight}
            x2={w - padding.right}
            y2={padding.top + frac * innerHeight}
          />
        ))}
      </g>

      {/* Y-axis labels */}
      <g fontSize="10" fill="#64748b" fontFamily="monospace">
        {[0, 0.25, 0.5, 0.75, 1].map((frac, i) => (
          <text
            key={i}
            x={padding.left - 8}
            y={padding.top + (1 - frac) * innerHeight + 4}
            textAnchor="end"
          >
            {Math.round(frac * maxValue)}
          </text>
        ))}
      </g>

      {/* Bars */}
      <g>
        {data.map((d, i) => {
          const x = padding.left + i * inner + inner * 0.15;
          const barHeight = (d[yKey] / maxValue) * innerHeight;
          const y = h - padding.bottom - barHeight;
          return (
            <g key={d[xKey]}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color}
                rx={3}
              />
              <text
                x={x + barWidth / 2}
                y={h - padding.bottom + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
                fontFamily="monospace"
                transform={`rotate(-45 ${x + barWidth / 2} ${h - padding.bottom + 14})`}
              >
                {d[xKey]}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="10"
                fill="#94a3b8"
                fontFamily="monospace"
              >
                {d[yKey]}
              </text>
            </g>
          );
        })}
      </g>

      {label && (
        <text
          x={w / 2}
          y={15}
          textAnchor="middle"
          fontSize="12"
          fill="#94a3b8"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {label}
        </text>
      )}
    </svg>
  );
}

function PieChartComponent({ data, labelKey, valueKey, colors, height = 200, width = 200, label }: {
  data: Record<string, any>[];
  labelKey: string;
  valueKey: string;
  colors: string[];
  height?: number;
  width?: number;
  label?: string;
}) {
  const total = data.reduce((sum, d) => sum + d[valueKey], 0);
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 20;

  // Pre-compute arcs without using ref during render
  const arcs = data.map((d, i) => {
    // Compute cumulative angle up to this item
    let cumulativeAngle = -Math.PI / 2;
    for (let j = 0; j < i; j++) {
      cumulativeAngle += (data[j][valueKey] / total) * 2 * Math.PI;
    }
    const angle = (d[valueKey] / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;

    return (
      <path
        key={i}
        d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
        fill={colors[i % colors.length]}
        stroke="#0f172a"
        strokeWidth="2"
      />
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {arcs}
        <circle cx={centerX} cy={centerY} r={radius * 0.5} fill="#0f172a" />
      </svg>
      {label && <p className="text-xs text-slate-500 font-mono mt-3 text-center">{label}</p>}
      <div className="flex flex-wrap justify-center gap-2 mt-3 text-[10px] font-mono">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="w-2 h-2 rounded" style={{ backgroundColor: colors[i % colors.length] }} />
            <span className="text-slate-400">{d[labelKey]}</span>
            <span className="text-slate-500">{(d[valueKey] / total * 100).toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon: Icon, color, trend, trendLabel }: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: number;
  trendLabel?: string;
}) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-400 bg-slate-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    amber: 'text-amber-400 bg-amber-500/10',
    cyan: 'text-cyan-400 bg-cyan-500/10',
    purple: 'text-purple-400 bg-purple-500/10',
    rose: 'text-rose-400 bg-rose-500/10',
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <div className={`size-8 rounded-lg flex items-center justify-center ${colorMap[color] || colorMap.slate}`}>
          <Icon className="size-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-50">{value}</p>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-1">
          <span className={`text-xs font-mono ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
          </span>
          <span className="text-[10px] text-slate-500">{trendLabel}</span>
        </div>
      )}
    </Card>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="size-4 text-emerald-400" />
      <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isDbOffline, setIsDbOffline] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const loadAnalytics = async () => {
    try {
      // Mock analytics until a dedicated backend endpoint exists
      setAnalytics(mockAnalytics);
      setIsDbOffline(true);
    } catch (err) {
      console.warn('Analytics load failed:', err);
      setAnalytics(mockAnalytics);
      setIsDbOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="card" className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" className="h-80" />
          <Skeleton variant="card" className="h-80" />
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
  const lineColors = ['#10b981', '#3b82f6'];

  const totalRegs = analytics.registrationsOverTime.reduce((sum, d) => sum + d.count, 0);
  const prevPeriodRegs = totalRegs * 0.73; // mock previous period
  const regsTrend = ((totalRegs - prevPeriodRegs) / prevPeriodRegs * 100).toFixed(1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">Analytics <span className="text-emerald-500">Dashboard</span></h1>
          <p className="text-sm text-slate-400">Monitor registrations, event performance, and community growth.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500/50"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button variant="secondary" className="flex items-center gap-1.5">
            <Download className="size-4" /> Export Report
          </Button>
        </div>
      </div>

      {isDbOffline && (
        <div className="flex items-center gap-3 p-4 bg-slate-900 border border-emerald-500/10 rounded-xl text-xs text-slate-400 font-mono">
          <AlertTriangle className="size-4 text-amber-500 flex-shrink-0" />
          <span>Demo Mode: Charts display simulated data. Connect the backend for live analytics.</span>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Registrations"
          value={totalRegs.toLocaleString()}
          icon={Users}
          color="emerald"
          trend={parseFloat(regsTrend)}
          trendLabel="vs last period"
        />
        <MetricCard
          label="Active Events"
          value={analytics.eventsByStatus.find(s => s.status === 'Published')?.count || 0}
          icon={Calendar}
          color="cyan"
          trend={12}
          trendLabel="new this month"
        />
        <MetricCard
          label="Unique Colleges"
          value={analytics.topColleges.length + 12}
          icon={Activity}
          color="purple"
          trend={8}
          trendLabel="new institutions"
        />
        <MetricCard
          label="Avg. Reg/Event"
          value={Math.round(totalRegs / Math.max(1, analytics.registrationsByEvent.length))}
          icon={TrendingUp}
          color="amber"
          trend={-3}
          trendLabel="slight decrease"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registrations Over Time */}
        <Card className="p-6">
          <SectionHeader title="Registrations Over Time" icon={LineChart} />
          <div className="h-72">
            <LineChartComponent
              data={analytics.registrationsOverTime}
              xKey="date"
              yKeys={['count']}
              colors={lineColors}
            />
          </div>
        </Card>

        {/* Daily Activity */}
        <Card className="p-6">
          <SectionHeader title="Daily Activity" icon={Activity} />
          <div className="h-72">
            <LineChartComponent
              data={analytics.dailyActivity}
              xKey="date"
              yKeys={['registrations', 'events']}
              colors={['#10b981', '#3b82f6']}
            />
          </div>
        </Card>

        {/* Events by Type */}
        <Card className="p-6">
          <SectionHeader title="Events by Type" icon={PieChart} />
          <div className="h-72 flex items-center justify-center">
            <PieChartComponent
              data={analytics.eventsByType}
              labelKey="type"
              valueKey="count"
              colors={colors}
              width={280}
              height={280}
            />
          </div>
        </Card>

        {/* Events by Status */}
        <Card className="p-6">
          <SectionHeader title="Events by Status" icon={PieChart} />
          <div className="h-72 flex items-center justify-center">
            <PieChartComponent
              data={analytics.eventsByStatus}
              labelKey="status"
              valueKey="count"
              colors={['#10b981', '#64748b', '#f59e0b', '#ef4444']}
              width={280}
              height={280}
            />
          </div>
        </Card>

        {/* Top Events by Registrations */}
        <Card className="p-6 lg:col-span-2">
          <SectionHeader title="Top Events by Registrations" icon={BarChart2} />
          <div className="h-72">
            <BarChartComponent
              data={analytics.registrationsByEvent}
              xKey="event"
              yKey="count"
              color="#10b981"
              height={280}
              label="Registrations per Event"
            />
          </div>
        </Card>

        {/* Top Colleges */}
        <Card className="p-6">
          <SectionHeader title="Top Colleges" icon={Users} />
          <div className="h-72">
            <BarChartComponent
              data={analytics.topColleges}
              xKey="college"
              yKey="count"
              color="#8b5cf6"
              height={280}
              label="Registrations by College"
            />
          </div>
        </Card>

        {/* Coding Levels */}
        <Card className="p-6">
          <SectionHeader title="Coding Skill Levels" icon={PieChart} />
          <div className="h-72 flex items-center justify-center">
            <PieChartComponent
              data={analytics.codingLevels}
              labelKey="level"
              valueKey="count"
              colors={['#10b981', '#3b82f6', '#f59e0b']}
              width={280}
              height={280}
            />
          </div>
        </Card>

        {/* Preferred Languages */}
        <Card className="p-6 lg:col-span-2">
          <SectionHeader title="Preferred Programming Languages" icon={BarChart2} />
          <div className="h-72">
            <BarChartComponent
              data={analytics.preferredLanguages}
              xKey="language"
              yKey="count"
              color="#06b6d4"
              height={280}
              label="Language Distribution"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}