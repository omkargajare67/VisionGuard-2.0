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

## Stage 3: DEAM Digital Electronics Simulation Engine (Completed & Verified)
- [x] Unit 1: Logic Gates & Boolean Algebra:
  - Truth table generators for all 7 standard and universal gates (AND, OR, NOT, NAND, NOR, XOR, XNOR).
  - De Morgan's laws verification and dual circuit representations.
  - Custom Boolean expression parser, evaluator, and truth table minterm/maxterm canonical expansions.
  - Automated Karnaugh Map (K-Map) 2/3/4-variable minimization engine with Gray-code ordering and Quine-McCluskey prime implicants.
- [x] Unit 2: Combinational Logic Circuits:
  - Half Adder and Full Adder simulation with intermediate signal traces.
  - Multiplexers (2:1, 4:1, 8:1) with dynamic data and select bus routing.
  - Decoders (2:4, 3:8) with active-high enable lines and line assertion.
  - Priority Encoders (4:2, 8:3) with highest active index arbitration and valid bit.
  - Parity generator and receiver checker with single-bit noise injection error testing.
- [x] Unit 3: Sequential Circuits & State Machines:
  - SR, JK, D, and T flip-flop simulation with clock pulse latching, async PRESET/CLEAR, and prohibited state alerts.
  - Shift registers (SISO, SIPO, PISO, PIPO) supporting Shift Right, Shift Left, Parallel Load, and Clear.
  - Synchronous Up, Down, and Modulo-N Counters with terminal count and overflow flags.
  - Moore Finite State Machine (FSM) engine modeling the automated production line (`IDLE`, `DETECT`, `CAPTURE`, `DECIDE`, `SORT`, `RESET`).
- [x] Novelty Vision-to-Logic Inspection Decision Bridge:
  - Hardware synthesis of OpenCV feature extraction binary flags ($D, S, C, L, M, G$).
  - Evaluates $F = S \lor \neg C \lor \neg L \lor \neg M \lor \neg G$, $\text{PASS} = D \land \neg F$, $\text{REJECT} = D \land F$.
  - Step-by-step gate execution trace (inverters, OR-5, AND gates).
  - One-click import from live OpenCV inspection and synthetic sample benchmarks.
- [x] Comprehensive React frontend laboratory with 8 dedicated sub-labs (`DeamLaboratory.tsx`).
- [x] Full Pytest suite of 22 new tests (`backend/tests/test_deam.py`), 41/41 passing across all modules.

---

## Stage 4: Educational 8086 Microprocessor & 8255 PPI Simulator (Completed & Verified)
- [x] Educational Intel 8086 Microprocessor Core (`backend/app/microprocessor/`):
  - 16-bit register file (AX, BX, CX, DX, SP, BP, SI, DI, CS, DS, SS, ES, IP) with 8-bit byte aliasing (AH/AL, BH/BL, CH/CL, DH/DL) and bitwise synchronization.
  - 9-flag condition register (CF, PF, AF, ZF, SF, TF, IF, DF, OF) computed on every ALU operation.
  - 1 MB Segmented Memory Model (`backend/app/microprocessor/memory.py`): 20-bit physical address computation (`(Segment << 4) + Offset`), little-endian word read/write, hex/ASCII dump, and stack frame view at `SS:SP`.
  - 16-bit/8-bit ALU core (`backend/app/microprocessor/alu.py`): Arithmetic (ADD, SUB, INC, DEC, CMP) and bitwise logical (AND, OR, XOR, NOT, TEST) operations with binary arithmetic traces.
  - Two-pass 8086 Assembler (`backend/app/microprocessor/assembler.py`): Pass 1 address calculation with exact instruction sizing, Pass 2 symbol table resolution, label resolution for forward/backward jumps, and line-numbered syntax diagnostics.
  - Bus Interface Unit (BIU) & Execution Unit (EU) (`backend/app/microprocessor/cpu8086.py`): Pipelined 6-byte instruction prefetch FIFO queue, automatic queue refill during execution, and queue flush on branching (JMP, JZ, JNZ, JC, JNC, LOOP, CALL, RET, IRET).
  - Bus system (`backend/app/microprocessor/bus.py`): 20-bit address bus, 16-bit data bus, and control lines (ALE, MEMR, MEMW, IOR, IOW, DEN, DT_R, INTR, NMI) with transaction history audit.
