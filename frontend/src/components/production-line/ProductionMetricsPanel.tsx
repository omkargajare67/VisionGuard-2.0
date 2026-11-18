import React from 'react';
import type { ProductionMetricsDTO } from '../../types';
import { BarChart3, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface ProductionMetricsPanelProps {
  metrics: ProductionMetricsDTO;
  onResetMetrics: () => void;
}

const DEFECT_LABELS: Record<string, string> = {
  missing_label: 'Missing Label (L=0)',
  marking_defect: 'Marking Defect (M=0)',
  missing_component: 'Missing Component (C=0)',
  geometry_defect: 'Geometry Defect (G=0/D=0)',
  surface_scratch: 'Surface Scratch (S=1)',
};

export const ProductionMetricsPanel: React.FC<ProductionMetricsPanelProps> = ({
  metrics,
  onResetMetrics,
}) => {
  const defectEntries = Object.entries(metrics.defect_distribution || {});
  const maxDefectCount = Math.max(1, ...defectEntries.map(([, v]) => v));

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Production Analytics &amp; Defect Pareto</h3>
            <p className="text-[11px] text-slate-400">Real-Time Industrial Quality Metrics</p>
          </div>
        </div>

        <button
          onClick={onResetMetrics}
          className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Metrics</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 font-mono">
        {/* Total Ingested */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Ingested</span>
          <div className="text-2xl font-bold text-cyan-300 mt-1">{metrics.total_entered}</div>
          <span className="text-[10px] text-slate-500">Active on belt: {metrics.active_products}</span>
        </div>

        {/* Total Inspected */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Inspected</span>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{metrics.total_inspected}</div>
          <span className="text-[10px] text-slate-500">Avg: {metrics.average_inspection_time_ms} ms</span>
        </div>

        {/* Quality Yield (PASS) */}
        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <div className="flex items-center justify-between text-xs text-emerald-400 pb-0.5">
            <span className="flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3" /> PASSED
            </span>
            <span>{metrics.pass_percentage}%</span>
          </div>
          <div className="text-2xl font-bold text-emerald-300 mt-1">{metrics.total_passed}</div>
          <span className="text-[10px] text-emerald-500/80">Yield Rate</span>
        </div>

        {/* Reject Rate */}
        <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <div className="flex items-center justify-between text-xs text-rose-400 pb-0.5">
            <span className="flex items-center gap-1 font-bold">
              <XCircle className="w-3 h-3" /> REJECTED
            </span>
            <span>{metrics.reject_percentage}%</span>
          </div>
          <div className="text-2xl font-bold text-rose-300 mt-1">{metrics.total_rejected}</div>
          <span className="text-[10px] text-rose-500/80">Scrap Rate</span>
        </div>
      </div>

      {/* Defect Pareto Breakdown */}
      <div className="mt-5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2.5">
          Defect Category Pareto Distribution
        </span>

        <div className="space-y-2">
          {defectEntries.map(([defectKey, count]) => {
            const label = DEFECT_LABELS[defectKey] || defectKey;
            const percentage = (count / maxDefectCount) * 100;

            return (
              <div key={defectKey} className="text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300 mb-1">
                  <span>{label}</span>
                  <span className="text-white font-bold">{count}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      count > 0 ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-slate-800'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
