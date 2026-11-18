import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.microprocessor.alu import ALU8086
from backend.app.microprocessor.assembler import Assembler8086
from backend.app.microprocessor.cpu8086 import CPU8086
from backend.app.microprocessor.example_programs import EXAMPLE_PROGRAMS
from backend.app.microprocessor.memory import Memory8086
from backend.app.microprocessor.ppi8255 import PPI8255
from backend.app.microprocessor.registers8086 import FlagsRegister, Registers8086


client = TestClient(app)


# =============================================================================
# 1. CPU REGISTERS & ALIASING TESTS
# =============================================================================

def test_cpu_registers_16bit_storage():
    regs = Registers8086()
    regs.ax = 0x1234
    regs.bx = 0xABCD
    regs.cx = 0x5678
    regs.dx = 0xEF01

    assert regs.ax == 0x1234
    assert regs.bx == 0xABCD
    assert regs.cx == 0x5678
    assert regs.dx == 0xEF01

    # Test 16-bit overflow wrapping
    regs.ax = 0x10005
    assert regs.ax == 0x0005


def test_cpu_registers_8bit_aliasing():
    regs = Registers8086()
    regs.ax = 0x1234

    # Read aliases
    assert regs.ah == 0x12
    assert regs.al == 0x34

    # Write low byte: high byte must be preserved
    regs.al = 0xFF
    assert regs.ax == 0x12FF
    assert regs.ah == 0x12
    assert regs.al == 0xFF

    # Write high byte: low byte must be preserved
    regs.ah = 0xAB
    assert regs.ax == 0xABFF
    assert regs.ah == 0xAB
    assert regs.al == 0xFF

    # BX, CX, DX aliases
    regs.bx = 0x0000
    regs.bh = 0x42
    regs.bl = 0x84
    assert regs.bx == 0x4284

    regs.cx = 0x0000
    regs.ch = 0x11
    regs.cl = 0x22
    assert regs.cx == 0x1122

    regs.dx = 0x0000
    regs.dh = 0xAA
    regs.dl = 0x55
    assert regs.dx == 0xAA55


def test_flags_register():
    flags = FlagsRegister(0x0000)
    assert flags.cf == 0
    assert flags.zf == 0

    flags.cf = 1
    assert flags.cf == 1
    assert (flags.value & 1) == 1

    flags.zf = 1
    assert flags.zf == 1
    assert flags.cf == 1

    flags.if_flag = 1
    assert flags.if_flag == 1

    flags.cf = 0
    assert flags.cf == 0
    assert flags.zf == 1
    assert flags.if_flag == 1


# =============================================================================
# 2. 1 MB SEGMENTED MEMORY TESTS
# =============================================================================

def test_memory_physical_address_calculation():
    # Physical = (Segment << 4) + Offset
    assert Memory8086.calc_physical_address(0x1000, 0x0000) == 0x10000
    assert Memory8086.calc_physical_address(0x1000, 0x0025) == 0x10025
    assert Memory8086.calc_physical_address(0x2000, 0x0500) == 0x20500

    # Overlapping address demo: two different segment:offset pairs refer to same physical location
    # 0x1000:0x0050 = 0x10050
    # 0x1005:0x0000 = 0x10050
    p1 = Memory8086.calc_physical_address(0x1000, 0x0050)
    p2 = Memory8086.calc_physical_address(0x1005, 0x0000)
    assert p1 == p2 == 0x10050

    # 20-bit wrap-around
    p_wrap = Memory8086.calc_physical_address(0xFFFF, 0x0010)
    assert p_wrap == 0x00000  # (0xFFFF0 + 0x10) = 0x100000 -> wrapped to 0


def test_memory_read_write_little_endian():
    mem = Memory8086()
    # Write 16-bit word 0x1234 at physical address 0x10000
    mem.write_word(0x10000, 0x1234)

    # Little endian verification: low byte at 0x10000, high byte at 0x10001
    assert mem.read_byte(0x10000) == 0x34
    assert mem.read_byte(0x10001) == 0x12
    assert mem.read_word(0x10000) == 0x1234

    # Read through segment and offset
    assert mem.read_seg_word(0x1000, 0x0000) == 0x1234


# =============================================================================
# 3. ALU OPERATION & FLAGS TESTS
# =============================================================================

