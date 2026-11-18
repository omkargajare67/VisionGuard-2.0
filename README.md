# VISIONGUARD 2.0
> **DEAM-Integrated Intelligent Product Quality Inspection and Automated Sorting System**

VisionGuard 2.0 is an academic Digital Electronics and Microprocessors (DEAM) capstone engineering simulation. It pairs real-time OpenCV-based computer vision defect inspection with a deep, pedal-to-the-metal hardware simulation of digital logic gates, combinational and sequential circuits, finite state machines (FSM), an educational Intel 8086 microprocessor, and an Intel 8255 Programmable Peripheral Interface (PPI).

---

## 1. Technology Stack

### Frontend
- **Framework**: React 19 with Vite & TypeScript
- **Styling**: Tailwind CSS v4
- **Animation & Graphics**: Framer Motion
- **Icons**: Lucide React
- **Networking**: Native Fetch API (REST) & WebSockets

### Backend
- **Framework**: Python 3.12+ with FastAPI & Uvicorn
- **Image Processing**: OpenCV (`opencv-python-headless`), NumPy
- **Multipart Uploads**: `python-multipart`
- **Data Validation & Schemas**: Pydantic v2
- **Testing**: Pytest, HTTPX

### Architecture Principles
- **100% Local**: No external APIs, paid cloud services, or external ML models.
- **Explainable Classical Vision**: Segmented thresholding, HSV color filtering, Canny edge detection, CLAHE, and contour solidity.
- **Strictly Modular**: Isolated layers for Vision, DEAM Logic, 8086 Emulation, and Industrial Conveyor Simulation.
- **Educational Transparency**: Real hardware registers, gate states, truth tables, and memory maps exposed in real time.

---

## 2. Project Folder Structure

