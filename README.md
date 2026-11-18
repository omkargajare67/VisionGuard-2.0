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
│   │   ├── test_health.py          # Pytest suite for baseline API endpoints
│   │   └── test_vision.py          # 17 automated tests for vision & CV pipeline
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI application root & CORS
│       ├── api/
│       │   ├── __init__.py
│       │   ├── health.py           # GET /api/health implementation
│       │   ├── samples.py          # GET /api/samples & /api/samples/{id}/image
│       │   └── inspection.py       # POST /api/inspection/analyze[-sample]
│       ├── models/
│       │   ├── __init__.py
│       │   └── schemas.py          # Pydantic schema contracts
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
│       └── simulation/             # [Stage 5] Conveyor kinematics & actuators
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Vite config with proxy to backend /api
    ├── tsconfig.json
    ├── src/
        ├── main.tsx                # React root mount
        ├── App.tsx                 # Main dashboard container with Tab Navigation
        ├── index.css               # Tailwind CSS entry
        ├── types/
        │   └── index.ts            # TypeScript interfaces (Vision + DEAM)
        ├── services/
        │   └── api.ts              # Typed API communication service
        └── components/
            ├── Navbar.tsx          # Industrial header with Stage 3 indicator
            ├── HealthMonitor.tsx   # Real-time health diagnostic card
            ├── ArchitectureOverview.tsx # 5-stage roadmap & DEAM mapping
            ├── DiagnosticLog.tsx   # Request telemetry & latency stream
            ├── vision/             # [Stage 2] Vision Inspector UI
            │   ├── VisionInspector.tsx    # Master vision workbench (webcam stabilized)
            │   ├── SampleCatalog.tsx      # Synthetic sample cards & selector
            │   ├── InspectionResults.tsx  # High-impact verdict & fault log
            │   ├── DefectMetrics.tsx      # DEAM binary logic flags table
            │   ├── ProcessingPipeline.tsx # Sequential OpenCV filters visualizer
            │   └── ImageComparison.tsx    # Split / side-by-side comparison
            └── deam/               # [Stage 3] DEAM Digital Electronics Lab
                ├── DeamLaboratory.tsx     # Master laboratory portal & navigation
                ├── InspectionDecisionBridge.tsx # Novelty Vision-to-Logic bridge
                ├── LogicGatesLab.tsx      # Interactive 7-gate schematic & tables
                ├── BooleanLogicLab.tsx    # Expression evaluator & Boolean laws
                ├── KMapVisualizer.tsx     # Gray-code 2/3/4-variable K-Map solver
                ├── CombinationalLab.tsx   # Adders, MUX, Decoders, Encoders, Parity
                ├── FlipFlopLab.tsx        # SR, JK, D, T clock edge-triggered cells
                ├── RegisterCounterLab.tsx # Shift registers & synchronous counters
                └── FSMVisualizer.tsx      # Moore state machine trajectory & outputs
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
- Sample Catalog Endpoint: [http://127.0.0.1:8000/api/samples](http://127.0.0.1:8000/api/samples)

### 4.2 Running the Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Local Application: [http://localhost:5173](http://localhost:5173)

---

## 5. Automated Testing & QA Verification (Stage 3)

Run the backend test suite:
```bash
$env:PYTHONPATH="."
.\backend\.venv\Scripts\python -m pytest backend/tests -v
```

### 5.1 Verification Results
- **41 of 41 automated tests passing** (100% pass rate in ~0.92s) across:
  - `test_deam.py`: **22 tests** covering logic gates, De Morgan's duality, Boolean expression evaluation, K-Map (2, 3, and 4 variables with don't cares), Half Adder, Full Adder, Multiplexers (2:1, 4:1, 8:1), Decoders (2:4, 3:8), Priority Encoders (4:2, 8:3), Parity generators & error checkers, Flip-Flops (SR, JK, D, T), Shift Registers (SISO, SIPO, PISO, PIPO), Counters (Up, Down, Modulo-N), Moore FSM lifecycle & error handling, and Vision-to-Logic combinational decision bridge.
  - `test_vision.py`: **17 tests** verifying procedural synthetic generation, classical CV pipelines, and blind defect identification on all 6 benchmarks (VG-001 through VG-006).
  - `test_health.py`: **2 tests** checking system status and stage telemetry.
- **Vision-to-Logic Integration**: Verified that OpenCV binary flags $D, S, C, L, M, G$ synthesize hardware signals:
  - $F = S \lor \neg C \lor \neg L \lor \neg M \lor \neg G$
  - $\text{PASS} = D \land \neg F$
  - $\text{REJECT} = D \land F$
  - Complete gate execution trace matching physical propagation delay characteristics (~15 ns).
- **Frontend Production Build**: `npm run build` succeeds cleanly in <500ms with zero TypeScript errors.

### 5.2 Implemented vs. Tested vs. Remaining Limitations

| Category | Status / Details |
|---|---|
| **Implemented Functionality** | **Stage 1**: Foundation & diagnostics. **Stage 2**: OpenCV classical inspection engine. **Stage 3**: Full DEAM Laboratory with 8 interactive modules: Logic Gates, Boolean Algebra & Theorems, Gray-code K-Map Minimizer, Combinational Circuits (Adders, MUX, Decoders, Encoders, Parity), Sequential Flip-Flops (SR, JK, D, T), Shift Registers & Synchronous Counters, Moore Production Line FSM, and Vision-to-Logic Inspection Decision Bridge. |
| **Tested Functionality** | 41 automated Pytest test cases, Gray-code adjacency & Quine-McCluskey correctness, adder truth tables, FSM transition validity & emergency stop, parity bit-flip error detection, and mutual exclusivity of PASS/REJECT sorting signals. |
| **Scope Boundary** | Stage 3 is fully finalized. Stage 4 will interface these digital signals and FSM states with the Intel 8086 CPU and Intel 8255 PPI ports. |

---

## 6. Five-Stage Development Roadmap

- **Stage 1 (Completed)**: Foundation & Architecture Setup (FastAPI backend, Vite frontend, health check, baseline verification).
- **Stage 2 (Completed)**: OpenCV Vision Inspection Engine & Synthetic Sample Generator (6-sample benchmark generator, classical CV pipeline, multipart upload, webcam acquisition, annotated overlay, DEAM binary flags).
- **Stage 2.5 (Completed)**: Stabilization & Quality Assurance (Webcam lifecycle fixes, ref-based track cleanup, blind test verification, API validation).
- **Stage 3 (Completed)**: DEAM Digital Electronics Simulation Engine (Interactive Digital Logic Lab, Boolean Algebra, Gray-Code K-Map Minimizer, Adders, Multiplexers, Decoders, Priority Encoders, Parity Gen/Check, Flip-Flops, Shift Registers, Synchronous Counters, Moore FSM, and Vision-to-Logic Hardware Decision Bridge).
- **Stage 4 (Upcoming)**: Educational 8086 Microprocessor & 8255 PPI Simulator.
- **Stage 5 (Upcoming)**: Full Virtual Production Line & System Integration.