- [x] Intel 8255 Programmable Peripheral Interface (`backend/app/microprocessor/ppi8255.py`):
  - Full Mode 0 (Basic I/O), Mode 1 (Strobed I/O with STB, IBF, OBF, ACK), and Bit Set/Reset (BSR) mode.
  - Default industrial I/O port mapping: Port A (80H), Port B (81H), Port C (82H), Control Word (83H).
  - VisionGuard Integration: Direct mapping of OpenCV feature extraction flags ($D, S, C, L, M, G$) into Port A (80H) and sorting actuator lines on Port B (81H): PB0 (Conveyor), PB1 (Reject Gate), PB2 (Green LED / PASS), PB3 (Red LED / REJECT), PB4 (Buzzer), PB5 (Busy).
- [x] Hardware Interrupt & Timer Subsystem:
  - 256-vector Interrupt Vector Table (IVT) spanning 1 KB (`00000H` - `003FFH`).
  - Edge-triggered Non-Maskable Interrupt (NMI, Vector Type 2).
  - Level-triggered Maskable Interrupt (INTR, Vector Type 8) gated by Interrupt Flag (`IF`).
  - Software Interrupt (`INT n`) and atomic `IRET` stack frame restoration (POP IP, POP CS, POP FLAGS).
  - Intel 8253 Programmable Interval Timer (`backend/app/microprocessor/timers.py`): Mode 0 (Interrupt on Terminal Count raising IRQ0) and Mode 3 (Square Wave Generator).
- [x] Preloaded Educational Assembly Programs (`backend/app/microprocessor/example_programs.py`):
  - VisionGuard Quality Inspection Controller (`visionguard_controller`).
  - ALU Comprehensive Math & Logic Suite (`alu_suite`).
  - Array Summation with LOOP Instruction (`array_sum_loop`).
  - Stack Operations & Subroutine CALL/RET (`stack_subroutine`).
  - Hardware Interrupt Service Routine Demo (`interrupt_isr`).
- [x] Multi-session REST API (`backend/app/api/microprocessor.py`) with 17 operational endpoints.
- [x] Full Pytest suite of 21 tests (`backend/tests/test_microprocessor.py`), **62/62 passing across all suites in 1.00s**.
- [x] React Microprocessor Laboratory frontend (`frontend/src/components/microprocessor/`):
  - Master container `MicroprocessorLab.tsx` with 8 specialized sub-panels.
  - `RegisterInspector.tsx`: 16-bit registers, 8-bit byte slices, segment pointers, and 9 condition flags.
  - `MemoryExplorer.tsx`: 20-bit address calculator, segment presets, 16-byte hex dump table with ASCII, stack viewer at `SS:SP`, and direct byte write form.
  - `AssemblyEditor.tsx`: Assembly source editor, preloaded example programs, Assemble & Load, Single Step (F7), Run Program (F5), Reset CPU, and bytecode disassembly view with current IP highlighting.
  - `ExecutionTrace.tsx`: Execution history audit with step index, CS:IP, mnemonic, bytecode, details, and cycles.
  - `ALUVisualizer.tsx`: Interactive 16-bit/8-bit ALU sandbox with condition flag generator.
  - `BusVisualizer.tsx`: 20-bit address bus, 16-bit data bus, 9 control lines, BIU 6-byte prefetch queue with byte slots, and transaction log.
  - `PPI8255Panel.tsx`: Interactive 8255 PPI chip with Port A sensor inputs, "Import Live OpenCV Flags" button, and animated Port B actuator status.
  - `InterruptPanel.tsx`: 256-vector IVT explorer, NMI/INTR triggers, software INT n, and ISR stack preservation guide.
  - `TimerPanel.tsx`: 8253 PIT countdown meter, OUT pin level, and IRQ0 trigger.
