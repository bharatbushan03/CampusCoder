'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  ArrowLeft, Server, Wifi, Cpu, HardDrive,
  AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw,
  ExternalLink, Settings, Activity, TrendingUp, Zap, Cylinder
} from 'lucide-react';
import Link from 'next/link';

interface SystemHealth {
  database: { status: 'healthy' | 'degraded' | 'down'; latency: number; connections: number; maxConnections: number };
  api: { status: 'healthy' | 'degraded' | 'down'; latency: number; requestsPerMin: number; errorRate: number };
  storage: { status: 'healthy' | 'degraded' | 'down'; used: number; total: number; files: number };
  realtime: { status: 'healthy' | 'degraded' | 'down'; channels: number; subscribers: number };
  functions: { status: 'healthy' | 'degraded' | 'down'; invocations: number; errors: number; avgDuration: number };
}

interface SystemMetrics {
  cpu: number;
  memory: { used: number; total: number; percentage: number };
  disk: { used: number; total: number; percentage: number };
  network: { in: number; out: number };
  uptime: number;
}

const mockHealth: SystemHealth = {
  database: { status: 'healthy', latency: 12, connections: 24, maxConnections: 100 },
  api: { status: 'healthy', latency: 45, requestsPerMin: 1247, errorRate: 0.02 },
  storage: { status: 'healthy', used: 2.4, total: 10, files: 1847 },
  realtime: { status: 'healthy', channels: 12, subscribers: 342 },
  functions: { status: 'healthy', invocations: 8934, errors: 3, avgDuration: 156 },
};

const mockMetrics: SystemMetrics = {
  cpu: 23,
  memory: { used: 2.1, total: 4, percentage: 52 },
  disk: { used: 45, total: 100, percentage: 45 },
  network: { in: 12.4, out: 8.7 },
  uptime: 99.97,
};

