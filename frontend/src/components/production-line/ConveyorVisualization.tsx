import React from 'react';
import type {
  ConveyorState,
  SensorItem,
  ActuatorState,
  ProductDTO,
} from '../../types';
import { AlertTriangle, CheckCircle2, XCircle, ArrowRight, Eye, Radio } from 'lucide-react';

interface ConveyorVisualizationProps {
  conveyor: ConveyorState;
  sensors: Record<string, SensorItem>;
  actuators: ActuatorState;
  activeProducts: ProductDTO[];
  selectedProductId: string | null;
  onSelectProduct: (productId: string) => void;
  lineState: string;
}

export const ConveyorVisualization: React.FC<ConveyorVisualizationProps> = ({
  conveyor,
  sensors,
  actuators,
  activeProducts,
  selectedProductId,
  onSelectProduct,
  lineState,
}) => {
  const isRunning = conveyor.is_running && !conveyor.is_paused && !conveyor.emergency_stopped;
  const gateAngle = actuators.diverter_gate.angle_deg || 0;

  // Sensor states
  const ir1Active = sensors['IR-01']?.active ?? false;
  const ir2Active = sensors['IR-02']?.active ?? false;
  const ir3Active = sensors['IR-03']?.active ?? false;
  const exitActive = sensors['EXIT-01']?.active ?? false;

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-5 shadow-2xl overflow-hidden select-none">
      {/* Background Grid Pattern & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />
      {lineState === 'EMERGENCY_STOP' && (
        <div className="absolute inset-0 bg-rose-950/20 pointer-events-none border-2 border-rose-500/50 rounded-2xl animate-pulse" />
      )}

      {/* Top Status Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80 text-xs">
        <div className="flex items-center space-x-3">
          <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Radio className={`w-3.5 h-3.5 ${isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            Conveyor Line System
          </span>
          <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] uppercase font-bold border ${
            isRunning
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : conveyor.emergency_stopped
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
          }`}>
            {lineState}
          </span>
          <span className="text-slate-400 font-mono">
            Speed: <span className="text-white font-bold">{conveyor.speed.toFixed(1)} u/tick</span>
          </span>
        </div>

        {/* Actuator Status Pills */}
        <div className="flex items-center space-x-2">
          {/* Green LED */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all ${
            actuators.green_led
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-500/50'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${actuators.green_led ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
            <span>PASS LED</span>
          </div>

          {/* Red LED */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all ${
            actuators.red_led
              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm shadow-rose-500/50'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${actuators.red_led ? 'bg-rose-400 animate-pulse' : 'bg-slate-700'}`} />
            <span>REJECT LED</span>
          </div>

          {/* Buzzer */}
          <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[11px] font-mono transition-all ${
            actuators.buzzer
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/50 animate-bounce'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}>
            <AlertTriangle className="w-3 h-3" />
            <span>BUZZER</span>
          </div>

          {/* Gate */}
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span>GATE:</span>
            <span className={gateAngle > 0 ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
              {gateAngle}° {gateAngle > 0 ? '(DIVERT)' : '(PASS)'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Schematic Graphic Container */}
      <div className="relative w-full h-[240px] mt-2 mb-1 flex items-center">
        {/* SVG Schematic Layer */}
        <svg
          viewBox="0 0 1000 240"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Belt pattern */}
            <pattern id="conveyorPattern" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="20" y2="20" stroke="#334155" strokeWidth="1.5" opacity="0.4" />
            </pattern>
            {/* Diverter gradient */}
            <linearGradient id="gateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {/* Main Conveyor Bed (Pos 0 to 700) */}
          <rect
            x="20"
            y="95"
            width="680"
            height="50"
            rx="8"
            fill="#0f172a"
            stroke="#1e293b"
            strokeWidth="3"
          />
          <rect
            x="22"
            y="97"
            width="676"
            height="46"
            rx="6"
            fill="url(#conveyorPattern)"
            className={isRunning ? 'animate-pulse' : ''}
          />

          {/* PASS Continuation Belt (Pos 700 to 980) */}
          <rect
            x="700"
            y="95"
            width="280"
            height="50"
            rx="8"
            fill="#064e3b"
            stroke="#059669"
            strokeWidth="2"
            opacity="0.3"
          />
          <rect
            x="702"
            y="97"
            width="276"
            height="46"
            rx="6"
            fill="#0f172a"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />

          {/* REJECT Divert Chute (Pos 700 to 920 downwards at angle) */}
          <path
            d="M 700 145 L 880 220 L 960 220 L 820 145 Z"
            fill="#450a0a"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.4"
          />
          <text x="890" y="210" fill="#f87171" fontSize="10" fontFamily="monospace" fontWeight="bold">
            REJECT BIN ({actuators.reject_lane_count})
          </text>

          {/* PASS Exit Label */}
          <text x="910" y="85" fill="#34d399" fontSize="10" fontFamily="monospace" fontWeight="bold">
            PASS EXIT ({actuators.pass_lane_count})
          </text>

          {/* Conveyor Rollers (Entry, Intermediate, Exit) */}
          <circle cx="28" cy="120" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="28" cy="120" r="4" fill="#38bdf8" />

          <circle cx="700" cy="120" r="12" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="700" cy="120" r="4" fill="#f59e0b" />

          <circle cx="972" cy="120" r="14" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <circle cx="972" cy="120" r="4" fill="#10b981" />

          {/* STATIONS & SENSORS */}

          {/* 1. ENTRY (x = 40) */}
          <g transform="translate(40, 50)">
            <rect x="-15" y="0" width="30" height="40" rx="4" fill="#1e293b" stroke="#334155" />
            <text x="0" y="-8" fill="#94a3b8" fontSize="9" textAnchor="middle" fontFamily="monospace">
              ENTRY
            </text>
            <path d="M -5 15 L 0 22 L 5 15" stroke="#38bdf8" strokeWidth="2" fill="none" />
          </g>

          {/* 2. IR SENSOR 1 (Arrival, x = 100) */}
          <g transform="translate(100, 70)">
            {/* Optical beam */}
            <line
              x1="0"
              y1="5"
              x2="0"
              y2="100"
              stroke={ir1Active ? '#f43f5e' : '#10b981'}
              strokeWidth={ir1Active ? '3' : '1.5'}
              strokeDasharray={ir1Active ? 'none' : '3 3'}
              opacity={ir1Active ? 0.9 : 0.4}
            />
            {/* Sensor Emitter */}
            <rect x="-8" y="-5" width="16" height="12" rx="2" fill="#0f172a" stroke="#475569" />
            <circle cx="0" cy="1" r="3" fill={ir1Active ? '#f43f5e' : '#10b981'} />
            <text x="0" y="-12" fill={ir1Active ? '#f43f5e' : '#94a3b8'} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              IR-01
            </text>
          </g>

          {/* 3. INSPECTION STATION (x = 300) with Industrial Camera */}
          <g transform="translate(300, 25)">
            {/* Overhead Rigging Structure */}
            <path d="M -40 0 L 40 0 L 30 35 L -30 35 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Camera Lens */}
            <circle cx="0" cy="35" r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="0" cy="35" r="4" fill="#ffffff" />
            {/* Optical FOV cone */}
            <polygon
              points="-35,120 35,120 10,45 -10,45"
              fill="#0ea5e9"
              opacity={ir2Active ? 0.25 : 0.08}
            />
            <text x="0" y="-6" fill="#38bdf8" fontSize="10" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              OPENCV CAM
            </text>

            {/* IR Sensor 2 (Stop Trigger) at x=300 */}
            <line
              x1="0"
              y1="50"
              x2="0"
              y2="145"
              stroke={ir2Active ? '#f59e0b' : '#38bdf8'}
              strokeWidth={ir2Active ? '2.5' : '1'}
              strokeDasharray={ir2Active ? 'none' : '2 2'}
              opacity={ir2Active ? 1 : 0.3}
            />
          </g>

          {/* 4. IR SENSOR 3 (Sorting Arrival, x = 680) */}
          <g transform="translate(680, 70)">
            <line
              x1="0"
              y1="5"
              x2="0"
              y2="100"
              stroke={ir3Active ? '#f43f5e' : '#10b981'}
              strokeWidth={ir3Active ? '3' : '1.5'}
              strokeDasharray={ir3Active ? 'none' : '3 3'}
              opacity={ir3Active ? 0.9 : 0.4}
            />
            <rect x="-8" y="-5" width="16" height="12" rx="2" fill="#0f172a" stroke="#475569" />
            <circle cx="0" cy="1" r="3" fill={ir3Active ? '#f43f5e' : '#10b981'} />
            <text x="0" y="-12" fill={ir3Active ? '#f43f5e' : '#94a3b8'} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              IR-03
            </text>
          </g>

          {/* 5. PNEUMATIC DIVERTER GATE (Pivot at x = 705, y = 120) */}
          <g transform="translate(705, 120)">
            {/* Gate Arm with dynamic rotation */}
            <g transform={`rotate(${gateAngle})`}>
              <rect x="0" y="-5" width="55" height="10" rx="3" fill="url(#gateGrad)" stroke="#b45309" strokeWidth="1.5" />
              <line x1="10" y1="0" x2="45" y2="0" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 3" />
            </g>
            {/* Servo Pivot Cylinder */}
            <circle cx="0" cy="0" r="9" fill="#1e293b" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="0" cy="0" r="3" fill="#ffffff" />
            <text x="0" y="-16" fill="#f59e0b" fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              SERVO GATE
            </text>
          </g>

          {/* 6. EXIT SENSOR (x = 900) */}
          <g transform="translate(900, 70)">
            <line
              x1="0"
              y1="5"
              x2="0"
              y2="100"
              stroke={exitActive ? '#f43f5e' : '#10b981'}
              strokeWidth={exitActive ? '3' : '1.5'}
              strokeDasharray={exitActive ? 'none' : '3 3'}
              opacity={exitActive ? 0.9 : 0.4}
            />
            <rect x="-8" y="-5" width="16" height="12" rx="2" fill="#0f172a" stroke="#475569" />
            <circle cx="0" cy="1" r="3" fill={exitActive ? '#f43f5e' : '#10b981'} />
            <text x="0" y="-12" fill={exitActive ? '#f43f5e' : '#94a3b8'} fontSize="8" textAnchor="middle" fontFamily="monospace" fontWeight="bold">
              EXIT-01
            </text>
          </g>
        </svg>

        {/* DYNAMIC PRODUCTS (HTML Overlay with precise coordinate positioning) */}
        {activeProducts.map((product) => {
          // Normalize position 0-100%
          const pct = Math.max(0, Math.min(100, product.position));

          // Compute Y offset if diverting to reject chute (position > 70 and sorting_result == REJECT)
          let topOffset = 105; // Base conveyor center
          if (pct >= 70 && product.sorting_result === 'REJECT') {
            const divertProgress = (pct - 70) / 30; // 0 to 1
            topOffset = 105 + divertProgress * 75; // Moves down into reject bin
          }

          const isSelected = selectedProductId === product.id;
          const isInspecting = product.status === 'AT_INSPECTION';
          const isPass = product.sorting_result === 'PASS';
          const isReject = product.sorting_result === 'REJECT';

          return (
            <div
              key={product.id}
              onClick={() => onSelectProduct(product.id)}
              style={{
                left: `calc(${pct}% - 28px)`,
                top: `${topOffset}px`,
              }}
              className={`absolute cursor-pointer transition-all duration-150 transform hover:scale-110 z-20 ${
                isSelected ? 'scale-110 ring-2 ring-cyan-400' : ''
              }`}
            >
              <div
                className={`w-14 h-9 rounded-md border flex flex-col items-center justify-center p-0.5 shadow-lg ${
                  isInspecting
                    ? 'bg-amber-950/80 border-amber-400 text-amber-200 animate-pulse shadow-amber-500/30'
                    : isPass
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200 shadow-emerald-500/20'
                    : isReject
                    ? 'bg-rose-950/80 border-rose-400 text-rose-200 shadow-rose-500/20'
                    : 'bg-slate-800 border-cyan-500/50 text-cyan-200'
                }`}
              >
                {/* Product ID & Micro Badge */}
                <span className="font-mono text-[9px] font-bold tracking-tight">
                  {product.sample_id}
                </span>

                <div className="flex items-center space-x-0.5 text-[8px]">
                  {isPass && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                  {isReject && <XCircle className="w-2.5 h-2.5 text-rose-400" />}
                  {isInspecting && <Eye className="w-2.5 h-2.5 text-amber-400 animate-spin" />}
                  <span className="font-mono text-[7px] text-slate-300">
                    {Math.round(product.position)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Track Ruler & Legend */}
      <div className="relative z-10 flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-cyan-500" /> Normal Track
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-emerald-500" /> Pass Lane (0°-Gate)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-rose-500" /> Reject Chute (45°-Gate)
          </span>
        </div>

        <div className="flex items-center space-x-3 text-slate-500">
          <span>0% INTAKE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span>10% IR-01</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span>30% VISION CAM</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span>70% IR-03 & GATE</span>
          <ArrowRight className="w-3 h-3 text-slate-600" />
          <span>90% EXIT</span>
        </div>
      </div>
    </div>
  );
};
