import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, type NavTab } from './components/Navbar';
import { HomePage } from './components/home/HomePage';
import { MonitoringDashboard } from './components/monitoring/MonitoringDashboard';
import { VisionInspector } from './components/vision/VisionInspector';
import { DeamLaboratory } from './components/deam/DeamLaboratory';
import { MicroprocessorLab } from './components/microprocessor/MicroprocessorLab';
import { ProductionLineDashboard } from './components/production-line/ProductionLineDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { fetchHealth } from './services/api';
import type { HealthResponse, HealthCheckRecord, InspectionResult } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [latestInspection, setLatestInspection] = useState<InspectionResult | null>(null);
  const [healthData, setHealthData] = useState<HealthResponse | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<HealthCheckRecord[]>([]);

  const runHealthCheck = useCallback(async () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString();

    try {
      const { data, latencyMs: latency } = await fetchHealth();
      setHealthData(data);
      setLatencyMs(latency);
      setError(null);

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

      const record: HealthCheckRecord = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: timeString,
        latencyMs: err.latencyMs ?? 0,
        success: false,
        error: errorMsg,
      };
      setRecords((prev) => [record, ...prev].slice(0, 30));
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);

  // Periodic auto-check
  useEffect(() => {
    const intervalId = setInterval(() => {
      runHealthCheck();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [runHealthCheck]);

  const clearLog = () => {
    setRecords([]);
  };

  const isBackendOnline = healthData?.status === 'running' && !error;

  return (
    <div className="min-h-screen bg-[#F5F6F7] text-[#252B35] flex flex-col overflow-x-hidden selection:bg-[#F59A16]/20 selection:text-[#F59A16]">
      <Navbar
        backendOnline={error ? false : isBackendOnline}
        stage={5}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      <ErrorBoundary fallbackTitle="VisionGuard Interface Error">
        {activeTab === 'home' ? (
          <div className="flex-1 w-full">
            <HomePage onNavigate={setActiveTab} />
          </div>
        ) : (
          <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'production' ? (
              <ProductionLineDashboard />
            ) : activeTab === '8086' ? (
              <MicroprocessorLab latestInspectionResult={latestInspection} />
            ) : activeTab === 'deam' ? (
              <DeamLaboratory latestInspectionResult={latestInspection} />
            ) : activeTab === 'vision' ? (
              <VisionInspector onInspectionComplete={setLatestInspection} />
            ) : (
              <MonitoringDashboard
                healthData={healthData}
                latencyMs={latencyMs}
                records={records}
                onClearRecords={clearLog}
                onRefreshHealth={runHealthCheck}
              />
            )}
          </main>
        )}
      </ErrorBoundary>

      <footer className="border-t border-slate-200 bg-white px-6 py-5 text-xs text-[#667085] mt-auto">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>VisionGuard 2.0 &bull; Intelligent Quality Inspection &amp; Automated Sorting System</span>
          <span className="font-mono text-[11px] text-slate-400">
            DEAM Capstone Project &bull; Academic Engineering Platform
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