function StatusIndicator({ status, label, value, unit = '' }: {
  status: 'healthy' | 'degraded' | 'down';
  label: string;
  value: string | number;
  unit?: string;
}) {
  const statusConfig = {
    healthy: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Healthy' },
    degraded: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Degraded' },
    down: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', dot: 'bg-red-400', label: 'Down' },
  };
  const config = statusConfig[status];

  return (
    <Card className={`p-4 ${config.bg} border ${config.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`size-2 rounded-full ${config.dot}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        </div>
        <Badge variant={status === 'healthy' ? 'success' : status === 'degraded' ? 'warning' : 'error'} className="text-[10px]">
          {config.label}
        </Badge>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-50 font-mono">{value}</span>
        <span className="text-xs text-slate-500 font-mono">{unit}</span>
      </div>
    </Card>
  );
}

function MetricGauge({ label, value, max, unit, color, icon: Icon }: {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="p-6 flex flex-col items-center">
      <div className="relative size-32 mb-4">
        <svg className="size-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-xl font-bold text-slate-50 font-mono">{value}{unit}</span>
            <div className="text-[10px] text-slate-500 font-mono">/ {max}{unit}</div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 text-xs text-slate-400">
        <span className="size-3" style={{ color }}>
          <Icon className="size-full" />
        </span>
        <span className="font-mono">{label}</span>
      </div>
      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="text-[10px] text-slate-500 font-mono mt-1">{percentage.toFixed(1)}% utilized</div>
    </Card>
  );
}

function LogEntry({ time, level, message, source }: { time: string; level: 'info' | 'warn' | 'error'; message: string; source: string }) {
  const levelConfig = {
    info: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', label: 'INFO' },
    warn: { color: 'text-amber-400', bg: 'bg-amber-500/10', label: 'WARN' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'ERROR' },
  };
  const config = levelConfig[level];

  return (
    <div className="flex items-start gap-3 p-3 bg-slate-900/50 border border-slate-800/60 rounded-lg hover:border-slate-700 transition-colors">
      <div className="flex flex-col items-center gap-1 shrink-0">
        <span className="text-[10px] font-mono text-slate-500">{time}</span>
        <Badge variant={level === 'info' ? 'accent' : level === 'warn' ? 'warning' : 'error'} className="text-[9px]">
          {config.label}
        </Badge>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-slate-400">{source}</span>
          <span className="text-[10px] text-slate-600 px-1.5 py-0.5 rounded bg-slate-800">{config.label}</span>
        </div>
        <p className="text-sm text-slate-300 font-mono">{message}</p>
      </div>
    </div>
  );
}

const mockLogs = [
  { time: '14:32:15', level: 'info' as const, message: 'New registration received for event: DSA Masterclass', source: 'api/registrations' },
  { time: '14:31:42', level: 'info' as const, message: 'Scheduled email sent: Event reminder for React Workshop', source: 'functions/email-worker' },
  { time: '14:30:08', level: 'warn' as const, message: 'Rate limit approached for IP 192.168.1.45 (45/60 req/min)', source: 'middleware/rate-limit' },
  { time: '14:28:55', level: 'info' as const, message: 'Database connection pool scaled: 18 -> 24 connections', source: 'database/pooler' },
  { time: '14:27:12', level: 'error' as const, message: 'Failed to send webhook to Discord: timeout after 5000ms', source: 'functions/discord-webhook' },
  { time: '14:25:40', level: 'info' as const, message: 'New event created: System Design Basics', source: 'api/events' },
  { time: '14:24:18', level: 'info' as const, message: 'Realtime channel joined: event:react-workshop', source: 'realtime/backend' },
  { time: '14:22:05', level: 'warn' as const, message: 'Storage usage at 78% - consider cleanup', source: 'storage/monitor' },
  { time: '14:20:33', level: 'info' as const, message: 'Edge function deployed: v2.1.4', source: 'deployment/vercel' },
  { time: '14:18:50', level: 'info' as const, message: 'Health check passed: all services operational', source: 'monitor/health' },
];

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState(mockLogs);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadSystemData = async () => {
    try {
      // In production, fetch from monitoring endpoints
      setHealth(mockHealth);
      setMetrics(mockMetrics);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn('System data load failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSystemData();
    if (autoRefresh) {
      const interval = setInterval(loadSystemData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-3 w-32" />
          <Skeleton variant="text" className="h-8 w-56" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} variant="card" className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!health || !metrics) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors font-mono mb-2 group">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" /> Back to Console
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">System <span className="text-emerald-500">Monitoring</span></h1>
          <p className="text-sm text-slate-400">Real-time infrastructure health, performance metrics, and system logs.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 text-emerald-500 bg-slate-900 focus:ring-emerald-500"
            />
            <span>Auto-refresh (30s)</span>
            {autoRefresh && <Activity className="size-4 text-emerald-400 animate-spin" />}
          </label>
          <Button variant="secondary" onClick={loadSystemData} className="flex items-center gap-1.5">
            <RefreshCw className="size-4" /> Refresh Now
          </Button>
        </div>
      </div>

      {/* Overall System Status */}
      <div className="flex items-center gap-4 p-4 bg-slate-900 border border-slate-800/60 rounded-xl">
        <div className="flex items-center gap-2">
          <CheckCircle className="size-5 text-emerald-400" />
          <span className="text-sm font-medium text-slate-200">All Systems Operational</span>
        </div>
        <div className="flex-1" />
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">Uptime</p>
          <p className="text-lg font-bold text-slate-50 font-mono">{metrics.uptime}%</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-mono">Last Check</p>
          <p className="text-sm font-mono text-slate-300">{lastRefresh ? lastRefresh.toLocaleTimeString() : '—'}</p>
        </div>
      </div>

      {/* Health Checks */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Service Health</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatusIndicator
            status={health.database.status}
            label="Database"
            value={health.database.latency}
            unit="ms"
          />
          <StatusIndicator
            status={health.api.status}
            label="API Gateway"
            value={health.api.latency}
            unit="ms"
          />
          <StatusIndicator
            status={health.storage.status}
            label="Storage"
            value={health.storage.used}
            unit=" GB"
          />
          <StatusIndicator
            status={health.realtime.status}
            label="Realtime"
            value={health.realtime.channels}
            unit=" ch"
          />
          <StatusIndicator
            status={health.functions.status}
            label="Edge Functions"
            value={health.functions.avgDuration}
            unit="ms"
          />
        </div>
      </div>

      {/* Resource Metrics */}
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Resource Utilization</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricGauge
            label="CPU Usage"
            value={metrics.cpu}
            max={100}
            unit="%"
            color="#10b981"
            icon={Cpu}
          />
          <MetricGauge
            label="Memory"
            value={metrics.memory.used}
            max={metrics.memory.total}
            unit=" GB"
            color="#3b82f6"
            icon={HardDrive}
          />
          <MetricGauge
            label="Disk Space"
            value={metrics.disk.used}
            max={metrics.disk.total}
            unit=" GB"
            color="#8b5cf6"
            icon={Cylinder}
          />
          <MetricGauge
            label="Network I/O"
            value={metrics.network.in + metrics.network.out}
            max={100}
            unit=" MB/s"
            color="#f59e0b"
            icon={Wifi}
          />
        </div>
      </div>

      {/* Detailed Service Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Cylinder className="size-4 text-emerald-400" />
              Database Details
            </h3>
            <Badge variant="success" className="text-[10px]">Healthy</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Active Connections</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.database.connections} / {health.database.maxConnections}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Query Latency</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.database.latency} ms</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Pool Utilization</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{(health.database.connections / health.database.maxConnections * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-emerald-400 font-mono capitalize">{health.database.status}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/60">
              <p className="text-xs text-slate-500 font-mono">Connection pool healthy. No blocking queries detected.</p>
            </div>
          </div>
        </Card>

        {/* API Gateway Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Server className="size-4 text-emerald-400" />
              API Gateway
            </h3>
            <Badge variant="success" className="text-[10px]">Healthy</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Requests/Min</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.api.requestsPerMin.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Avg Latency</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.api.latency} ms</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Error Rate</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{(health.api.errorRate * 100).toFixed(2)}%</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Status</p>
                <p className="text-lg font-bold text-emerald-400 font-mono capitalize">{health.api.status}</p>
              </div>
            </div>
            <div className="pt-4 border-t border-slate-800/60">
              <p className="text-xs text-slate-500 font-mono">API responding normally. Rate limiting active.</p>
            </div>
          </div>
        </Card>

        {/* Storage Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <HardDrive className="size-4 text-emerald-400" />
              Storage
            </h3>
            <Badge variant="success" className="text-[10px]">Healthy</Badge>
          </div>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Used Space</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.storage.used} GB</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Total Space</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.storage.total} GB</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Files Stored</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{health.storage.files.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Utilization</p>
                <p className="text-lg font-bold text-slate-50 font-mono">{(health.storage.used / health.storage.total * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${(health.storage.used / health.storage.total * 100)}%` }}
              />
            </div>
            <div className="pt-2 text-xs text-slate-500 font-mono">
              {(health.storage.total - health.storage.used).toFixed(1)} GB available
            </div>
          </div>
        </Card>

        {/* Realtime & Functions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Zap className="size-4 text-emerald-400" />
              Realtime & Functions
            </h3>
            <div className="flex gap-1">
              <Badge variant="success" className="text-[10px]">Realtime</Badge>
              <Badge variant="success" className="text-[10px]">Functions</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                <Activity className="size-3" /> Realtime
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-500">Active Channels</p>
                  <p className="text-lg font-bold text-slate-50 font-mono">{health.realtime.channels}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Subscribers</p>
                  <p className="text-lg font-bold text-slate-50 font-mono">{health.realtime.subscribers}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 p-4 bg-slate-900/50 rounded-lg border border-slate-800/60">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1">
                <Zap className="size-3" /> Edge Functions
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-slate-500">Invocations (24h)</p>
                  <p className="text-lg font-bold text-slate-50 font-mono">{health.functions.invocations.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Errors</p>
                  <p className="text-lg font-bold text-red-400 font-mono">{health.functions.errors}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Avg Duration</p>
                  <p className="text-lg font-bold text-slate-50 font-mono">{health.functions.avgDuration} ms</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500">Error Rate</p>
                  <p className="text-lg font-bold text-slate-50 font-mono">{(health.functions.errors / health.functions.invocations * 100).toFixed(3)}%</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* System Logs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">System Logs</h2>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Live tail</span>
            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </div>
        <Card className="p-0 overflow-hidden max-h-96">
          <div className="divide-y divide-slate-800/60">
            {logs.map((log, i) => (
              <LogEntry key={i} {...log} />
            ))}
          </div>
          <div className="p-4 border-t border-slate-800/60 bg-slate-900/50">
            <Button variant="ghost" size="sm" className="w-full text-xs text-slate-400 hover:text-emerald-400">
              Load more logs
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}