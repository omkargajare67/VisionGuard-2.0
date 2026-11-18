import React from 'react';
import {
  Play,
  ArrowRight,
  Camera,
  Cpu,
  Binary,
  Radio,
  Factory,
  BarChart3,
  Sliders,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (tab: 'home' | 'vision' | 'deam' | '8086' | 'production' | 'monitoring') => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const scrollToModules = () => {
    const el = document.getElementById('modules-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full flex flex-col font-sans">
      {/* ========================================================= */}
      {/* 1. HERO SECTION (Matches Reference Design)               */}
      {/* ========================================================= */}
      <section className="relative w-full min-h-[580px] lg:min-h-[640px] flex items-center overflow-hidden bg-slate-950">
        {/* Full-width Industrial Photograph Background */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/hero-industrial.jpg'), url('/assets/hero-conveyor.jpg')",
          }}
        />

        {/* Industrial Dark Vignette & Gradient Overlay (Ensures 100% Text Legibility) */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/40" />

        {/* Hero Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 lg:py-24 w-full">
          <div className="max-w-2xl lg:max-w-3xl space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-slate-200 text-xs font-mono font-medium shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#F59A16] animate-pulse" />
              <span>AI + DEAM + 8086 + PPI</span>
            </div>

            {/* Main Title with Reference Color Accents */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              DEAM-Integrated <br className="hidden sm:inline" />
              Intelligent Product <br />
              Quality Inspection <br className="hidden sm:inline" />
              and <span className="text-[#F59A16]">Automated Sorting System</span>
            </h1>

            {/* Subtitle Description */}
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
              A complete, educational and industrial-grade simulation that integrates computer vision,
              digital electronics, Intel 8086 microprocessor and a virtual production line.
            </p>

            {/* Primary & Secondary Action CTAs */}
            <div className="pt-2 flex flex-wrap items-center gap-4">
              <button
                onClick={() => onNavigate('production')}
                className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-bold text-sm shadow-xl shadow-[#F59A16]/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Run Production Line</span>
              </button>

              <button
                onClick={scrollToModules}
                className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900/90 text-white font-semibold text-sm border border-white/25 backdrop-blur-md transition-all cursor-pointer"
              >
                <span>Explore Modules</span>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. TECHNOLOGY STRIP (Matches Reference Design Strip)     */}
      {/* ========================================================= */}
      <section className="w-full bg-white border-y border-slate-200 shadow-sm py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
            {/* Tech 1 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('vision')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Vision Inspection</span>
              <span className="text-[11px] text-slate-500 font-mono">(OpenCV)</span>
            </div>

            {/* Tech 2 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('deam')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <Cpu className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">DEAM</span>
              <span className="text-[11px] text-slate-500 font-mono">Digital Logic</span>
            </div>

            {/* Tech 3 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('8086')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <Binary className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Intel 8086</span>
              <span className="text-[11px] text-slate-500 font-mono">Microprocessor</span>
            </div>

            {/* Tech 4 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('8086')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <Sliders className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Intel 8255</span>
              <span className="text-[11px] text-slate-500 font-mono">PPI Interface</span>
            </div>

            {/* Tech 5 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('production')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <Factory className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Virtual Production</span>
              <span className="text-[11px] text-slate-500 font-mono">Line Simulation</span>
            </div>

            {/* Tech 6 */}
            <div className="flex flex-col items-center justify-center p-3 text-center group cursor-pointer" onClick={() => onNavigate('monitoring')}>
              <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:text-[#F59A16] group-hover:bg-amber-50 transition-colors">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-2">Real-time</span>
              <span className="text-[11px] text-slate-500 font-mono">Analytics</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. WORKFLOW SECTION (7 Connected Workflow Cards)          */}
      {/* ========================================================= */}
      <section className="w-full bg-[#F5F6F7] py-16 lg:py-20 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <div className="w-12 h-1 bg-[#F59A16] rounded-full mb-3" />
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                Complete Industrial Automation Workflow
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
              From product detection to quality inspection, digital decision-making,
              microprocessor control and automated sorting — all in one integrated platform.
            </p>
          </div>

          {/* Connected 7-Card Workflow Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4 items-stretch">
            {/* Step 1: Product Entry */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <Factory className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Product Entry</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Workpiece queues into motorized conveyor intake.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 01</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 2: Sensor Detection */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <Radio className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Sensor Detection</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  IR-01 photo-sensor detects arrival edge trigger.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 02</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 3: Vision Inspection */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#F59A16] mb-3">
                  <Camera className="w-5 h-5 text-[#F59A16]" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Vision Inspection</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  OpenCV 6-point optical feature extraction.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 03</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 4: DEAM Decision */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <Cpu className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">DEAM Decision</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Boolean logic &amp; FSM computes fault flags.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 04</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 5: 8086 + 8255 Control */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <Binary className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">8086 + 8255</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Assembly routine drives Port B output lines.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 05</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 6: Automated Sorting */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 mb-3">
                  <Sliders className="w-5 h-5 text-slate-800" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Auto Sorting</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Pneumatic diverter routes PASS vs REJECT.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 06</span>
                <span className="hidden lg:inline text-[#F59A16] font-bold">→</span>
              </div>
            </div>

            {/* Step 7: Production Analytics */}
            <div className="relative bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-[#F59A16]/50 transition-all flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">Analytics &amp; QA</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                  Yield, Pareto chart &amp; deterministic audit log.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span>STAGE 07</span>
                <span className="text-emerald-500 font-bold">✓</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. PROJECT MODULES SHOWCASE (Explore VisionGuard)        */}
      {/* ========================================================= */}
      <section id="modules-section" className="w-full bg-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-[#F59A16]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Engineering Modules</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Explore the VisionGuard Platform
            </h2>
            <p className="text-sm text-slate-600">
              Interactive industrial software modules connecting computer vision, digital electronics,
              instruction-level microprocessor simulation, and factory conveyor logistics.
            </p>
          </div>

          {/* 6 Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Module 1: Vision Inspection */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#F59A16] flex items-center justify-center mb-5">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#F59A16] transition-colors">
                  Vision Inspection
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Inspect electronic modules using computer vision algorithms to identify surface scratches,
                  missing components, absent labels, non-conforming markings, and geometric deformities.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Image Upload', 'Webcam Stream', 'OpenCV CLAHE', '6-Point Flags', 'PASS/REJECT'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('vision')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-[#F59A16] text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span>Explore Vision Inspection</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Module 2: DEAM Digital Electronics Lab */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 flex items-center justify-center mb-5">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  DEAM Digital Electronics Lab
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Explore foundational logic and electronic decision-making circuits: Boolean expression parser,
                  Gray-code Karnaugh maps, adders, multiplexers, flip-flops, and Moore state machines.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Logic Gates', 'Boolean Algebra', 'K-Maps', 'Combinational', 'Flip-Flops', 'Moore FSM'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('deam')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span>Explore DEAM Lab</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Module 3: Intel 8086 Microprocessor Lab */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 flex items-center justify-center mb-5">
                  <Binary className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Intel 8086 Microprocessor Lab
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Educational 8086 CPU simulator with 16-bit register aliasing, 1 MB segmented physical memory,
                  two-pass assembler, ALU condition flags, 6-byte prefetch queue, and execution trace.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Registers AX-DX', '1 MB Memory', '2-Pass Assembler', 'ALU Flags', 'BIU Queue'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('8086')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span>Explore 8086 Lab</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Module 4: Intel 8255 PPI Interface */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-600 flex items-center justify-center mb-5">
                  <Sliders className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                  Intel 8255 PPI Interface
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Programmable peripheral interfacing: Mode 0/1/BSR configuration, Port A (80H) sensor flags input,
                  and Port B (81H) sorting actuator drive lines (Motor, Gate, LEDs, Buzzer).
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Port A (80H)', 'Port B (81H)', 'Port C (82H)', 'Control Word', 'Mode 0 & BSR'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('8086')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-teal-600 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span>Explore PPI</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Module 5: Virtual Production Line */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[#F59A16] flex items-center justify-center mb-5">
                  <Factory className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-[#F59A16] transition-colors">
                  Virtual Production Line
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Deterministic kinematic conveyor model with photoelectric beam sensors, camera dwell stops,
                  pneumatic diverter sorting into PASS/REJECT lanes, emergency stop, and fault injection.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Conveyor Belt', 'IR Sensors', 'Servo Diverter', 'E-Stop Lock', 'Batch Demo'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('production')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-[#F59A16] hover:bg-[#e0890b] text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
              >
                <span>Open Production Line</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Module 6: Monitoring & Analytics */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-xl hover:border-[#F59A16]/50 transition-all flex flex-col justify-between group">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 flex items-center justify-center mb-5">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                  Monitoring &amp; Analytics
                </h3>
                <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                  Real-time factory telemetry: Total ingested workpieces, yield percentage, scrap rate,
                  Defect Pareto distribution, cycle time metrics, and filterable chronological event history.
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {['Quality Yield %', 'Scrap Rate %', 'Pareto Defect Chart', 'Event Audit', 'Latency Stream'].map((f) => (
                    <span key={f} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
              <button
                onClick={() => onNavigate('monitoring')}
                className="mt-6 w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-purple-600 text-white font-semibold text-xs transition-all shadow-sm cursor-pointer"
              >
                <span>View Monitoring</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. INDUSTRIAL FOOTER                                      */}
      {/* ========================================================= */}
      <footer className="w-full bg-slate-950 text-slate-400 py-12 px-6 border-t border-slate-900">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="relative w-8 h-8 rounded-lg border-2 border-[#F59A16] flex items-center justify-center bg-[#F59A16]/10">
              <div className="w-3.5 h-3.5 rounded-full border border-[#F59A16]" />
            </div>
            <div>
              <span className="font-bold text-white text-sm">VisionGuard 2.0</span>
              <span className="text-[11px] text-slate-500 block">Intelligent Quality Inspection &amp; Sorting System</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 text-center md:text-right">
            Academic DEAM Capstone Engineering Simulation &bull; Digital Electronics, 8086 CPU &amp; OpenCV
          </div>
        </div>
      </footer>
    </div>
  );
};
