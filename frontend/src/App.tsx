import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { HealthMonitor } from './components/HealthMonitor';
import { ArchitectureOverview } from './components/ArchitectureOverview';
import { DiagnosticLog } from './components/DiagnosticLog';
import { VisionInspector } from './components/vision/VisionInspector';
import { DeamLaboratory } from './components/deam/DeamLaboratory';
import { MicroprocessorLab } from './components/microprocessor/MicroprocessorLab';
import { ProductionLineDashboard } from './components/production-line/ProductionLineDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchHealth } from './services/api';
import type { HealthResponse, HealthCheckRecord, InspectionResult } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'production' | '8086' | 'deam' | 'vision' | 'monitor'>('production');
  const [latestInspection, setLatestInspection] = useState<InspectionResult | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [records, setRecords] = useState<HealthCheckRecord[]>([]);

  const runHealthCheck = useCallback(async () => {
    setIsLoading(true);
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    try {
      const { data, latencyMs: latency } = await fetchHealth();
      setHealthData(data);
      setLatencyMs(latency);
      setError(null);
      setLastChecked(timeString);

      const record: HealthCheckRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeString,
        latencyMs: latency,
        success: true,
        data,
      };
      setRecords((prev) => [record, ...prev].slice(0, 30));
    } catch (err: any) {
      const errorMsg = err.message || 'Network error: could not connect to API';
      setError(errorMsg);
      setLatencyMs(err.latencyMs ?? null);
      setLastChecked(timeString);

      const record: HealthCheckRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeString,
        latencyMs: err.latencyMs ?? 0,
        success: false,
        error: errorMsg,
      };
      setRecords((prev) => [record, ...prev].slice(0, 30));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  // Periodic auto-check
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      runHealthCheck();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, runHealthCheck]);

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev);
  };

  const clearLog = () => {
    setRecords([]);
  };

  const isBackendOnline = healthData?.status === 'running' && !error;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar
        backendOnline={error ? false : isBackendOnline}
        stage={5}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <ErrorBoundary fallbackTitle="VisionGuard Module Error">
          {activeTab === 'production' ? (
            <ProductionLineDashboard />
          ) : activeTab === '8086' ? (
            <MicroprocessorLab latestInspectionResult={latestInspection} />
          ) : activeTab === 'deam' ? (
            <DeamLaboratory latestInspectionResult={latestInspection} />
          ) : activeTab === 'vision' ? (
            <VisionInspector onInspectionComplete={setLatestInspection} />
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-white">Stage 1 System Baseline</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Integrated Verification Environment &amp; Communication Diagnostics
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>FastAPI + OpenCV Ingestion Hub</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-6 space-y-8">
                  <HealthMonitor
                    healthData={healthData}
                    latencyMs={latencyMs}
                    isLoading={isLoading}
                    error={error}
                    autoRefresh={autoRefresh}
                    onRefresh={runHealthCheck}
                    onToggleAutoRefresh={toggleAutoRefresh}
                    lastChecked={lastChecked}
                  />

                  <DiagnosticLog records={records} onClear={clearLog} />
                </div>

                <div className="lg:col-span-6">
                  <ArchitectureOverview />
                </div>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 text-center text-xs text-slate-500">
        VisionGuard 2.0 &bull; Academic DEAM Capstone System &bull; Stage 5 Virtual Production Line &amp; Automated Sorting
      </footer>
    </div>
  );
};

export default App;