```
.
├── .gitignore                      # Git exclusion rules for node, venv, caches
├── README.md                       # Main project documentation & setup
├── requirements.txt                # Root-level Python dependencies
├── assets/                         # Static schematics and reference media
├── docs/                           # Architecture and curriculum specifications
│   ├── PROJECT_REQUIREMENTS.md     # Full functional & non-functional requirements
│   ├── SYSTEM_ARCHITECTURE.md      # Detailed system diagrams & module schemas
│   ├── DEAM_MAPPING.md             # Direct mapping of DEAM curriculum Units 1-6
│   └── DEVELOPMENT_ROADMAP.md      # Five-stage development milestones & QA log
├── backend/
│   ├── requirements.txt            # Backend-specific package constraints
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_health.py          # Pytest suite for baseline API endpoints (2 tests)
│   │   ├── test_vision.py          # Automated tests for vision & CV pipeline (17 tests)
│   │   ├── test_deam.py            # Automated tests for digital electronics (22 tests)
│   │   └── test_microprocessor.py  # Automated tests for 8086 CPU & 8255 PPI (21 tests)
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI application root & router registration
│       ├── api/
│       │   ├── __init__.py
│       │   ├── health.py           # GET /api/health implementation (Stage 4)
│       │   ├── samples.py          # GET /api/samples & /api/samples/{id}/image
│       │   ├── inspection.py       # POST /api/inspection/analyze[-sample]
│       │   ├── deam.py             # Logic, Boolean, K-Map, Combinational, Sequential APIs
│       │   └── microprocessor.py   # 8086 CPU, memory, registers, bus, PPI, IVT, timers
│       ├── models/
│       │   ├── __init__.py
│       │   └── schemas.py          # Pydantic schema contracts for Stages 1-4
│       ├── services/
│       │   ├── __init__.py
│       │   ├── deam_service.py     # Stage 3 logic computation service
│       │   └── microprocessor_service.py # Stage 4 session-based 8086 CPU service
│       ├── vision/                 # [Stage 2] OpenCV inspection engine
│       │   ├── __init__.py
│       │   ├── synthetic_samples.py# Procedural industrial workpiece generator
│       │   ├── preprocessing.py    # CLAHE, bilateral, Canny, morphology
│       │   └── defect_detection.py # 6-point classical CV defect detector
│       ├── deam/                   # [Stage 3] Logic gates, FSM, sequential logic
│       │   ├── __init__.py
│       │   ├── logic_gates.py      # AND, OR, NOT, NAND, NOR, XOR, XNOR & De Morgan
│       │   ├── boolean_logic.py    # Expression parser, truth tables, standard laws
│       │   ├── kmap.py             # 2, 3, 4-variable Gray code K-Map minimizer
│       │   ├── combinational.py    # Half/Full Adders, MUX, Decoders, Encoders, Parity
│       │   ├── flipflops.py        # SR, JK, D, T bistable multivibrators
│       │   ├── registers.py        # SISO, SIPO, PISO, PIPO shift registers
│       │   ├── counters.py         # Synchronous Up, Down, Modulo-N counters
│       │   ├── fsm.py              # Moore production FSM (6 states)
│       │   └── inspection_decision.py # Vision flags -> Combinational Boolean Decision
│       ├── microprocessor/         # [Stage 4] 8086 CPU & 8255 PPI simulator
│       │   ├── __init__.py
│       │   ├── registers8086.py    # 16-bit register model with 8-bit aliasing & FLAGS
│       │   ├── memory.py           # 1 MB segmented physical memory & stack
│       │   ├── alu.py              # 16-bit / 8-bit ALU with conditional flag generation
│       │   ├── instruction_set.py  # Educational 8086 instruction set architecture
│       │   ├── assembler.py        # Two-pass assembler with forward-reference resolution
│       │   ├── bus.py              # 20-bit address, 16-bit data & control bus
│       │   ├── ppi8255.py          # Intel 8255 PPI (Mode 0, Mode 1, BSR, VisionGuard I/O)
│       │   ├── interrupts.py       # 256-vector IVT, NMI, INTR, INT n, and IRET
│       │   ├── timers.py           # 8253 PIT with Mode 0 (Terminal Count) & Mode 3
│       │   ├── cpu8086.py          # Integrated CPU unifying BIU, EU, Bus, PPI, Timers
│       │   └── example_programs.py # 5 preloaded assembly demos including VisionGuard
│       ├── production_line/        # [Stage 5] Virtual production line & sorting
│       │   ├── __init__.py
│       │   ├── models.py           # State enums (LineState, ProductStatus, ControllerMode)
│       │   ├── product.py          # Workpiece tracking, positions, and timestamps
│       │   ├── conveyor.py         # Kinematic virtual conveyor with speed & E-STOP lock
│       │   ├── sensors.py          # Photoelectric sensor network (IR-01, 02, 03, EXIT-01)
│       │   ├── actuators.py        # Motor, servo gate (0°/45°), LEDs, buzzer, counters
│       │   ├── inspection_station.py # Camera stop, OpenCV defect detector, DEAM flags
│       │   ├── sorting_station.py  # Pneumatic diverter routing (PASS vs REJECT)
│       │   ├── line_controller.py  # Dual-mode controller (DEAM Logic vs 8086 CPU + PPI)
│       │   ├── production_metrics.py # Yield, scrap, Pareto defect breakdown, throughput
│       │   ├── event_manager.py    # Audit trail and deterministic lifecycle history
│       │   └── simulation_engine.py# Master simulation engine orchestrator
│       └── services/
│           ├── __init__.py
│           ├── deam_service.py     # Stage 3 logic computation service
│           ├── microprocessor_service.py # Stage 4 session-based 8086 CPU service
│           └── production_line_service.py # Stage 5 production line session service
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Vite config with proxy to backend /api
    ├── tsconfig.json
    ├── src/
        ├── main.tsx                # React root mount
        ├── App.tsx                 # Main dashboard container with Tab Navigation
        ├── index.css               # Tailwind CSS entry
        ├── types/
        │   └── index.ts            # TypeScript interfaces (Vision + DEAM + 8086 + Production)
        ├── services/
        │   └── api.ts              # Typed API communication service & productionLineApi
        └── components/
            ├── Navbar.tsx          # Industrial header with Stage 5 indicator & Production Tab
            ├── HealthMonitor.tsx   # Real-time health diagnostic card
            ├── ArchitectureOverview.tsx # 5-stage roadmap & DEAM mapping
            ├── DiagnosticLog.tsx   # Request telemetry & latency stream
            ├── production-line/    # [Stage 5] Virtual Production Line UI
            │   ├── ProductionLineDashboard.tsx # Master container and simulation loop
            │   ├── ConveyorVisualization.tsx   # SVG animated conveyor, sensors, gate
            │   ├── SimulationControls.tsx      # Start, Pause, Step, Speed, E-Stop, Batch
            │   ├── ControllerModeSelector.tsx  # Mode A (DEAM) vs Mode B (8086 + PPI)
            │   ├── InspectionStationPanel.tsx  # OpenCV viewfinder & 6-point flags
            │   ├── SortingStationPanel.tsx     # Pneumatic gate, Port B actuators, counters
            │   ├── ProductionMetricsPanel.tsx  # Yield, Scrap, Defect Pareto chart
            │   ├── EventTimeline.tsx           # Audit log stream and filter
            │   └── FaultInjectionPanel.tsx     # Hardware fault simulation & recovery
            ├── vision/             # [Stage 2] Vision Inspector UI
            │   ├── VisionInspector.tsx    # Master vision workbench (webcam stabilized)
            │   ├── SampleCatalog.tsx      # Synthetic sample cards & selector
            │   ├── InspectionResults.tsx  # High-impact verdict & fault log
            │   ├── DefectMetrics.tsx      # DEAM binary logic flags table
            │   ├── ProcessingPipeline.tsx # Sequential OpenCV filters visualizer
            │   └── ImageComparison.tsx    # Split / side-by-side comparison
            ├── deam/               # [Stage 3] DEAM Digital Electronics Lab
            │   ├── DeamLaboratory.tsx     # Master laboratory portal & navigation
            │   ├── InspectionDecisionBridge.tsx # Vision-to-Logic bridge
            │   ├── LogicGatesLab.tsx      # Interactive 7-gate schematic & tables
            │   ├── BooleanLogicLab.tsx    # Expression evaluator & Boolean laws
            │   ├── KMapVisualizer.tsx     # Gray-code 2/3/4-variable K-Map solver
            │   ├── CombinationalLab.tsx   # Adders, MUX, Decoders, Encoders, Parity
            │   ├── FlipFlopLab.tsx        # SR, JK, D, T clock edge-triggered cells
            │   ├── RegisterCounterLab.tsx # Shift registers & synchronous counters
            │   └── FSMVisualizer.tsx      # Moore state machine trajectory & outputs
            └── microprocessor/     # [Stage 4] 8086 Microprocessor & 8255 PPI Lab
                ├── MicroprocessorLab.tsx  # Master tabbed laboratory container
                ├── RegisterInspector.tsx  # 16-bit registers, 8-bit aliases, 9 flags
                ├── MemoryExplorer.tsx     # 20-bit addressing, hex dump, stack viewer
                ├── AssemblyEditor.tsx     # Source editor, assembler, step/run/reset
                ├── ExecutionTrace.tsx     # Pipeline execution history & cycle audit
                ├── ALUVisualizer.tsx      # Interactive ALU sandbox & condition flags
                ├── BusVisualizer.tsx      # 20-bit address/data bus & BIU prefetch queue
                ├── PPI8255Panel.tsx       # 8255 PPI with live VisionGuard sensor/actuator
                ├── InterruptPanel.tsx     # 256-vector IVT explorer, NMI/INTR, ISR flow
                └── TimerPanel.tsx         # 8253 PIT timer with countdown meter & IRQ0
```

