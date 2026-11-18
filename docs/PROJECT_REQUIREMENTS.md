# VisionGuard 2.0: Project Requirements Document

## 1. Project Overview
**Project Name**: VISIONGUARD 2.0  
**Project Title**: DEAM-Integrated Intelligent Product Quality Inspection and Automated Sorting System  
**Nature**: Academic Capstone / Course Project for Digital Electronics and Microprocessors (DEAM)  
**Deployment**: Fully local, cross-platform standalone web application  

## 2. Core Objectives
VisionGuard 2.0 simulates an industrial automated optical inspection (AOI) and pneumatic/servo sorting production line. The core novelty lies in integrating real computer vision defect detection directly with rigorous pedagogical simulations of:
1. Fundamental digital logic gates and Boolean algebraic simplification (K-Maps).
2. Combinational logic modules (adders, multiplexers, decoders, encoders, parity units).
3. Sequential elements (flip-flops, registers, counters, Mealy/Moore FSMs).
4. Educational Intel 8086 microprocessor architecture (registers, memory segments, ALU, bus interface unit, execution unit).
5. Programmable peripheral interfacing (Intel 8255 PPI).
6. Hardware interrupt controllers, timers, and Interrupt Service Routines (ISRs).
7. Physics/state-driven industrial conveyor and servo deflection gate simulator.

## 3. Functional Requirements

### 3.1 Industrial Production Flow Simulation
- **Product Arrival & Sensing**: Simulated conveyor delivers products to an optical inspection zone. An active low/high Infrared (IR) beam sensor detects package arrival.
- **Conveyor Interlocking**: IR trigger asserts a hardware signal to halt the conveyor motor driver.
- **Image Acquisition**: Optical camera captures an image of the stationary unit. Supports:
  1. Synthetic pre-generated benchmark samples (nominal and intentional defects).
  2. Local file upload (JPEG/PNG/BMP).
  3. Live web camera frame capture.
- **OpenCV Vision Inspection**:
  - Image preprocessing: Grayscale conversion, Gaussian blur, histogram equalization, morphological filtering.
  - Defect detection: Surface scratch detection via edge gradients (Canny/Sobel), dimensional tolerance check via contour bounding boxes, color/texture anomaly detection via thresholding.
  - Generates binary classification metrics: `PASS` (nominal) or `REJECT` (defective).
- **Digital Logic Interfacing**:
  - Vision detection flags feed into simulated combinational/sequential logic blocks.
  - Generates intermediate control words and validation parity.
- **8086 Microprocessor & 8255 PPI Processing**:
  - Optical trigger causes an 8255 PPI Port A/Port C status update or hardware interrupt (INTR).
  - 8086 reads inspection registers, updates internal defect counters, evaluates decision thresholds, and outputs actuation signals to 8255 Port B.
- **Actuation & Sorting**:
  - Actuation logic drives a servo-driven sorting gate (deflector arm) to divert defective items to a rejection bin or allow nominal items to proceed to packaging.
  - Drives visual status LEDs (Green = PASS, Red = REJECT, Amber = BUSY) and buzzer alarms.
- **Accounting & Reset**:
  - Synchronous digital counters track total inspected, passed, and rejected units.
  - Timers automatically clear sensor latches and resume conveyor operation for the subsequent workpiece.

### 3.2 Academic DEAM Concept Integration
- **Zero Black-Box Guarantees**: Every digital logic gate, flip-flop transition, register shift, 8086 ALU operation, and bus transaction must expose internal state, truth tables, timing waveforms, and register values in real time.
- **Interactive Educational Mode**: Users can inspect gate-level propagation delays, step through 8086 assembly instructions line-by-line, and alter logic parameters.

## 4. Non-Functional Requirements
- **Local Operation**: 100% self-contained; no paid cloud APIs, third-party authentication services, or external ML inference dependencies.
- **Responsiveness**: Real-time interactive UI updates via WebSockets and REST endpoints.
- **Portability**: Windows, macOS, and Linux compatibility using standard Python 3.12+ and Node.js.
- **Code Quality**: Modular architecture, type-annotated Python (Pydantic / FastAPI), strict TypeScript, and clear separation of concerns.

## 5. Phased Delivery Model
- **Stage 1**: Foundation & Architecture Baseline (Environment, directory skeleton, Vite+React+TS frontend, FastAPI backend, health check, baseline documentation).
- **Stage 2**: OpenCV Vision Inspection Engine & Synthetic Sample Generator.
- **Stage 3**: DEAM Digital Electronics Simulation (Gates, Combinational Logic, Flip-Flops, Registers, Counters, FSM).
- **Stage 4**: Educational 8086 Microprocessor & 8255 PPI Simulation Engine.
- **Stage 5**: Unified Real-Time Industrial Production Line Simulator & Full Integration Dashboard.
