# VisionGuard 2.0: Development Roadmap & Quality Assurance

This roadmap outlines the systematic phased delivery and verification milestones for VisionGuard 2.0.

---

## Stage 1: Foundation & Architecture Setup (Completed & Verified)
- [x] Environment inspection (Python 3.12, Node.js 26, npm 11).
- [x] Directory structure setup (`frontend/`, `backend/`, `docs/`, `assets/`).
- [x] React + Vite + TypeScript frontend initialization with Tailwind CSS, Lucide React, and Framer Motion.
- [x] FastAPI backend scaffolding with CORS, routing, and Pydantic schemas.
- [x] Working `/api/health` endpoint returning `{ "status": "running", "project": "VisionGuard 2.0", "stage": 1 }`.
- [x] Frontend-backend live connectivity integration and visual diagnostic component.
- [x] Baseline documentation (`PROJECT_REQUIREMENTS.md`, `SYSTEM_ARCHITECTURE.md`, `DEAM_MAPPING.md`, `DEVELOPMENT_ROADMAP.md`).
- [x] Root `README.md` and `.gitignore`.

---

## Stage 2: OpenCV Vision Inspection & Synthetic Generation (Completed & Verified)
- [x] Standardized industrial electronic control module model (640x480 resolution, dark slate casing, neutral light background).
- [x] Synthetic sample generator (`backend/app/vision/synthetic_samples.py`):
  - `VG-001`: Nominal product (All features conforming -> PASS).
  - `VG-002`: Missing identification label (Label absent -> REJECT).
  - `VG-003`: Non-conforming marking colour (Red/Orange instead of Blue -> REJECT).
  - `VG-004`: Missing component C2 (Silkscreen footprint only -> REJECT).
  - `VG-005`: Structural contour deviation (Corner notch with reduced rectangularity & vertices != 4 -> REJECT).
  - `VG-006`: Surface abrasive scratch defect (Dark linear defect exceeding threshold -> REJECT).
- [x] OpenCV classical preprocessing pipeline (`backend/app/vision/preprocessing.py`):
  - Image validation, resizing, grayscale conversion.
  - Gaussian blur, bilateral filtering, CLAHE adaptive histogram equalization.
  - Morphological gradient, black-hat transform, and Canny edge detection.
- [x] Defect detection engine (`backend/app/vision/defect_detection.py`):
  - Product presence & centering check via binary inverse thresholding and contour analysis.
  - Identification label detection via ROI luminance intensity extraction.
  - Marking colour verification in HSV color space (`H: [95, 135]`).
  - Individual terminal component presence analysis via brightness & edge density.
  - Outline & geometry verification via solidity, rectangularity, aspect ratio, and polygon approximation.
  - Surface scratch detection with automated feature exclusion masks (contour erosion).
  - Output binary flags: `product_detected`, `label_present`, `marking_correct`, `components_complete`, `geometry_ok`, `surface_defect_detected`.
- [x] REST API endpoints (`backend/app/api/`):
  - `GET /api/samples`: Synthetic sample catalog metadata.
  - `GET /api/samples/{sample_id}/image`: Raw benchmark JPEG image rendering.
  - `POST /api/inspection/analyze-sample`: Synthetic benchmark inspection.
  - `POST /api/inspection/analyze`: Multipart image upload (local file or webcam frame).
  - `GET /api/inspection/config`: Inspection thresholds & ROI geometries.
- [x] Frontend Vision Inspector (`frontend/src/components/vision/`):
  - Navigation between System Monitor (Stage 1) and Vision Inspector (Stage 2).
  - Interactive Sample Catalog with thumbnails and defect badges.
  - Multi-source ingestion: Synthetic benchmark, Local file upload, Live webcam capture.
  - Interactive OpenCV Preprocessing Pipeline viewer (Original, Grayscale, CLAHE, Edge, Annotated).
  - Split / Side-by-side comparison slider.
  - Telemetry table of DEAM digital binary flags and measured engineering metrics.

---

## Stage 2.5: Stabilization & Quality Assurance (Completed & Verified)

### Implemented Functionality
- **Webcam Lifecycle Stabilization**:
  - `streamRef` ref architecture ensuring zero track leakage across React state updates.
  - Fixed race condition where `videoRef.current` was accessed before component mounting by utilizing a callback ref (`setVideoRef`) and a synchronized mount effect.
  - Automatic stream termination on input mode transitions (switching away from webcam).
  - Automatic stream termination on component unmount (`track.stop()`).
  - Human-friendly camera permission error handling (`NotAllowedError`, `NotFoundError`, `NotReadableError`, `OverconstrainedError`).
  - Video stream indicator and explicit "Cancel" camera stream controls.
- **Robust API Error Handling**:
  - Validated multipart endpoints for empty payloads, unsupported MIME types, and malformed image bytes.
  - Handled 404 responses for nonexistent synthetic sample identifiers.

### Tested Functionality (19/19 Automated Tests Passing)
- **Six Benchmark Samples (Pixel-Level Blind Test)**:
  - `VG-001`: PASS (Flags: `1, 1, 1, 1, 1, 0`)
  - `VG-002`: REJECT (`label_present = 0`)
  - `VG-003`: REJECT (`marking_correct = 0`)
  - `VG-004`: REJECT (`components_complete = 0`)
  - `VG-005`: REJECT (`geometry_ok = 0`)
  - `VG-006`: REJECT (`surface_defect_detected = 1`)
- **Blind Inspection Independence**:
  - Verified that inspection algorithms operate purely on raw image matrix pixels without relying on sample names or IDs.
- **API Endpoints Tested**:
  - `GET /api/health` -> 200 OK
  - `GET /api/samples` -> 200 OK (returns all 6 registered samples)
  - `GET /api/samples/{id}/image` -> 200 OK (valid) & 404 (invalid)
  - `GET /api/inspection/config` -> 200 OK (thresholds & ROIs)
  - `POST /api/inspection/analyze-sample` -> 200 OK (valid) & 404 (invalid)
  - `POST /api/inspection/analyze` -> 200 OK (multipart upload), 400 (empty file), 400 (unsupported mime), 400 (corrupt bytes).
- **Frontend Production Build**:
  - `npm run build` succeeds cleanly with 0 TypeScript errors or warnings.

### Remaining Limitations
- **Webcam Constraints**: High-accuracy edge inspection depends on workpiece orientation matching nominal bounds and illumination avoiding heavy shadows or glare.
- **Fixed Model Profile**: Stage 2 algorithms are calibrated for the standard electronic control module. Stage 3 will generalize rule-based decision trees via DEAM Boolean expressions.

---

## Stage 3: DEAM Digital Electronics Simulation Engine (Upcoming)
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

## Stage 4: Educational 8086 Microprocessor & 8255 PPI Simulator (Upcoming)
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

## Stage 5: Full Virtual Production Line & System Integration (Upcoming)
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
