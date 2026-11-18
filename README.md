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
- **Data Validation & Schemas**: Pydantic v2
- **Testing**: Pytest, HTTPX

### Architecture Principles
- **100% Local**: No external APIs, paid cloud services, or external models.
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
│   └── DEVELOPMENT_ROADMAP.md      # Five-stage development milestones
├── backend/
│   ├── requirements.txt            # Backend-specific package constraints
│   ├── tests/
│   │   ├── __init__.py
│   │   └── test_health.py          # Pytest suite for API endpoints
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI application root & CORS
│       ├── api/
│       │   ├── __init__.py
│       │   └── health.py           # GET /api/health implementation
│       ├── models/
│       │   ├── __init__.py
│       │   └── schemas.py          # Pydantic schema contracts
│       ├── services/               # Service orchestration layer
│       │   └── __init__.py
│       ├── vision/                 # [Stage 2] OpenCV inspection engine
│       ├── deam/                   # [Stage 3] Logic gates, FSM, sequential logic
│       ├── microprocessor/         # [Stage 4] 8086 CPU & 8255 PPI simulator
│       └── simulation/             # [Stage 5] Conveyor kinematics & actuators
└── frontend/
    ├── package.json
    ├── vite.config.ts              # Vite config with proxy to backend /api
    ├── tsconfig.json
    ├── src/
    │   ├── main.tsx                # React root mount
    │   ├── App.tsx                 # Main dashboard container
    │   ├── index.css               # Tailwind CSS entry
    │   ├── types/
    │   │   └── index.ts            # TypeScript interfaces
    │   ├── services/
    │   │   └── api.ts              # Typed API communication service
    │   └── components/
    │       ├── Navbar.tsx          # Industrial header with live status
    │       ├── HealthMonitor.tsx   # Real-time health diagnostic card
    │       ├── ArchitectureOverview.tsx # 5-stage roadmap & DEAM mapping
    │       └── DiagnosticLog.tsx   # Request telemetry & latency stream
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

### 4.2 Running the Frontend Development Server
In a separate terminal:
```bash
cd frontend
npm run dev
```
- Web Application: [http://localhost:5173](http://localhost:5173)

---

## 5. Health Check Endpoint Verification

Request:
```http
GET http://127.0.0.1:8000/api/health
```

Response:
```json
{
    "status": "running",
    "project": "VisionGuard 2.0",
    "stage": 1
}
```

To run the backend automated test suite:
```bash
$env:PYTHONPATH="."
.\backend\.venv\Scripts\pytest backend/tests
```

---

## 6. Five-Stage Development Roadmap

- **Stage 1 (Current)**: Foundation & Architecture Setup (FastAPI backend, Vite frontend, health check, baseline verification).
- **Stage 2**: OpenCV Vision Inspection Engine & Synthetic Sample Generator.
- **Stage 3**: DEAM Digital Electronics Simulation Engine (Gates, Combinational, Flip-Flops, Registers, Counters, FSM).
- **Stage 4**: Educational 8086 Microprocessor & 8255 PPI Simulator.
- **Stage 5**: Full Virtual Production Line & System Integration.
