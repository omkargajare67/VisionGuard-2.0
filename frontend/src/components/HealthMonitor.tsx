import React from 'react';
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, Clock, Server } from 'lucide-react';
import type { HealthResponse } from '../types';

interface HealthMonitorProps {
  healthData: HealthResponse | null;
  latencyMs: number | null;
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  onRefresh: () => void;
  onToggleAutoRefresh: () => void;
  lastChecked: string | null;
}

export const HealthMonitor: React.FC<HealthMonitorProps> = ({
  healthData,
  latencyMs,
  isLoading,
  error,
  autoRefresh,
  onRefresh,
  onToggleAutoRefresh,
  lastChecked,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">System Health & API Diagnostic</h2>
            <p className="text-xs text-slate-400">Verifying REST endpoint <code className="text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded font-mono">GET /api/health</code></p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleAutoRefresh}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center space-x-1.5 ${
              autoRefresh
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle 5-second automatic health check"
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'}`} />
            <span>Auto-Poll (5s)</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/20 transition-all disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Check Health</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-5">
        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>API Status</span>
            {healthData?.status === 'running' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="text-xl font-bold tracking-tight text-white capitalize">
            {healthData ? (
              <span className="text-emerald-400">{healthData.status}</span>
            ) : error ? (
              <span className="text-rose-400 text-sm">Unreachable</span>
            ) : (
              <span className="text-slate-500">Checking...</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {healthData ? 'FastAPI daemon responding normally' : 'Waiting for successful response'}
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Response Latency</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-white">
            {latencyMs !== null ? (
              <span>{latencyMs} <span className="text-xs font-normal text-slate-400">ms</span></span>
            ) : (
              <span className="text-slate-500">--</span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Local loopback round-trip time
          </span>
        </div>

        <div className="p-4 rounded-xl border border-slate-800/90 bg-slate-950/40">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Active Stage</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold tracking-tight text-blue-400">
            {healthData ? `Stage ${healthData.stage}` : '--'}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Baseline Architecture & Diagnostic
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-200 text-xs flex items-start space-x-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-300">Connection Failed:</span> {error}
            <p className="text-rose-400/80 mt-1 text-[11px]">
              Verify that the FastAPI server is running on <code className="bg-rose-950/80 px-1 py-0.5 rounded">http://127.0.0.1:8000</code>.
            </p>
          </div>
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Raw Endpoint Payload Output
          </span>
          {lastChecked && (
            <span className="text-[11px] text-slate-500">
              Last check: {lastChecked}
            </span>
          )}
        </div>
        <pre className="p-4 rounded-xl border border-slate-800/80 bg-slate-950/80 font-mono text-xs text-cyan-300 overflow-x-auto shadow-inner">
          {healthData
            ? JSON.stringify(healthData, null, 4)
            : error
            ? JSON.stringify({ error: error, status: 'error' }, null, 4)
            : '/* Click "Check Health" to test /api/health */'}
        </pre>
      </div>
    </div>
  );
};