def test_alu_arithmetic_operations():
    flags = FlagsRegister(0x0000)

    # ADD
    res, trace = ALU8086.execute("ADD", 0x0005, 0x0003, flags, is_16bit=True)
    assert res == 0x0008
    assert flags.zf == 0
    assert flags.cf == 0

    # ADD with Zero Flag
    res, _ = ALU8086.execute("ADD", 0x0000, 0x0000, flags, is_16bit=True)
    assert res == 0
    assert flags.zf == 1

    # ADD with Carry Flag (16-bit overflow)
    res, _ = ALU8086.execute("ADD", 0xFFFF, 0x0001, flags, is_16bit=True)
    assert res == 0x0000
    assert flags.cf == 1
    assert flags.zf == 1

    # SUB
    res, _ = ALU8086.execute("SUB", 0x000A, 0x0003, flags, is_16bit=True)
    assert res == 0x0007
    assert flags.cf == 0

    # SUB with Borrow
    res, _ = ALU8086.execute("SUB", 0x0002, 0x0005, flags, is_16bit=True)
    assert flags.cf == 1  # Borrow generated
    assert flags.sf == 1  # Sign bit set

    # CMP (does not alter destination, sets flags)
    res, _ = ALU8086.execute("CMP", 0x0020, 0x0020, flags, is_16bit=True)
    assert res == 0x0020
    assert flags.zf == 1
    assert flags.cf == 0


def test_alu_logical_operations():
    flags = FlagsRegister(0x0000)

    # AND
    res, _ = ALU8086.execute("AND", 0xFF00, 0x0F0F, flags, is_16bit=True)
    assert res == 0x0F00
    assert flags.cf == 0
    assert flags.of == 0

    # OR
    res, _ = ALU8086.execute("OR", 0xF000, 0x000F, flags, is_16bit=True)
    assert res == 0xF00F

    # XOR
    res, _ = ALU8086.execute("XOR", 0xAAAA, 0x5555, flags, is_16bit=True)
    assert res == 0xFFFF

    # NOT
    res, _ = ALU8086.execute("NOT", 0x00FF, None, flags, is_16bit=True)
    assert res == 0xFF00


# =============================================================================
# 4. ASSEMBLER & INSTRUCTION EXECUTION TESTS
# =============================================================================

def test_assembler_simple_program():
    asm = Assembler8086()
    code = """
    MOV AX, 0005H
    MOV BX, 0003H
    ADD AX, BX
    HLT
    """
    res = asm.assemble(code)
    assert res["success"] is True
    assert len(res["instruction_objects"]) == 4
    assert res["instruction_objects"][0].mnemonic == "MOV"
    assert res["instruction_objects"][2].mnemonic == "ADD"
    assert res["instruction_objects"][3].mnemonic == "HLT"


def test_cpu_execution_step_and_run():
    cpu = CPU8086()
    code = """
    MOV AX, 0002H
    MOV BX, 0004H
    ADD AX, BX
    HLT
    """
    load_res = cpu.load_assembly_program(code)
    assert load_res["success"] is True

    # Step 1: MOV AX, 0002H
    s1 = cpu.step()
    assert cpu.registers.ax == 0x0002
    assert s1["mnemonic"] == "MOV"

    # Step 2: MOV BX, 0004H
    cpu.step()
    assert cpu.registers.bx == 0x0004

    # Step 3: ADD AX, BX
    cpu.step()
    assert cpu.registers.ax == 0x0006

    # Step 4: HLT
    s4 = cpu.step()
    assert cpu.halted is True
    assert s4["status"] == "Halted by HLT"


def test_cpu_loop_and_jump():
    cpu = CPU8086()
    code = """
    MOV AX, 0000H
    MOV CX, 0003H
AGAIN:
    INC AX
    LOOP AGAIN
    HLT
    """
    load_res = cpu.load_assembly_program(code)
    assert load_res["success"] is True

    # Run complete program
    run_res = cpu.run(max_steps=50)
    assert run_res["halted"] is True
    assert cpu.registers.ax == 3
    assert cpu.registers.cx == 0


def test_cpu_subroutine_call_and_ret():
    cpu = CPU8086()
    code = """
    MOV AX, 0005H
    CALL DOUBLE_IT
    HLT

DOUBLE_IT:
    ADD AX, AX
    RET
    """
    cpu.load_assembly_program(code)
    run_res = cpu.run(max_steps=50)
    assert run_res["halted"] is True
    assert cpu.registers.ax == 10


