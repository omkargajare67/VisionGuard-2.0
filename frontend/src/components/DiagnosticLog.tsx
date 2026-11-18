import React from 'react';
import { Terminal, CheckCircle, XCircle } from 'lucide-react';
import type { HealthCheckRecord } from '../types';

interface DiagnosticLogProps {
  records: HealthCheckRecord[];
  onClear: () => void;
}

export const DiagnosticLog: React.FC<DiagnosticLogProps> = ({ records, onClear }) => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Live Connection Log</h2>
            <p className="text-xs text-slate-400">Diagnostic history of frontend-backend pings</p>
          </div>
        </div>

        {records.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700 hover:bg-slate-700 transition-colors"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1 font-mono text-xs">
        {records.length === 0 ? (
          <p className="text-slate-500 text-xs py-4 text-center">No diagnostic requests recorded yet.</p>
        ) : (
          records.map((r) => (
            <div
              key={r.id}
              className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                r.success
                  ? 'border-emerald-500/20 bg-emerald-950/10 text-slate-300'
                  : 'border-rose-500/20 bg-rose-950/10 text-rose-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                {r.success ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span className="text-slate-400">{r.timestamp}</span>
                <span className="font-semibold">{r.success ? 'GET /api/health [200 OK]' : 'GET /api/health [FAILED]'}</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] shrink-0">
                <span className="text-cyan-400">{r.latencyMs} ms</span>
                {r.data && <span className="text-slate-400">v{r.data.stage}</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