- [x] Navigation update: Navbar `'8086'` tab added with Stage 4 indicator; default routed to MicroprocessorLab.
- [x] Frontend production build: `npm run build` succeeds cleanly in <500ms with zero errors.

---

## Stage 5: Full Virtual Production Line & System Integration (Completed & Verified)
- [x] Deterministic virtual production line simulation engine (`backend/app/production_line/`):
  - Discrete tick-based kinematic conveyor model with speed control (0.5x to 10x), continuous run, pause/resume, and hardware emergency stop lock (`VirtualConveyor`).
  - Photoelectric sensor network (`VirtualSensor`, `SensorNetwork`) with position detection fields: IR-01 (Arrival, 10%), IR-02 (Inspection Stop, 30%), IR-03 (Sorting Arrival, 70%), and EXIT-01 (Exit Counter, 90%).
  - Actuator subsystem (`ActuatorSubsystem`): Conveyor motor, pneumatic diverter gate (0° IDLE vs 45° DIVERT), Green LED (PASS), Red LED (REJECT), acoustic alarm buzzer, and pass/reject lane counters.
  - Inspection station (`InspectionStation`): Executes actual OpenCV `DefectDetector().analyze(...)` and maps feature results to standard DEAM signals ($D, S, C, L, M, G$).
  - Sorting station (`SortingStation`): Diverts defective units into reject chute (45°) and allows nominal units to continue along the pass lane (0°).
  - Dual-mode controller (`LineController`):
    - Mode A: Combinational Boolean logic fault evaluation ($F = S + \overline{C} + \overline{L} + \overline{M} + \overline{G}$).
    - Mode B: Microprocessor execution via Intel 8086 CPU & 8255 PPI I/O port simulation (`visionguard_controller`).
  - Production metrics & analytics (`ProductionMetrics`): Running tallies of total ingested, inspected, passed, rejected, yield rate, scrap rate, cycle times, and Defect Pareto distribution.
  - Event audit manager (`EventManager`): Chronological, filterable audit trail for complete traceability.
- [x] REST API endpoints (`backend/app/api/production_line.py`):
  - 18 endpoints covering status, session management, start/stop/pause/resume, speed, ticks, single product addition, 6-sample batch demo, sensors, actuators, metrics, events, and fault injection.
- [x] Full Pytest suite of 17 tests (`backend/tests/test_production_line.py`), **79/79 passing across all suites in 1.30s**.
- [x] React Virtual Production Line Dashboard (`frontend/src/components/production-line/`):
  - Master dashboard container `ProductionLineDashboard.tsx` with simulation interval loop and session sync.
  - `ConveyorVisualization.tsx`: High-fidelity SVG animated schematic with belt rollers, texture, dynamic product tokens at real positions, active sensor beam lines, and diverter arm.
  - `SimulationControls.tsx`: Start, Pause, Resume, Stop, Single Step (F7), Reset, Speed presets, Sample Injection dropdown, 6-Sample Batch Demo button, and industrial Emergency Stop button.
  - `ControllerModeSelector.tsx`: Interactive toggle between Mode A (DEAM Logic) and Mode B (8086 CPU + 8255 PPI) with architecture equations and instruction traces.
  - `InspectionStationPanel.tsx`: Camera viewfinder with crosshairs, sample thumbnail, processing duration, and 6 binary DEAM flag indicator chips.
  - `SortingStationPanel.tsx`: Diverter servo angle, Pass/Reject lane counters and percentages, actuator indicators, and 8255 PPI Port B (81H) byte/binary display.
  - `ProductionMetricsPanel.tsx`: KPI cards (Ingested, Inspected, Yield, Scrap) and interactive Defect Category Pareto distribution bars.
  - `EventTimeline.tsx`: Scrollable, filterable event history stream with timestamps and tick counts.
  - `FaultInjectionPanel.tsx`: Industrial fault injection (Conveyor Jam, Sensor Blinding, Gate Pneumatic Loss) and recovery testing.
