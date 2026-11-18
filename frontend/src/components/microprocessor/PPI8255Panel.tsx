import React, { useState } from 'react';
import { Cpu, CheckCircle2, XCircle, Volume2, RefreshCw } from 'lucide-react';
import type { PPIState, InspectionResult } from '../../types';
import { microprocessorApi } from '../../services/api';

interface PPI8255PanelProps {
  sessionId: string;
  ppiState: PPIState | null;
  onPPIUpdate: (state: PPIState) => void;
  latestInspectionResult?: InspectionResult | null;
}

export const PPI8255Panel: React.FC<PPI8255PanelProps> = ({
  sessionId,
  ppiState,
  onPPIUpdate,
  latestInspectionResult,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const portA = ppiState?.port_values?.PORT_A?.val ?? 0x3d;
  const portB = ppiState?.port_values?.PORT_B?.val ?? 0x05;
  const ctrlWord = ppiState?.control_word?.hex ?? '0x90';
  const actuators = ppiState?.actuators ?? {
    raw_byte: 5,
    hex: '0x05',
    binary: '00000101',
    conveyor_motor: 1,
    reject_gate: 0,
    green_led: 1,
    red_led: 0,
    buzzer: 0,
    busy: 0,
    decision: 'PASS' as const,
  };

  const handleTogglePortABit = async (bitIndex: number) => {
    const newPortA = portA ^ (1 << bitIndex);
    setLoading(true);
    try {
      const res = await microprocessorApi.writePPIPort(sessionId, 'A', newPortA);
      onPPIUpdate(res.ppi_state);
      setStatusMessage(`Updated Port A to 0x${newPortA.toString(16).toUpperCase().padStart(2, '0')}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Write failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImportVisionFlags = async () => {
    if (!latestInspectionResult) {
      setStatusMessage('No vision inspection result available in memory. Run an inspection in the Vision Inspector first!');
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await microprocessorApi.loadVisionFlagsToPPI(sessionId, {
        D: latestInspectionResult.flags.geometry_ok,
        S: latestInspectionResult.flags.surface_defect_detected,
        C: latestInspectionResult.flags.components_complete,
        L: latestInspectionResult.flags.label_present,
        M: latestInspectionResult.flags.marking_correct,
        G: latestInspectionResult.flags.product_detected,
      });
      onPPIUpdate(res.ppi_state);
      setStatusMessage(
        `Imported OpenCV flags from ${latestInspectionResult.sample_id_or_filename} into Port A: ${res.ppi_state?.port_values?.PORT_A?.hex || ''}`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Import failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPresetSample = async (isPass: boolean) => {
    setLoading(true);
    try {
      const flags = isPass
        ? { D: 1, S: 0, C: 1, L: 1, M: 1, G: 1 }
        : { D: 1, S: 1, C: 0, L: 0, M: 0, G: 1 };

      const res = await microprocessorApi.loadVisionFlagsToPPI(sessionId, flags);
      onPPIUpdate(res.ppi_state);
      setStatusMessage(
        isPass
          ? 'Loaded Nominal PASS sample (VG-001) flags into Port A (0x3D = 00111101B)'
          : 'Loaded Defective REJECT sample (VG-004) flags into Port A (0x23 = 00100011B)'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Preset failed';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const portABits = [
    { bit: 0, label: 'D (Dimension)', desc: 'Product Outer Boundary Valid', val: (portA >> 0) & 1 },
    { bit: 1, label: 'S (Scratch)', desc: 'Surface Scratch Detected', val: (portA >> 1) & 1 },
    { bit: 2, label: 'C (Components)', desc: 'All 3 Terminal Components Present', val: (portA >> 2) & 1 },
    { bit: 3, label: 'L (Label)', desc: 'White Identification Label Present', val: (portA >> 3) & 1 },
    { bit: 4, label: 'M (Marking)', desc: 'Blue Identification Mark Color Valid', val: (portA >> 4) & 1 },
    { bit: 5, label: 'G (Gate/Trigger)', desc: 'Product Present at Photo-Sensor', val: (portA >> 5) & 1 },
    { bit: 6, label: 'Reserved', desc: 'Unassigned (0)', val: (portA >> 6) & 1 },
    { bit: 7, label: 'Ready/Strobe', desc: 'Data Valid Strobe Input', val: (portA >> 7) & 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/80 border border-cyan-700/60 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                Intel 8255 Programmable Peripheral Interface (PPI)
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-mono">
                  I/O Mapped: 80H - 83H
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Interfaces 8086 CPU with VisionGuard vision sensors (Port A: 80H) and sorting actuators (Port B: 81H).
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleSetPresetSample(true)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900 transition-colors"
            >
              Preset: PASS Sample (3DH)
            </button>
            <button
              onClick={() => handleSetPresetSample(false)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950 text-rose-300 border border-rose-700 hover:bg-rose-900 transition-colors"
            >
              Preset: REJECT Sample (23H)
            </button>
            <button
              onClick={handleImportVisionFlags}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors shadow"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Import Live OpenCV Flags
            </button>
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="mt-4 p-3 bg-cyan-950/50 border border-cyan-800 rounded-lg text-xs text-cyan-300 font-mono">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Main Ports Grid: Port A (Input) and Port B (Actuator Outputs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Port A: Input Sensors */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                  Port A: Vision Sensor Inputs (Port 80H)
                </h4>
                <p className="text-xs text-slate-400">Mode 0 Input — Click any bit to manually toggle sensor state</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400">Value: </span>
                <span className="text-sm font-bold text-cyan-400">
                  0x{portA.toString(16).toUpperCase().padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-400 ml-1">({portA.toString(2).padStart(8, '0')}B)</span>
              </div>
            </div>

            {/* 8-bit Interactive Toggles */}
            <div className="space-y-2 mt-4">
              {portABits.map((item) => {
                const isActive = item.val === 1;
                return (
                  <button
                    key={item.bit}
                    onClick={() => handleTogglePortABit(item.bit)}
                    disabled={loading}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 border-cyan-500/80 text-cyan-100 shadow'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold ${
                          isActive ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {item.bit}
                      </span>
                      <div>
                        <div className="font-mono text-xs font-bold text-slate-200">{item.label}</div>
                        <div className="text-[11px] text-slate-400">{item.desc}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className={`font-bold ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}>
                        {isActive ? 'HIGH (1)' : 'LOW (0)'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Port B: Sorting Actuators */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                  Port B: Automated Sorting Actuators (Port 81H)
                </h4>
                <p className="text-xs text-slate-400">Mode 0 Output — Controlled by 8086 Assembly Program</p>
              </div>
              <div className="text-right font-mono">
                <span className="text-xs text-slate-400">Value: </span>
                <span className="text-sm font-bold text-emerald-400">
                  0x{portB.toString(16).toUpperCase().padStart(2, '0')}
                </span>
                <span className="text-xs text-slate-400 ml-1">({portB.toString(2).padStart(8, '0')}B)</span>
              </div>
            </div>

            {/* Actuator Status Cards */}
            <div className="space-y-2 mt-4">
              {/* PB0 Conveyor Motor */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  actuators.conveyor_motor
                    ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-100 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                    PB0
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-200">Main Conveyor Belt</span>
                    <p className="text-[11px] text-slate-400">Transports product through inspection cell</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    actuators.conveyor_motor ? 'bg-emerald-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {actuators.conveyor_motor ? 'RUNNING' : 'STOPPED'}
                </span>
              </div>

              {/* PB1 Reject Gate */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  actuators.reject_gate
                    ? 'bg-rose-950/70 border-rose-500/90 text-rose-100 shadow-lg shadow-rose-950/40'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                    PB1
                  </span>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-200">Pneumatic Reject Diverter</span>
                    <p className="text-[11px] text-slate-400">Diverts defective products into reject bin</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    actuators.reject_gate ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {actuators.reject_gate ? 'DIVERTING' : 'IDLE'}
                </span>
              </div>

              {/* PB2 Green LED (PASS) */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  actuators.green_led
                    ? 'bg-emerald-950/70 border-emerald-500 text-emerald-100 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                    PB2
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${actuators.green_led ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs font-bold text-slate-200">Green LED (PASS Indicator)</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    actuators.green_led ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {actuators.green_led ? 'LIT' : 'OFF'}
                </span>
              </div>

              {/* PB3 Red LED (REJECT) */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  actuators.red_led
                    ? 'bg-rose-950/70 border-rose-500 text-rose-100 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                    PB3
                  </span>
                  <div className="flex items-center gap-1.5">
                    <XCircle className={`w-4 h-4 ${actuators.red_led ? 'text-rose-400' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs font-bold text-slate-200">Red LED (REJECT Indicator)</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    actuators.red_led ? 'bg-rose-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {actuators.red_led ? 'LIT' : 'OFF'}
                </span>
              </div>

              {/* PB4 Alarm Buzzer */}
              <div
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  actuators.buzzer
                    ? 'bg-amber-950/70 border-amber-500 text-amber-100 shadow'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-bold bg-slate-800 text-slate-300">
                    PB4
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Volume2 className={`w-4 h-4 ${actuators.buzzer ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="font-mono text-xs font-bold text-slate-200">Acoustic Alarm Buzzer</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    actuators.buzzer ? 'bg-amber-500 text-slate-950 animate-bounce' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {actuators.buzzer ? 'ALARM ON' : 'SILENT'}
                </span>
              </div>
            </div>
          </div>

          {/* Control Word Register status */}
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Control Register (83H):</span>
            <span className="text-indigo-400 font-bold">
              {ctrlWord} (Mode 0: Port A In, Port B Out)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