---

## 3. Installation Instructions

### Prerequisites
- **Python**: Version 3.12 or higher
- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher

### 3.1 Backend Installation
```bash
# Navigate to the project root and create a virtual environment
python -m venv backend/.venv

# Activate virtual environment
# Windows (PowerShell):
.\backend\.venv\Scripts\Activate.ps1
# Linux / macOS:
source backend/.venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt
```

### 3.2 Frontend Installation
```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install
```

---

## 4. Startup Instructions

### 4.1 Running the Backend Server
From the project root:
```bash
# Windows (PowerShell):
$env:PYTHONPATH="."
.\backend\.venv\Scripts\uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# Linux / macOS:
PYTHONPATH="." ./backend/.venv/bin/uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Documentation (Swagger): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Health Check Endpoint: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- Microprocessor Status Endpoint: [http://127.0.0.1:8000/api/microprocessor/status](http://127.0.0.1:8000/api/microprocessor/status)

### 4.2 Running the Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Local Application: [http://localhost:5173](http://localhost:5173)

---

## 5. Automated Testing & QA Verification (Stage 5)

Run the backend test suite:
```bash
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python -m pytest backend/tests -v
```

### 5.1 Verification Results
- **79 of 79 automated tests passing** (100% pass rate in ~1.30s) across:
  - `test_production_line.py`: **17 tests** verifying virtual conveyor kinematics, speed control, emergency stop hardware lock, photoelectric sensor trip logic (IR-01, IR-02, IR-03, EXIT-01), product queue collision avoidance, nominal PASS workflow in DEAM mode, nominal PASS workflow in 8086 CPU mode, defective REJECT workflows on all 5 defect benchmarks (VG-002 through VG-006), full 6-sample batch demo execution, Line FSM transitions, fault injection and fail-safe recovery, and REST API session lifecycle endpoints.
  - `test_microprocessor.py`: **21 tests** verifying 16-bit registers, 8-bit byte aliasing bitwise integrity, 20-bit physical memory addressing, little-endian word storage, ALU arithmetic and logic operations, status flag generation (CF, PF, AF, ZF, SF, OF), two-pass assembler with forward references, BIU 6-byte instruction prefetch queue and branch flushes, Intel 8255 PPI Mode 0 and BSR modes, 256-vector IVT interrupt handling with IRET restoration, 8253 PIT countdown and IRQ0 generation, and complete assembly execution of the VisionGuard quality inspection controller for nominal PASS (VG-001) and defective REJECT (VG-004) samples.
  - `test_deam.py`: **22 tests** covering logic gates, De Morgan's duality, Boolean expression evaluation, K-Map (2, 3, and 4 variables with don't cares), Adders, Multiplexers, Decoders, Priority Encoders, Parity generators & error checkers, Flip-Flops, Shift Registers, Synchronous Counters, Moore FSM lifecycle, and Vision-to-Logic decision bridge.
  - `test_vision.py`: **17 tests** verifying procedural synthetic generation, classical CV pipelines, and blind defect identification on all 6 benchmarks (VG-001 through VG-006).
  - `test_health.py`: **2 tests** checking system status and stage telemetry.
- **Frontend Production Build**: `npm run build` succeeds cleanly in <600ms with zero TypeScript errors.

### 5.2 Capstone Integration: Dual-Mode Industrial Sorting Controller
The simulation features dual execution engines for automated product sorting:
1. **Mode A (DEAM Digital Logic)**: Evaluates the combinational Boolean fault equation $F = S + \overline{C} + \overline{L} + \overline{M} + \overline{G}$.
2. **Mode B (Intel 8086 CPU & 8255 PPI)**: Port A (80H) ingests the 6-point optical flags, the 8086 CPU executes the `visionguard_controller` assembly code, and drives Port B (81H) actuator signals:
   - PASS: $05\text{H}$ (PB0 Conveyor Motor + PB2 Green LED + 0° Gate).
   - REJECT: $1A\text{H}$ (PB1 Reject Diverter [45° Gate] + PB3 Red LED + PB4 Buzzer).

---

## 6. Five-Stage Development Roadmap

- **Stage 1 (Completed)**: Foundation & Architecture Setup (FastAPI backend, Vite frontend, health check, baseline verification).
- **Stage 2 (Completed)**: OpenCV Vision Inspection Engine & Synthetic Sample Generator (6-sample benchmark generator, classical CV pipeline, multipart upload, webcam acquisition, annotated overlay, DEAM binary flags).
- **Stage 2.5 (Completed)**: Stabilization & Quality Assurance (Webcam lifecycle fixes, ref-based track cleanup, blind test verification, API validation).
- **Stage 3 (Completed)**: DEAM Digital Electronics Simulation Engine (Interactive Digital Logic Lab, Boolean Algebra, Gray-Code K-Map Minimizer, Adders, Multiplexers, Decoders, Priority Encoders, Parity Gen/Check, Flip-Flops, Shift Registers, Synchronous Counters, Moore FSM, and Vision-to-Logic Hardware Decision Bridge).
- **Stage 4 (Completed)**: Educational Intel 8086 Microprocessor & 8255 PPI Simulator (16-bit register architecture, 8-bit aliasing, 1 MB segmented physical memory, ALU condition flags, two-pass assembler, BIU 6-byte prefetch queue, 8255 PPI Mode 0/1/BSR, 256-vector IVT, 8253 PIT timer, and full React Microprocessor Laboratory).
- **Stage 5 (Completed)**: Virtual Production Line, Conveyor Simulation & End-to-End System Integration (Deterministic conveyor transport, photoelectric sensor network, automated OpenCV inspection station, pneumatic diverter gate, dual-mode DEAM/8086 controller, live analytics, Pareto defect chart, and audit trail).
