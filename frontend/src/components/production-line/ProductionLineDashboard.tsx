import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ConveyorVisualization,
} from './ConveyorVisualization';
import { SimulationControls } from './SimulationControls';
import { ControllerModeSelector } from './ControllerModeSelector';
import { InspectionStationPanel } from './InspectionStationPanel';
import { SortingStationPanel } from './SortingStationPanel';
import { ProductionMetricsPanel } from './ProductionMetricsPanel';
import { EventTimeline } from './EventTimeline';
import { FaultInjectionPanel } from './FaultInjectionPanel';
import { productionLineApi } from '../../services/api';
import type { ProductionLineFullState } from '../../types';
import { RefreshCw, AlertCircle, Factory } from 'lucide-react';

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

  // Automatic Simulation Loop (when running)
  useEffect(() => {
    if (!state) return;
    const isLineRunning =
      Boolean(state.conveyor.running || state.conveyor.is_running) &&
      !Boolean(state.conveyor.paused || state.conveyor.is_paused) &&
      !state.conveyor.emergency_stopped &&
      !state.fault_state.has_fault;

    if (!isLineRunning) return;

    // Tick speed: 250ms at 2.0x, scaled inversely with speed
    const tickIntervalMs = Math.max(80, Math.round(500 / (state.conveyor.speed || 2.0)));

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
  }, [state?.line_state, state?.conveyor.is_paused, state?.conveyor.emergency_stopped, state?.conveyor.speed, state?.fault_state.has_fault, sessionId]);

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

  const handleSelectMode = async (mode: 'DEAM_LOGIC' | 'MICROPROCESSOR_8086') => {
    try {
      await productionLineApi.setControllerMode(sessionId, mode);
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

  const handleResetMetrics = async () => {
    try {
      await productionLineApi.resetMetrics(sessionId);
      await refreshState();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (isLoading && !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
        <span className="font-mono text-sm">Initializing Virtual Production Line Engine...</span>
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="p-6 rounded-2xl bg-rose-950/20 border border-rose-500/30 text-rose-300 max-w-xl mx-auto my-12">
        <div className="flex items-center space-x-3 mb-2">
          <AlertCircle className="w-6 h-6 text-rose-400" />
          <h3 className="font-bold text-lg">Production Line Connection Error</h3>
        </div>
        <p className="text-sm font-mono">{error}</p>
        <button
          onClick={refreshState}
          className="mt-4 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs font-mono transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  if (!state) return null;

  // Selected product logic
  const currentInspectingProduct =
    state.active_products.find((p) => p.status === 'AT_INSPECTION') || null;

  const lastInspectedProduct =
    state.active_products
      .filter((p) => p.status === 'INSPECTED' || p.status === 'AT_SORTING' || p.sorting_result !== null)
      .slice(-1)[0] ||
    state.completed_products.slice(-1)[0] ||
    null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-lg shadow-cyan-600/20">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Virtual Production Line &amp; Automated Sorting
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                STAGE 5 COMPLETE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-End Integration of OpenCV Inspection, DEAM Digital Logic &amp; Intel 8086/8255 Microprocessor Control
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-end md:self-auto text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
            Session: <span className="text-white font-bold">{sessionId}</span>
          </div>

          <button
            onClick={refreshState}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Refresh State"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Conveyor Schematic Visualization */}
      <ConveyorVisualization
        conveyor={state.conveyor}
        sensors={state.sensors}
        actuators={state.actuators}
        activeProducts={state.active_products}
        selectedProductId={selectedProductId}
        onSelectProduct={setSelectedProductId}
        lineState={state.line_state}
      />

      {/* Simulation Controls & Product Injection Bar */}
      <SimulationControls
        isRunning={Boolean(state.conveyor.running || state.conveyor.is_running)}
        isPaused={Boolean(state.conveyor.paused || state.conveyor.is_paused)}
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

      {/* Dual Controller Engine Architecture Selector */}
      <ControllerModeSelector
        currentMode={state.controller_mode}
        onSelectMode={handleSelectMode}
        isLoading={isLoading}
      />

      {/* Dual Station Diagnostic Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Station 1: OpenCV Computer Vision */}
        <InspectionStationPanel
          currentProduct={currentInspectingProduct}
          lastInspectedProduct={lastInspectedProduct}
        />

        {/* Station 2: Automated Pneumatic Sorting & Actuators */}
        <SortingStationPanel actuators={state.actuators} />
      </div>

      {/* Production Analytics, Yield & Defect Pareto Breakdown */}
      <ProductionMetricsPanel
        metrics={state.metrics}
        onResetMetrics={handleResetMetrics}
      />

      {/* Real-Time Event Audit Log & Hardware Fault Injection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EventTimeline events={state.recent_events} />
        <FaultInjectionPanel
          faultState={state.fault_state}
          onInjectFault={handleInjectFault}
          onClearFault={handleClearFault}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
