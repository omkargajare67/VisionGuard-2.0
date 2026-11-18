# Stage 5: Virtual Production Line & Automated Sorting Simulation Engine

## 1. Overview & Architecture

Stage 5 represents the final end-to-end integration milestone for **VisionGuard 2.0: DEAM-Integrated Intelligent Product Quality Inspection and Automated Sorting System**.

The simulation unifies all previously constructed components into a real-time, deterministic virtual factory production line:
1. **Physical Conveyor Transport Simulation**: Kinematic position tracking, collision-free intake spacing, continuous run, pause/resume, and emergency stop interlocks.
2. **Photoelectric Sensor Network**: Detection fields for Arrival (IR-01 at 10%), Inspection Stop (IR-02 at 30%), Sorting Arrival (IR-03 at 70%), and Exit (EXIT-01 at 90%).
3. **Automated Inspection Station (Position 30.0%)**: Automatic conveyor halting, live acquisition of the unit frame, execution of OpenCV 6-point defect detection (`DefectDetector`), extraction of DEAM binary feature flags ($D, S, C, L, M, G$).
4. **Dual-Mode Controller Subsystem**:
   - **Mode A (DEAM Combinational Logic)**: Evaluation of the canonical Boolean fault function:
     $$F = S + \overline{C} + \overline{L} + \overline{M} + \overline{G}$$
     with De Morgan dual:
     $$F = \overline{\overline{S} \cdot C \cdot L \cdot M \cdot G}$$
     Decision: $D=1 \land F=0 \implies \text{PASS}$, $F=1 \implies \text{REJECT}$.
   - **Mode B (Educational Intel 8086 CPU & 8255 PPI)**:
     Feature flags are packed into an 8-bit word and driven into 8255 PPI Port A (`80H`). The 8086 CPU executes the `visionguard_controller` assembly routine (`IN AL, 80H` $\to$ `TEST AL, 02H` $\to$ `CMP` $\to$ `OUT 81H, AL`). Actuator output signals are read from 8255 PPI Port B (`81H`).
5. **Automated Sorting Station (Position 70.0%)**:
   - Pneumatic diverter gate: 0° (PASS continuation) vs 45° (REJECT diversion).
   - PASS Lane continuation to Exit ($x = 100\%$).
   - REJECT Lane diversion to Discard Bin ($x = 70\% \dots 90\%$, angled downwards).
   - Green LED (PASS indicator), Red LED (REJECT indicator), Acoustic Alarm Buzzer.
6. **Production Analytics & Traceability**:
   - Live cycle times, inspection durations, quality yield rate, scrap rate, and Defect Pareto breakdown.
   - Comprehensive audit log of every event throughout each product's lifecycle.

---

## 2. Station Coordinate Map

Conveyor positions are measured from 0.0% (Entry) to 100.0% (Exit):

| Position (%) | Station / Element | Description |
|---|---|---|
| **0.0%** | `ENTRY` | Raw product intake queue and collision-free feeder |
| **10.0%** | `SENSOR_IR1` | Photoelectric Arrival Sensor (`IR-01`) |
| **30.0%** | `INSPECTION` | Overhead OpenCV camera station and optical ring light |
| **30.0%** | `SENSOR_IR2` | Inspection stop trigger sensor (`IR-02`) |
| **70.0%** | `SENSOR_IR3` | Sorting arrival sensor (`IR-03`) |
| **70.0%** | `SORTING_GATE` | Pneumatic diverter servo gate (0° vs 45°) |
| **90.0%** | `EXIT_SENSOR` | Exit counting sensor (`EXIT-01`) |
| **100.0%** | `EXIT` | Final exit station for acceptable product units |

---

## 3. Product Lifecycle States

Every product traverses through the deterministic finite state lifecycle:

```
[QUEUED]
   │ (feeder spacing clear >= 15%)
   ▼
[ON_CONVEYOR] ────► IR-01 (10%)
   │
   ▼
[AT_INSPECTION] ──► IR-02 (30%), conveyor halts, camera inspects
   │
   ▼
[INSPECTED] ──────► Decision recorded (PASS or REJECT), conveyor resumes
   │
   ▼
[AT_SORTING] ─────► IR-03 (70%), Gate diverts (45°) or passes (0°)
   │
   ├─► [SORTED_PASS] ──► Straight along PASS lane ──► [EXITED]
   │
   └─► [SORTED_REJECT] ─► Down REJECT chute ────────► [EXITED]
```

---

## 4. Benchmark Verification with the 6 Synthetic Samples

When running the batch demo (`POST /api/production-line/products/batch-demo`), all 6 standard benchmark samples are injected into the line:

1. **`VG-001` (Nominal Product)**:
   - Flags: $D=1, S=0, C=1, L=1, M=1, G=1$
   - Fault: $F = 0$
   - Verdict: **PASS**
   - Sorting: Gate stays at 0°, Green LED ON, exits to PASS Lane.
2. **`VG-002` (Missing Identification Label)**:
   - Flags: $D=1, S=0, C=1, L=0, M=1, G=1$
   - Fault: $\overline{L}=1 \implies F=1$
   - Verdict: **REJECT**
   - Sorting: Gate diverts to 45°, Red LED ON, Buzzer ON, routed to Reject Bin.
3. **`VG-003` (Marking Color Defect)**:
   - Flags: $D=1, S=0, C=1, L=1, M=0, G=1$
   - Fault: $\overline{M}=1 \implies F=1$
   - Verdict: **REJECT**
   - Sorting: Gate diverts to 45°, Red LED ON, Buzzer ON, routed to Reject Bin.
4. **`VG-004` (Missing Terminal Component)**:
   - Flags: $D=1, S=0, C=0, L=1, M=1, G=1$
   - Fault: $\overline{C}=1 \implies F=1$
   - Verdict: **REJECT**
   - Sorting: Gate diverts to 45°, Red LED ON, Buzzer ON, routed to Reject Bin.
5. **`VG-005` (Structural Contour Defect)**:
   - Flags: $D=1, S=0, C=1, L=1, M=1, G=0$
   - Fault: $\overline{G}=1 \implies F=1$
   - Verdict: **REJECT**
   - Sorting: Gate diverts to 45°, Red LED ON, Buzzer ON, routed to Reject Bin.
6. **`VG-006` (Surface Scratch Defect)**:
   - Flags: $D=1, S=1, C=1, L=1, M=1, G=1$
   - Fault: $S=1 \implies F=1$
   - Verdict: **REJECT**
   - Sorting: Gate diverts to 45°, Red LED ON, Buzzer ON, routed to Reject Bin.

**Benchmark Metrics Outcome**:
- Total Processed: 6
- Total Passed: 1 (16.7% Yield)
- Total Rejected: 5 (83.3% Scrap)
- Both DEAM Combinational Logic and 8086 Microprocessor Controller yield 100% agreement on all decisions.