# =============================================================================
# 5. BIU & 6-BYTE PREFETCH QUEUE TESTS
# =============================================================================

def test_biu_prefetch_queue():
    cpu = CPU8086()
    code = """
    MOV AX, 0001H
    MOV BX, 0002H
    MOV CX, 0003H
    HLT
    """
    cpu.load_assembly_program(code)

    # Queue should be filled up to capacity (6 bytes)
    assert len(cpu.prefetch_queue) == 6
    queue_before = list(cpu.prefetch_queue)

    # Execute instruction: queue consumes bytes and refills
    cpu.step()
    assert len(cpu.prefetch_queue) == 6  # Refilled after consumption


# =============================================================================
# 6. INTEL 8255 PPI TESTS
# =============================================================================

def test_ppi_mode_0_configuration():
    ppi = PPI8255(base_addr=0x80)

    # Control word 0x90 = 10010000B: Mode 0, Port A=IN, Port B=OUT, Port C=OUT
    res = ppi.write_control(0x90)
    assert res["type"] == "MODE_SET"
    assert ppi.port_a_dir == "IN"
    assert ppi.port_b_dir == "OUT"
    assert ppi.port_c_lower_dir == "OUT"
    assert ppi.port_c_upper_dir == "OUT"

    # Write Port B and read back
    ppi.write_port("B", 0x5A)
    assert ppi.read_port("B") == 0x5A

    # Port A input
    ppi.set_port_a_external_input(0x3D)
    assert ppi.read_port("A") == 0x3D


def test_ppi_bsr_mode():
    ppi = PPI8255(base_addr=0x80)
    ppi.write_control(0x90)

    # Set Port C bit 2 (BSR word: D7=0, bits 3-1=010, bit 0=1 -> 0x05)
    ppi.write_control(0x05)
    assert (ppi.read_port("C") & (1 << 2)) != 0

    # Reset Port C bit 2 (BSR word: D7=0, bits 3-1=010, bit 0=0 -> 0x04)
    ppi.write_control(0x04)
    assert (ppi.read_port("C") & (1 << 2)) == 0


# =============================================================================
# 7. INTERRUPTS & TIMERS TESTS
# =============================================================================

def test_interrupt_ivt_and_servicing():
    cpu = CPU8086()
    # Program running in background with interrupts enabled
    code = """
    STI
    MOV AX, 0001H
LOOP_IDLE:
    INC AX
    JMP LOOP_IDLE
    """
    cpu.load_assembly_program(code)
    cpu.step()  # STI (IF = 1)
    assert cpu.registers.flags.if_flag == 1

    # Register an ISR at 0x1000:0x0050 in IVT vector 0x08
    cpu.interrupts.set_vector(8, 0x1000, 0x0050)
    seg, off = cpu.interrupts.get_vector(8)
    assert seg == 0x1000
    assert off == 0x0050

    # Raise INTR
    cpu.interrupts.raise_intr(8)
    # Next step should service interrupt
    step_res = cpu.step()
    assert step_res["type"] == "INTERRUPT_SERVICE"
    assert cpu.registers.cs == 0x1000
    assert cpu.registers.ip == 0x0050
    assert cpu.registers.flags.if_flag == 0  # Cleared during interrupt entry


def test_timer8253_terminal_count():
    cpu = CPU8086()
    cpu.registers.flags.if_flag = 1
    cpu.timers.configure(mode=0, count=3)

    # Advance timer ticks
    res1 = cpu.timers.tick(2)
    assert res1["channel0"]["current_count"] == 1
    assert res1["channel0"]["terminal_count"] is False

    # 3rd tick reaches terminal count and raises interrupt
    res2 = cpu.timers.tick(1)
    assert res2["channel0"]["terminal_count"] is True
    assert cpu.interrupts.pending_intr == 8


# =============================================================================
# 8. VISIONGUARD INTEGRATION TESTS (OPENCV FLAGS -> 8255 PORT A -> 8086 -> PORT B)
# =============================================================================

