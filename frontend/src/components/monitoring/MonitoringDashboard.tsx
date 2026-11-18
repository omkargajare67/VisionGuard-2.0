import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Layers,
  FileText,
} from 'lucide-react';
import { productionLineApi } from '../../services/api';
import type { ProductionLineFullState, HealthResponse, HealthCheckRecord } from '../../types';
import { DiagnosticLog } from '../DiagnosticLog';

interface MonitoringDashboardProps {
  healthData?: HealthResponse | null;
  latencyMs: number | null;
  records: HealthCheckRecord[];
  onClearRecords: () => void;
  onRefreshHealth: () => void;
}

const DEFECT_LABELS: Record<string, string> = {
  missing_label: 'Missing Label (L=0)',
  marking_defect: 'Marking Defect (M=0)',
  missing_component: 'Missing Component (C=0)',
  geometry_defect: 'Geometry Defect (G=0)',
  surface_scratch: 'Surface Scratch (S=1)',
};

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  healthData,
  latencyMs,
  records,
  onClearRecords,
  onRefreshHealth,
}) => {
  const [state, setState] = useState<ProductionLineFullState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('visionguard_production_session') || 'default'
      : 'default';

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await productionLineApi.getState(sessionId);
      setState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch production line metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [sessionId]);

  const metrics = state?.metrics;
  const totalEntered = metrics?.total_entered ?? 0;
  const totalInspected = metrics?.total_inspected ?? 0;
  const totalPassed = metrics?.total_passed ?? 0;
  const totalRejected = metrics?.total_rejected ?? 0;
  const passRate = totalInspected > 0 ? ((totalPassed / totalInspected) * 100).toFixed(1) : '0.0';
  const rejectRate = totalInspected > 0 ? ((totalRejected / totalInspected) * 100).toFixed(1) : '0.0';

  const defectEntries = Object.entries(metrics?.defect_distribution || {});
  const maxDefectCount = Math.max(1, ...defectEntries.map(([, count]) => count));
  const totalDefectsCount = defectEntries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="w-10 h-1 bg-[#F59A16] rounded-full mb-2" />
          <h1 className="text-3xl font-extrabold text-[#252B35] tracking-tight">
            Quality &amp; Telemetry Monitoring
          </h1>
          <p className="text-sm text-[#667085] mt-1">
            Real-time industrial telemetry, yield KPIs, defect distribution Pareto and system health
            {healthData?.stage ? ` (Stage ${healthData.stage})` : ''}
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600">
            Session: <span className="font-bold text-slate-900">{sessionId}</span>
          </div>

          <button
            onClick={() => {
              loadData();
              onRefreshHealth();
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-[#F59A16] text-white font-semibold text-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 4 Prominent KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Processed */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>TOTAL PROCESSED</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-slate-900 font-mono">{totalEntered}</span>
            <span className="text-xs text-slate-400 ml-1.5 font-mono">units</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Active on belt: <span className="font-bold text-slate-700">{metrics?.active_products ?? 0}</span>
          </div>
        </div>

        {/* Quality Yield */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>QUALITY YIELD</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{passRate}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Passed: <span className="font-bold text-emerald-600">{totalPassed} units</span>
          </div>
        </div>

        {/* Scrap Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>SCRAP RATE</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{rejectRate}%</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            Rejected: <span className="font-bold text-rose-600">{totalRejected} units</span>
          </div>
        </div>

        {/* System Latency / Mode */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>CONTROLLER MODE</span>
            <Activity className="w-4 h-4 text-[#F59A16]" />
          </div>
          <div className="mt-2">
            <span className="text-base font-bold text-slate-900 font-mono">
              {state?.controller_mode === 'MICROPROCESSOR_8086' ? '8086 + 8255' : 'DEAM Logic'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            API Latency: <span className="font-bold text-slate-700">{latencyMs ?? '~5'} ms</span>
          </div>
        </div>
      </div>

      {/* Grid: Defect Pareto Chart & Cycle Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Defect Pareto Breakdown (Left 7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-[#F59A16]" />
              <h2 className="text-base font-bold text-slate-900">Defect Category Pareto Distribution</h2>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Total Defective: <strong className="text-slate-900">{totalDefectsCount}</strong>
            </span>
          </div>

          {totalDefectsCount === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-2 opacity-60" />
              <span>Zero defects recorded in current session. All units conforming.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {defectEntries.map(([category, count]) => {
                const label = DEFECT_LABELS[category] || category;
                const percentage =
                  totalDefectsCount > 0 ? ((count / totalDefectsCount) * 100).toFixed(1) : '0';
                const barWidth = Math.max(4, Math.round((count / maxDefectCount) * 100));

                return (
                  <div key={category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-700">{label}</span>
                      <span className="font-mono text-slate-500">
                        <strong className="text-slate-900">{count}</strong> ({percentage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#F59A16] transition-all duration-300"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Operational Diagnostics & Telemetry (Right 5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">Kinematic &amp; Station Telemetry</h2>
            </div>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Conveyor Speed:</span>
              <span className="font-bold text-slate-900">{state?.conveyor?.speed ?? 5.0} u/tick</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Avg Inspection Time:</span>
              <span className="font-bold text-slate-900">
                {(metrics?.average_inspection_time_ms ?? 0).toFixed(1)} ms
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Avg Cycle Time:</span>
              <span className="font-bold text-slate-900">
                {(metrics?.average_cycle_time_ticks ?? 0).toFixed(1)} ticks
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-slate-500">Hardware Interlocks:</span>
              <span
                className={`font-bold ${
                  state?.conveyor?.emergency_stopped
                    ? 'text-rose-600'
                    : state?.fault_state?.has_fault
                    ? 'text-amber-600'
                    : 'text-emerald-600'
                }`}
              >
                {state?.conveyor?.emergency_stopped
                  ? 'EMERGENCY STOPPED'
                  : state?.fault_state?.has_fault
                  ? 'FAULT ACTIVE'
                  : 'NORMAL INTERLOCKED'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* API Health & Diagnostics Stream */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">API Health &amp; Communication Stream</h2>
          </div>
          <button
            onClick={onClearRecords}
            className="text-xs text-slate-400 hover:text-slate-700 font-mono transition-colors cursor-pointer"
          >
            Clear Log
          </button>
        </div>

        <DiagnosticLog records={records} onClear={onClearRecords} />
      </div>
    </div>
  );
};
