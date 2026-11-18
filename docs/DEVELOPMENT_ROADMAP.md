# VisionGuard 2.0: Five-Stage Development Roadmap

This roadmap outlines the systematic 5-stage implementation strategy for VisionGuard 2.0.

---

## Stage 1: Foundation & Architecture Setup (Current Stage)
- [x] Environment inspection (Python 3.12, Node.js 26, npm 11).
- [x] Directory structure setup (`frontend/`, `backend/`, `docs/`, `assets/`).
- [x] React + Vite + TypeScript frontend initialization with Tailwind CSS, Lucide React, and Framer Motion.
- [x] FastAPI backend scaffolding with CORS, routing, and Pydantic schemas.
- [x] Working `/api/health` endpoint returning `{ "status": "running", "project": "VisionGuard 2.0", "stage": 1 }`.
- [x] Frontend-backend live connectivity integration and visual diagnostic component.
- [x] Comprehensive documentation (`PROJECT_REQUIREMENTS.md`, `SYSTEM_ARCHITECTURE.md`, `DEAM_MAPPING.md`, `DEVELOPMENT_ROADMAP.md`).
- [x] Root `README.md` and `.gitignore`.

---

## Stage 2: OpenCV Vision Inspection & Synthetic Sample Generation
- [ ] Synthetic sample image generator:
  - Generate pristine nominal industrial workpieces (cylinders, PCBs, machined parts).
  - Inject controlled defects: surface scratches, structural cracks, contour deviations, drilling offsets, missing components.
- [ ] Vision processing pipeline (`backend/app/vision/`):
  - Preprocessing module: Grayscale, Gaussian blur, bilateral filtering, CLAHE.
  - Defect detection module: Canny edge gradient analysis, contour analysis, dimensional variance checks.
  - Multi-input ingestion: Synthetic catalog, local file upload, and real-time webcam feed.
- [ ] REST API endpoints for inspection triggering and parameter tuning (`/api/inspection`, `/api/samples`).
- [ ] Interactive frontend vision inspector component with annotated defect bounding boxes and metric overlays.

---

## Stage 3: DEAM Digital Electronics Simulation Engine
- [ ] Unit 1: Logic Gates & Boolean Algebra:
  - Truth table generators for standard and universal gates.
  - Automated Karnaugh Map (K-Map) 2/3/4-variable minimization engine.
- [ ] Unit 2: Combinational Logic Circuits:
  - Half Adder and Ripple Carry Full Adder simulation.
  - Multiplexers (2:1, 4:1, 8:1) and Decoders (2:4, 3:8).
  - Priority Encoders and Parity Generators/Checkers.
- [ ] Unit 3: Sequential Circuits & State Machines:
  - SR, JK, D, and T flip-flop simulation with clock signal propagation.
  - Shift registers (SISO, SIPO, PISO, PIPO) and synchronous up/down counters.
  - Finite State Machine (FSM) engine modeling the production line controller.
- [ ] Interactive circuit diagram visualizer and logic timing waveform viewer in React.

---

## Stage 4: Educational 8086 Microprocessor & 8255 PPI Simulator
- [ ] Educational Intel 8086 Microprocessor Core (`backend/app/microprocessor/`):
  - 16-bit register file (AX, BX, CX, DX, SI, DI, BP, SP, CS, DS, SS, ES, IP, Flags).
  - 1 MB Segmented Memory Model with logical-to-physical address calculation.
  - Educational instruction subset decoder (MOV, ADD, SUB, CMP, JMP, JZ, JNZ, IN, OUT, PUSH, POP, CALL, RET).
  - Bus Interface Unit (BIU) instruction prefetch queue and Execution Unit (EU) visualization.
- [ ] Intel 8255 Programmable Peripheral Interface (PPI):
  - Port A, Port B, and Port C input/output behavior under Mode 0 and Mode 1.
  - Control Word register configuration and Bit Set/Reset (BSR) mode.
- [ ] Hardware Interrupt & Timer Subsystem:
  - Interrupt Vector Table (IVT), INTR line, NMI, and Interrupt Service Routine (ISR) execution.
  - Programmable interval timer generating periodic clock interrupts.
- [ ] Frontend 8086 IDE: Assembly code editor, step-by-step execution, register inspector, and memory dump grid.

---

## Stage 5: Full Virtual Production Line & System Integration
- [ ] Physics-informed production line simulation engine (`backend/app/simulation/`):
  - Discrete-time conveyor kinematic model.
  - Infrared beam sensor triggering and debounce logic.
  - Servo gate deflection mechanics and pneumatic sorting bin physics.
  - Status LEDs and audible buzzer state machine.
- [ ] Real-time bi-directional WebSocket hub streaming continuous conveyor states.
- [ ] Full end-to-end automated cycle:
  - Conveyor runs -> IR sensor trips -> Conveyor stops -> Camera captures image -> OpenCV inspects -> Digital logic validates -> 8086 ISR runs -> 8255 outputs actuation -> Servo diverts or passes unit -> Counters increment -> Conveyor restarts.
- [ ] High-fidelity animated virtual factory floor in React using Framer Motion and canvas/SVG rendering.
- [ ] Inspection logs, statistics charts, and local SQLite/CSV export capabilities.
