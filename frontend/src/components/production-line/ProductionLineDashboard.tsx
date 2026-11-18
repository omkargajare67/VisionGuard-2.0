import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConveyorVisualization } from './ConveyorVisualization';
import { SimulationControls } from './SimulationControls';
import { ControllerModeSelector } from './ControllerModeSelector';
import { InspectionStationPanel } from './InspectionStationPanel';
import { SortingStationPanel } from './SortingStationPanel';
import { EventTimeline } from './EventTimeline';
import { FaultInjectionPanel } from './FaultInjectionPanel';
import { productionLineApi } from '../../services/api';
import type { ProductionLineFullState } from '../../types';
import {
  RefreshCw,
  AlertCircle,
  Factory,
  CheckCircle2,
  XCircle,
  Layers,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const ProductionLineDashboard: React.FC = () => {
  const [sessionId] = useState<string>(() => {
    const key = 'visionguard_production_session';
    const existing = typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
    if (existing) return existing;
    const newId = `prod-${Math.random().toString(36).substring(2, 9)}`;
    if (typeof window !== 'undefined') sessionStorage.setItem(key, newId);
    return newId;
  });
  const [state, setState] = useState<ProductionLineFullState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showAdvancedDiagnostics, setShowAdvancedDiagnostics] = useState<boolean>(false);

  const isTickingRef = useRef<boolean>(false);

  // Fetch full state from backend
  const refreshState = useCallback(async () => {
    try {
      const data = await productionLineApi.getState(sessionId);
      setState(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with production line engine');
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Initial load
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Automatic Simulation Loop
  useEffect(() => {
    if (!state) return;
    const isLineRunning =
      Boolean(state.conveyor?.running || state.conveyor?.is_running) &&
      !Boolean(state.conveyor?.paused || state.conveyor?.is_paused) &&
      !Boolean(state.conveyor?.emergency_stopped) &&
      !Boolean(state.fault_state?.has_fault);

    if (!isLineRunning) return;

    const tickIntervalMs = Math.max(80, Math.round(500 / (state.conveyor?.speed || 2.0)));

    const timer = setInterval(async () => {
      if (isTickingRef.current) return;
      try {
        isTickingRef.current = true;
        const updatedState = await productionLineApi.tick(sessionId, 1);
        setState(updatedState);
      } catch (err: any) {
        console.error('Simulation tick error:', err);
      } finally {
        isTickingRef.current = false;
      }
    }, tickIntervalMs);

    return () => clearInterval(timer);
  }, [
    state?.line_state,
    state?.conveyor?.running,
    state?.conveyor?.is_running,
    state?.conveyor?.paused,
    state?.conveyor?.is_paused,
    state?.conveyor?.emergency_stopped,
    state?.conveyor?.speed,
    state?.fault_state?.has_fault,
    sessionId,
  ]);

  // Handlers
  const handleStart = async () => {
    try {
      await productionLineApi.start(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handlePause = async () => {
    try {
      await productionLineApi.pause(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleResume = async () => {
    try {
      await productionLineApi.resume(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStop = async () => {
    try {
      await productionLineApi.stop(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleStep = async () => {
    try {
      const updated = await productionLineApi.tick(sessionId, 1);
      setState(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReset = async () => {
    try {
      const updated = await productionLineApi.resetSession(sessionId);
      setState(updated);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetSpeed = async (speed: number) => {
    try {
      await productionLineApi.setSpeed(sessionId, speed);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      await productionLineApi.emergencyStop(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClearEmergencyStop = async () => {
    try {
      await productionLineApi.clearEmergencyStop(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddProduct = async (sampleId: string) => {
    try {
      await productionLineApi.addProduct(sessionId, sampleId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddBatchDemo = async () => {
    try {
      await productionLineApi.addBatchDemo(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSelectMode = async (mode: 'DEAM_LOGIC' | 'MICROPROCESSOR_8086') => {
    try {
      await productionLineApi.setControllerMode(sessionId, mode);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInjectFault = async (faultType: string) => {
    try {
      await productionLineApi.injectFault(sessionId, faultType);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleClearFault = async () => {
    try {
      await productionLineApi.clearFault(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading && !state) {
    return (
      <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 mx-auto animate-spin mb-3 text-[#F59A16]" />
        <span className="font-mono text-xs">Initializing Virtual Production Line Engine...</span>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 max-w-xl mx-auto my-12">
        <div className="flex items-center space-x-3 mb-2">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          <h3 className="font-bold text-base">Production Line Connection Error</h3>
        </div>
        <p className="text-xs font-mono">{error}</p>
        <button
          onClick={refreshState}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!state) return null;

  const metrics = state.metrics;
  const totalEntered = metrics?.total_entered ?? 0;
  const totalPassed = metrics?.total_passed ?? 0;
  const totalRejected = metrics?.total_rejected ?? 0;
  const activeCount = metrics?.active_products ?? state.active_products.length ?? 0;

  const currentInspectingProduct =
    state.active_products.find((p) => p.status === 'AT_INSPECTION') || null;

  const lastInspectedProduct =
    state.active_products
      .filter((p) => p.status === 'INSPECTED' || p.status === 'AT_SORTING' || p.sorting_result !== null)
      .slice(-1)[0] ||
    state.completed_products.slice(-1)[0] ||
    null;

  const isRunning = Boolean(state.conveyor.running || state.conveyor.is_running);
  const isPaused = Boolean(state.conveyor.paused || state.conveyor.is_paused);

  return (
    <div className="space-y-8 font-sans">
      {/* ========================================================= */}
      {/* 1. PAGE HEADER & SYSTEM STATUS                            */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="w-10 h-1 bg-[#F59A16] rounded-full mb-2" />
          <div className="flex items-center space-x-2.5">
            <h1 className="text-3xl font-extrabold text-[#252B35] tracking-tight">
              Virtual Production Line
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#F59A16]/10 text-[#F59A16] border border-[#F59A16]/20">
              Stage 5 Integrated
            </span>
          </div>
          <p className="text-sm text-[#667085] mt-1">
            Real-time industrial conveyor simulation, automated quality inspection and pneumatic sorting.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 shadow-sm text-slate-600">
            Session: <strong className="text-slate-900">{sessionId}</strong>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 shadow-sm ${
              state.conveyor.emergency_stopped
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : state.fault_state?.has_fault
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : isRunning
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                state.conveyor.emergency_stopped
                  ? 'bg-rose-600 animate-ping'
                  : isRunning
                  ? 'bg-emerald-600 animate-pulse'
                  : 'bg-slate-400'
              }`}
            />
            <span>
              {state.conveyor.emergency_stopped
                ? 'E-STOPPED'
                : state.fault_state?.has_fault
                ? 'FAULT'
                : isRunning
                ? isPaused
                  ? 'PAUSED'
                  : 'RUNNING'
                : 'STOPPED'}
            </span>
          </div>

          <button
            onClick={refreshState}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm transition-all cursor-pointer"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FOUR PRODUCTION KPI CARDS                              */}
      {/* ========================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ingested */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>TOTAL INGESTED</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-[#252B35] font-mono">{totalEntered}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">units</span>
          </div>
          <div className="mt-2 text-[11px] text-[#667085]">
            Processed from production queue
          </div>
        </div>

        {/* KPI 2: Approved PASS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
            <span>QUALITY APPROVED (PASS)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-emerald-600 font-mono">{totalPassed}</span>
            <span className="text-xs text-emerald-600/70 ml-1 font-mono">units</span>
          </div>
          <div className="mt-2 text-[11px] text-[#667085]">
            Diverted to Green PASS container
          </div>
        </div>

        {/* KPI 3: Rejected Units */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>REJECTED DEFECTS</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-rose-600 font-mono">{totalRejected}</span>
            <span className="text-xs text-rose-600/70 ml-1 font-mono">units</span>
          </div>
          <div className="mt-2 text-[11px] text-[#667085]">
            Diverted to Red REJECT bin
          </div>
        </div>

        {/* KPI 4: Active on Belt */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>ACTIVE ON CONVEYOR</span>
            <Activity className="w-4 h-4 text-[#F59A16]" />
          </div>
          <div className="mt-2">
            <span className="text-3xl font-extrabold text-[#F59A16] font-mono">{activeCount}</span>
            <span className="text-xs text-slate-400 ml-1 font-mono">in transit</span>
          </div>
          <div className="mt-2 text-[11px] text-[#667085]">
            Speed: {state.conveyor.speed.toFixed(1)} u/tick
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. LARGE CONVEYOR VISUALISATION (MAIN VISUAL FOCUS)       */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Factory className="w-4 h-4 text-[#F59A16]" />
            <h2 className="text-base font-bold text-[#252B35]">
              Real-Time Conveyor Kinematics &amp; Station Topology
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Belt Position: {state.simulation_tick} ticks
          </span>
        </div>

        {/* Conveyor Canvas */}
        <ConveyorVisualization
          conveyor={state.conveyor}
          sensors={state.sensors}
          actuators={state.actuators}
          activeProducts={state.active_products}
          selectedProductId={selectedProductId}
          onSelectProduct={setSelectedProductId}
          lineState={state.line_state}
        />
      </div>

      {/* ========================================================= */}
      {/* 4. OPERATOR CONTROLS BAR                                  */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-[#252B35]">Conveyor Operator Controls</h2>
        <SimulationControls
          isRunning={isRunning}
          isPaused={isPaused}
          speed={state.conveyor.speed}
          emergencyStopped={state.conveyor.emergency_stopped}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onStop={handleStop}
          onStep={handleStep}
          onReset={handleReset}
          onSetSpeed={handleSetSpeed}
          onEmergencyStop={handleEmergencyStop}
          onClearEmergencyStop={handleClearEmergencyStop}
          onAddProduct={handleAddProduct}
          onAddBatchDemo={handleAddBatchDemo}
          isLoading={isLoading}
        />
      </div>

      {/* ========================================================= */}
      {/* 5. CURRENT PRODUCT INSPECTION & SORTING STATUS (2 COLS)    */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Inspection Station Panel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <InspectionStationPanel
            currentProduct={currentInspectingProduct}
            lastInspectedProduct={lastInspectedProduct}
          />
        </div>

        {/* Sorting Station Panel */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <SortingStationPanel actuators={state.actuators} />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 6. EVENT HISTORY TIMELINE                                 */}
      {/* ========================================================= */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#252B35]">
          Live Operational Audit Event History
        </h2>
        <EventTimeline events={state.recent_events} />
      </div>

      {/* ========================================================= */}
      {/* 7. ADVANCED CONTROLLER DIAGNOSTICS & FAULT INJECTION      */}
      {/* ========================================================= */}
      <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => setShowAdvancedDiagnostics(!showAdvancedDiagnostics)}
          className="w-full p-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-[#252B35]">
                Advanced Controller Engine &amp; Hardware Fault Injection
              </span>
              <span className="text-xs text-[#667085] block">
                Switch controller architecture (DEAM Combinational vs 8086/8255 PPI) and inject hardware anomalies
              </span>
            </div>
          </div>

          {showAdvancedDiagnostics ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {showAdvancedDiagnostics && (
          <div className="p-6 border-t border-slate-100 bg-[#F5F6F7] space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Controller Mode Selector */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <ControllerModeSelector
                  currentMode={state.controller_mode}
                  onSelectMode={handleSelectMode}
                  isLoading={isLoading}
                />
              </div>

              {/* Hardware Fault Injection Panel */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <FaultInjectionPanel
                  faultState={state.fault_state}
                  onInjectFault={handleInjectFault}
                  onClearFault={handleClearFault}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