- [x] Navigation update: Navbar `'production'` tab added with Stage 5 badge; default routed to ProductionLineDashboard.
- [x] Frontend production build: `npm run build` succeeds cleanly in <600ms with zero errors.

---

## Final Stabilisation & Quality Assurance (Completed & Verified)

### Implemented Enhancements & Bug Fixes
- [x] **Frontend/Backend State Contract Normalization**:
  - Implemented `running`, `is_running`, `paused`, and `is_paused` property duality on `VirtualConveyor`.
  - Exported both hardware IDs (`IR-01`, `IR-02`, `IR-03`, `EXIT-01`) and readable identifiers (`ir_sensor_1`, etc.) from `SensorNetwork`.
  - Harmonized top-level API payload with `line_state`, `controller_mode`, `fault_state`, and `simulation_tick`.
  - Normalized REST API routing to preserve `/api/production-line/status` alongside flat alias routes (`/state`, `/control/*`, `/products/*`, `/simulation/tick`).
- [x] **Simulation Loop & Conveyor Kinematics Decoupling**:
  - Decoupled frontend tick loop condition from strict string match with `LineState.CONVEYOR_MOVEMENT`.
  - Simulation loop reliably progresses dwell ticks during active optical alignment without stalling.
- [x] **Photoelectric Sensor Edge Detection**:
  - Eliminated premature `clear()` resets on each tick.
  - Implemented true digital hysteresis: `rising_edge` and `falling_edge` detection to prevent duplicate event spamming when a workpiece remains in a detection zone.
- [x] **Elimination of Silent Inspection Fallback**:
  - Removed silent `VG-001` substitution fallback on inspection station errors.
  - Strict validation of synthetic sample IDs and multipart payloads; sets `product.status = ProductStatus.ERROR` and transitions line controller to `LineState.ERROR` on corrupt payloads or unhandled exceptions.
- [x] **Multi-Session Isolation**:
  - Frontend generates cryptographically random session IDs stored in `sessionStorage`.
  - Mode B creates dedicated, isolated microprocessor CPU sessions `prod_ctrl_{session_id}` in `MicroprocessorService`.
- [x] **Intel 8086 & 8255 PPI Sorting Integrity (Mode B)**:
  - Configured 8255 PPI with Control Word `0x90` (Port A in, Port B out).
  - Synchronized Port A ($80\text{H}$) optical flags and latched Port B ($81\text{H}$) actuator signals ($05\text{H}$ for PASS, $1A\text{H}$ for REJECT).
  - Strictly raises error when CPU fails to halt or execute, preventing silent fallback to Mode A.
- [x] **Product Lifecycle & Diverter Guards**:
  - Prohibited product routing at sorting station without verified inspection status.
  - Enforced single-routing latch (`has_been_routed`) preventing duplicate counter increments.
  - Implemented trailing product spacing ($10.0$ units) and queue collision avoidance.
- [x] **Emergency Stop Hardware Interlocks**:
  - Conveyor motor explicitly checks `emergency_stopped` to prevent restart until an operator reset.
  - Blocked workpiece addition during emergency stop.

### Testing & Verification Results
- **Automated Backend Test Suite**: **95 of 95 tests passing (100%)** across 6 test suites in 1.61s.
- **Dedicated Final Integration Test Suite**: 16 new comprehensive tests (`backend/tests/test_final_integration.py`).
- **Frontend Production Build**: Clean `npm run build` in 579ms with zero errors.
- **Detailed Verification Report**: See [docs/FINAL_QA_REPORT.md](file:///d:/DEAM%20CP/docs/FINAL_QA_REPORT.md).