def test_visionguard_controller_nominal_pass():
    """VG-001 (Nominal): D=1, S=0, C=1, L=1, M=1, G=1.

    Port A receives 3DH.
    Program verifies conformed product and writes 05H to Port B (PB0 Conveyor + PB2 Green LED).
    """
    cpu = CPU8086()
    code = EXAMPLE_PROGRAMS["visionguard_controller"]["code"]
    cpu.load_assembly_program(code)

    # Import VG-001 nominal flags
    cpu.ppi.import_vision_flags(d=1, s=0, c=1, l=1, m=1, g=1)

    # Execute complete controller program
    run_res = cpu.run(max_steps=100)
    assert run_res["halted"] is True

    # Verify Port B output signals
    actuators = cpu.ppi.get_port_b_actuator_signals()
    assert actuators["green_led"] == 1
    assert actuators["conveyor_motor"] == 1
    assert actuators["red_led"] == 0
    assert actuators["reject_gate"] == 0
    assert actuators["buzzer"] == 0
    assert actuators["decision"] == "PASS"


def test_visionguard_controller_defective_reject():
    """VG-002 (Missing Label): D=1, S=0, C=1, L=0, M=1, G=1.

    Port A receives 35H.
    Program identifies defect and writes 1AH to Port B (PB1 Reject Diverter + PB3 Red LED + PB4 Buzzer).
    """
    cpu = CPU8086()
    code = EXAMPLE_PROGRAMS["visionguard_controller"]["code"]
    cpu.load_assembly_program(code)

    # Import VG-002 missing label flags
    cpu.ppi.import_vision_flags(d=1, s=0, c=1, l=0, m=1, g=1)

    # Execute
    run_res = cpu.run(max_steps=100)
    assert run_res["halted"] is True

    actuators = cpu.ppi.get_port_b_actuator_signals()
    assert actuators["green_led"] == 0
    assert actuators["reject_gate"] == 1
    assert actuators["red_led"] == 1
    assert actuators["buzzer"] == 1
    assert actuators["decision"] == "REJECT"


def test_visionguard_controller_no_product():
    """No product present (D=0). All sorting actuators and LEDs must remain LOW."""
    cpu = CPU8086()
    code = EXAMPLE_PROGRAMS["visionguard_controller"]["code"]
    cpu.load_assembly_program(code)

    # D=0
    cpu.ppi.import_vision_flags(d=0, s=0, c=1, l=1, m=1, g=1)

    run_res = cpu.run(max_steps=100)
    assert run_res["halted"] is True

    actuators = cpu.ppi.get_port_b_actuator_signals()
    assert actuators["green_led"] == 0
    assert actuators["red_led"] == 0
    assert actuators["reject_gate"] == 0
    assert actuators["buzzer"] == 0


# =============================================================================
# 9. FASTAPI REST API ENDPOINTS TESTS
# =============================================================================

def test_api_microprocessor_status():
    resp = client.get("/api/microprocessor/status")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "operational"
    assert data["stage"] == 4


def test_api_session_lifecycle_and_program_execution():
    session_id = "test_session_api"

    # Create/get session
    r1 = client.post(f"/api/microprocessor/sessions/{session_id}")
    assert r1.status_code == 200
    assert r1.json()["session_id"] == session_id

    # Load assembly program
    load_payload = {
        "code": "MOV AX, 0009H\nADD AX, 0001H\nHLT",
        "base_offset": 0,
    }
    r2 = client.post(f"/api/microprocessor/sessions/{session_id}/load", json=load_payload)
    assert r2.status_code == 200
    assert r2.json()["success"] is True

    # Step instruction
    r3 = client.post(f"/api/microprocessor/sessions/{session_id}/step")
    assert r3.status_code == 200
    step_data = r3.json()
    assert step_data["step"]["mnemonic"] == "MOV"

    # Run remaining instructions
    r4 = client.post(f"/api/microprocessor/sessions/{session_id}/run", json={"max_steps": 10})
    assert r4.status_code == 200
    assert r4.json()["halted"] is True
    assert r4.json()["final_registers"]["general"]["AX"]["dec"] == 10

    # Memory inspection endpoint
    r5 = client.post(f"/api/microprocessor/sessions/{session_id}/memory", json={"segment": 0x1000, "offset": 0x0000, "count": 16})
    assert r5.status_code == 200
    assert len(r5.json()) >= 1

    # PPI import sample flags
    r6 = client.post(f"/api/microprocessor/sessions/{session_id}/ppi/import-sample", json={"sample_id": "VG-001"})
    assert r6.status_code == 200
    assert r6.json()["sample_id"] == "VG-001"
