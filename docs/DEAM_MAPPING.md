# VisionGuard 2.0: DEAM Syllabus Concept Mapping

This document details how each theoretical topic of the **Digital Electronics and Microprocessors (DEAM)** curriculum is concretely realized within the VisionGuard 2.0 industrial sorting application.

---

## Unit 1: Fundamentals of Digital Logic & Boolean Algebra

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **Binary Representation & Logic Levels** | 0 V (LOW / 0) and 5 V (HIGH / 1) TTL simulation representations in `logic_gates.py`. | Optical sensor beams: High = uninterrupted, Low = workpiece detected. |
| **Basic & Universal Gates** | AND, OR, NOT, NAND, NOR, XOR, XNOR software models with truth table generators. | Interlocking conveyor safety guards: emergency stop AND product sensor. |
| **Boolean Algebra & Theorems** | De Morgan's Laws, Commutative/Associative reductions via boolean evaluation engine. | Minimizing gate count in combinational fault detection logic. |
| **K-Map Simplification** | 2, 3, and 4-variable Karnaugh Map solver (`boolean_logic.py`) with visual grouping matrices. | Deriving optimal SOP/POS circuit equations from inspection parameter truth tables. |

---

## Unit 2: Combinational Logic Circuits

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **Half Adder & Full Adder** | 1-bit and ripple-carry multi-bit binary adders (`combinational.py`). | Incremental workpiece tally accumulator at the hardware register level. |
| **Multiplexers (2:1, 4:1, 8:1)** | Data selection circuits with binary select lines. | Channeling multiple sensor streams (IR entry, IR inspection, IR exit) into single ADC/input line. |
| **Demultiplexers & Decoders** | 2-to-4 and 3-to-8 line decoders with active-low/high enable lines. | Actuator address decoding: directing control pulses to Conveyor, Servo Gate, LED bank, or Buzzer. |
| **Priority Encoder** | 4-to-2 and 8-to-3 priority encoders (`combinational.py`). | Resolving simultaneous emergency signals (E-stop has priority over camera fault, which has priority over IR misalignment). |
| **Parity Generator & Checker** | Even and odd parity generators using cascaded XOR networks. | Verifying serial communication integrity of sensor status words transmitted across the plant floor. |

---

## Unit 3: Sequential Logic & Finite State Machines

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **Latches & Flip-Flops** | Edge-triggered SR, JK, D, and T flip-flops with clock and asynchronous set/clear pins (`flipflops.py`). | Latching transient IR beam interruptions until CPU acknowledges receipt. |
| **Registers & Shift Registers** | 4-bit and 8-bit SISO, SIPO, PISO, PIPO registers (`registers.py`). | Tracking item positions across successive conveyor belt distance segments. |
| **Counters (Sync & Async)** | Modulo-N synchronous up/down counters and ripple counters (`counters.py`). | Real-time counting of batch sizes, accepted units, and rejection totals. |
| **Finite State Machines (FSM)** | Formal Moore and Mealy state machine execution engines (`fsm.py`). | Managing the complete production line cycle: `IDLE` -> `CONVEY` -> `DETECTED` -> `CAPTURE` -> `INSPECT` -> `SORT` -> `RESET`. |

---

## Unit 4: 8086 Microprocessor Architecture & Interfacing

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **Register Organization** | General-purpose (AX, BX, CX, DX), Pointer/Index (SP, BP, SI, DI), Segment (CS, DS, SS, ES), and Flag register simulation (`cpu8086.py`, `registers.py`). | Emulating the industrial controller processor running real inspection control routines. |
| **Segmented Memory Model** | Logical-to-physical address calculation: `Physical = (Segment << 4) + Offset`. | Segregating code (CS), inspection data arrays (DS), and stack frames (SS). |
| **Instruction Set (Educational Subset)** | Data transfer (`MOV`, `PUSH`, `POP`), Arithmetic (`ADD`, `SUB`, `INC`, `CMP`), Logical (`AND`, `OR`, `XOR`, `TEST`), Control transfer (`JMP`, `JZ`, `JNZ`, `CALL`, `RET`). | Assembly routines executing the sorting decision algorithm based on port inputs. |
| **Addressing Modes** | Immediate, Register, Direct, Register Indirect, Based Relative, Indexed Relative. | Fetching calibration parameters from ROM and dynamic defect flags from RAM. |
| **Intel 8255 PPI Interfacing** | Ports A, B, and C with control word registers in Mode 0 (Basic I/O) and Mode 1 (Strobed I/O) (`ppi8255.py`). | Port A: Input from Camera/Vision flags; Port B: Output to Servo Gate & Motor; Port C: Handshaking & Status LEDs. |

---

## Unit 5: Instruction Execution & Pipelining Principles

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **BIU & EU Concurrency** | Independent Bus Interface Unit (Prefetch Queue) and Execution Unit simulation. | Demonstrating overlapping instruction prefetch while executing previous ALU operations. |
| **Pipelining Visualization** | Visual stage breakdown: Fetch, Decode, Execute, Memory Access, Writeback with hazard detection. | Educational demonstration of processing throughput in automated industrial monitoring. |

---

## Unit 6: Interrupts, Timers & Real-Time Control

| Curriculum Concept | VisionGuard 2.0 Concrete Implementation | Application Role in Production Line |
|---|---|---|
| **Interrupt Architecture** | Hardware interrupts (`INTR`, `NMI`), Interrupt Vector Table (IVT, vector offsets 0x000-0x3FF), `IRET`. | IR sensor trips `INTR` line to interrupt current background tasks and initiate urgent inspection sequence. |
| **Interrupt Priority & Masking** | Programmable priority resolution and Interrupt Flag (`IF`) state machine. | Prioritizing critical emergency stops over standard product arrival signals. |
| **Programmable Interval Timers** | Count-down timer models (`timers.py`) mimicking 8253/8254 mode 0/mode 3. | Timing conveyor dwell duration during camera capture and servo deflection gate actuation duration. |
| **Interrupt Service Routine (ISR)** | Dedicated assembly routines handling sensor trip vectors. | Reading input ports, executing quick pass/reject branches, and setting actuator flags. |
