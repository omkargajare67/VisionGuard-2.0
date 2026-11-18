from typing import Any, Dict, List, Optional
from backend.app.microprocessor.alu import ALU8086
from backend.app.microprocessor.assembler import Assembler8086
from backend.app.microprocessor.bus import SystemBus8086
from backend.app.microprocessor.instruction_set import Instruction, InstructionOperand
from backend.app.microprocessor.interrupts import InterruptController8086
from backend.app.microprocessor.memory import Memory8086
from backend.app.microprocessor.ppi8255 import PPI8255
from backend.app.microprocessor.registers8086 import Registers8086
from backend.app.microprocessor.timers import Timer8253


class CPU8086:
    """Educational Intel 8086 Microprocessor Simulation Engine.

    Architecture:
      - BIU (Bus Interface Unit): 6-byte instruction prefetch queue, address calculation, bus interface.
      - EU (Execution Unit): Instruction decoder, 16-bit register file, ALU, FLAGS register.
      - Peripherals: Intel 8255 PPI (I/O ports 80H-83H), 8253 Timer, 256-vector IVT Interrupt Controller.
    """

    PREFETCH_QUEUE_CAPACITY = 6  # 6-byte FIFO queue in original Intel 8086

    def __init__(self, session_id: str = "default"):
        self.session_id = session_id
        self.registers = Registers8086()
        self.memory = Memory8086()
        self.bus = SystemBus8086()
        self.ppi = PPI8255(base_addr=0x80)
        self.interrupts = InterruptController8086(self.memory)
        self.timers = Timer8253(self.interrupts)
        self.assembler = Assembler8086()

        # BIU Prefetch Queue (FIFO list of bytes)
        self.prefetch_queue: List[int] = []
        self.ip_fetch: int = 0x0000  # Address where BIU is prefetching

        # Program state
        self.loaded_program_text: str = ""
        self.assembled_instructions: List[Instruction] = []
        self.instruction_map_by_offset: Dict[int, Instruction] = {}
        self.halted: bool = False
        self.step_count: int = 0
        self.execution_history: List[Dict[str, Any]] = []

        # Configure standard VisionGuard profile by default
        self.ppi.configure_for_visionguard()

    def reset(self) -> None:
        """Reset CPU, memory, peripherals, and instruction pointers."""
        self.registers.reset()
        self.memory.reset()
        self.bus.reset()
        self.ppi.reset()
        self.ppi.configure_for_visionguard()
        self.interrupts.reset()
        self.timers.reset()
        self.prefetch_queue = []
        self.ip_fetch = self.registers.ip
        self.halted = False
        self.step_count = 0
        self.execution_history = []

    # -------------------------------------------------------------------------
    # BIU Prefetch Queue Operations
    # -------------------------------------------------------------------------

    def flush_prefetch_queue(self) -> None:
        """Flush the 6-byte prefetch queue (e.g. on JMP, CALL, RET, INT, IRET)."""
        self.prefetch_queue.clear()
        self.ip_fetch = self.registers.ip
        self.fill_prefetch_queue()

    def fill_prefetch_queue(self) -> None:
        """BIU fetches bytes from code segment memory while queue has space."""
        while len(self.prefetch_queue) < self.PREFETCH_QUEUE_CAPACITY:
            paddr = self.memory.calc_physical_address(self.registers.cs, self.ip_fetch)
            byte_val = self.memory.read_byte(paddr)
            self.bus.fetch_cycle(paddr, byte_val)
            self.prefetch_queue.append(byte_val)
            self.ip_fetch = (self.ip_fetch + 1) & 0xFFFF

    # -------------------------------------------------------------------------
    # Program Assembly & Loading
    # -------------------------------------------------------------------------

    def load_assembly_program(self, source_code: str, base_offset: int = 0x0000) -> Dict[str, Any]:
        """Assemble source code and load resulting bytecode into memory at CS:base_offset."""
        asm_res = self.assembler.assemble(source_code, base_offset=base_offset)
        if not asm_res["success"]:
            return asm_res

        self.reset()
        self.loaded_program_text = source_code
        self.registers.cs = 0x1000
        self.registers.ip = base_offset
        self.ip_fetch = base_offset

        # Load bytecode into memory at CS:offset
        paddr_start = self.memory.calc_physical_address(self.registers.cs, base_offset)
        self.memory.write_bytes(paddr_start, asm_res["bytecode"])

        # Store instruction mapping for symbolic disassembly
        self.assembled_instructions = asm_res["instruction_objects"]
        self.instruction_map_by_offset = {inst.offset: inst for inst in self.assembled_instructions}

        # Initialize BIU prefetch queue
        self.fill_prefetch_queue()

        return {
            "success": True,
            "code_size": asm_res["code_size"],
            "instructions_count": len(self.assembled_instructions),
            "instructions": asm_res["instructions"],
            "labels": asm_res["labels"],
            "cs": f"0x{self.registers.cs:04X}",
            "ip": f"0x{self.registers.ip:04X}",
            "entry_physical": f"0x{paddr_start:05X}",
        }

    # -------------------------------------------------------------------------
    # Execution Engine (Single Step)
    # -------------------------------------------------------------------------

    def step(self) -> Dict[str, Any]:
        """Execute exactly one instruction (or service an interrupt)."""
        if self.halted:
            return {
                "halted": True,
                "status": "CPU HALTED (HLT instruction executed). Reset CPU or load new program.",
            }

        self.step_count += 1
        queue_before = list(self.prefetch_queue)
        prev_regs = self.registers.to_dict()
        prev_flags = self.registers.flags.to_dict()["flags"]
        prev_ip = self.registers.ip
        prev_cs = self.registers.cs

        # 1. Check for pending hardware/software interrupts
        int_event = self.interrupts.check_and_service(self)
        if int_event:
            step_record = {
                "step_number": self.step_count,
                "type": "INTERRUPT_SERVICE",
                "instruction_text": f"INT {int_event['source']}",
                "mnemonic": "INT",
                "address": f"0x{prev_cs:04X}:0x{prev_ip:04X}",
                "physical_address": f"0x{self.memory.calc_physical_address(prev_cs, prev_ip):05X}",
                "bytecode": [],
                "previous_registers": prev_regs,
                "current_registers": self.registers.to_dict(),
                "previous_flags": prev_flags,
                "current_flags": self.registers.flags.to_dict()["flags"],
                "alu_trace": None,
                "bus_transactions": self.bus.history[-2:],
                "queue_before": queue_before,
                "queue_after": list(self.prefetch_queue),
                "interrupt_details": int_event,
                "halted": self.halted,
                "status": f"Serviced {int_event['source']} (Jumped to ISR at {int_event['isr_cs']}:{int_event['isr_ip']})",
            }
            self.execution_history.append(step_record)
            return step_record

        # 2. Fetch current instruction from map (or decode from memory)
        inst = self.instruction_map_by_offset.get(self.registers.ip)
        if not inst:
            # Reached end of assembled instructions or invalid branch target
            self.halted = True
            return {
                "step_number": self.step_count,
                "halted": True,
                "status": f"No instruction found at CS:IP (0x{self.registers.cs:04X}:0x{self.registers.ip:04X}). Halted.",
            }

        # Consume bytecode bytes from prefetch queue
        consumed_bytes = []
        for _ in range(inst.size):
            if self.prefetch_queue:
                consumed_bytes.append(self.prefetch_queue.pop(0))
            else:
                p = self.memory.calc_physical_address(self.registers.cs, self.registers.ip)
                consumed_bytes.append(self.memory.read_byte(p))

        # 3. Decode & Execute instruction in Execution Unit (EU)
        alu_trace: Optional[Dict[str, Any]] = None
        jump_occurred = False
        next_ip = (self.registers.ip + inst.size) & 0xFFFF

        mnemonic = inst.mnemonic
        ops = inst.operands

        try:
            # ---------------- DATA TRANSFER ----------------
            if mnemonic == "MOV":
                dst = ops[0]
                src = ops[1]
                val = self._read_operand_value(src)
                self._write_operand_value(dst, val)

            elif mnemonic == "XCHG":
                op1 = ops[0]
                op2 = ops[1]
                v1 = self._read_operand_value(op1)
                v2 = self._read_operand_value(op2)
                self._write_operand_value(op1, v2)
                self._write_operand_value(op2, v1)

            elif mnemonic == "PUSH":
                val = self._read_operand_value(ops[0])
                self.registers.sp = (self.registers.sp - 2) & 0xFFFF
                self.memory.write_seg_word(self.registers.ss, self.registers.sp, val)
                self.bus.memory_write(
                    self.memory.calc_physical_address(self.registers.ss, self.registers.sp), val, is_16bit=True
                )

            elif mnemonic == "POP":
                dst = ops[0]
                val = self.memory.read_seg_word(self.registers.ss, self.registers.sp)
                self.bus.memory_read(
                    self.memory.calc_physical_address(self.registers.ss, self.registers.sp), val, is_16bit=True
                )
                self.registers.sp = (self.registers.sp + 2) & 0xFFFF
                self._write_operand_value(dst, val)

            # ---------------- ARITHMETIC & LOGIC ----------------
            elif mnemonic in ("ADD", "ADC", "SUB", "SBB", "CMP", "AND", "OR", "XOR", "TEST"):
                dst = ops[0]
                src = ops[1]
                v1 = self._read_operand_value(dst)
                v2 = self._read_operand_value(src)
                is_16 = dst.is_16bit
                res, alu_trace = ALU8086.execute(mnemonic, v1, v2, self.registers.flags, is_16bit=is_16)
                if mnemonic not in ("CMP", "TEST"):
                    self._write_operand_value(dst, res)

            elif mnemonic in ("INC", "DEC", "NOT"):
                dst = ops[0]
                v1 = self._read_operand_value(dst)
                is_16 = dst.is_16bit
                res, alu_trace = ALU8086.execute(mnemonic, v1, None, self.registers.flags, is_16bit=is_16)
                self._write_operand_value(dst, res)

            # ---------------- CONTROL TRANSFER (BRANCHING) ----------------
            elif mnemonic == "JMP":
                target = ops[0].value
                next_ip = target & 0xFFFF
                jump_occurred = True

            elif mnemonic in ("JZ", "JE"):
                if self.registers.flags.zf == 1:
                    next_ip = ops[0].value & 0xFFFF
                    jump_occurred = True

            elif mnemonic in ("JNZ", "JNE"):
                if self.registers.flags.zf == 0:
                    next_ip = ops[0].value & 0xFFFF
                    jump_occurred = True

            elif mnemonic == "JC":
                if self.registers.flags.cf == 1:
                    next_ip = ops[0].value & 0xFFFF
                    jump_occurred = True

            elif mnemonic == "JNC":
                if self.registers.flags.cf == 0:
                    next_ip = ops[0].value & 0xFFFF
                    jump_occurred = True

            elif mnemonic == "LOOP":
                # Decrement CX; if CX != 0 jump
                self.registers.cx = (self.registers.cx - 1) & 0xFFFF
                if self.registers.cx != 0:
                    next_ip = ops[0].value & 0xFFFF
                    jump_occurred = True

            elif mnemonic == "CALL":
                # Push return IP to stack
                ret_ip = next_ip
                self.registers.sp = (self.registers.sp - 2) & 0xFFFF
                self.memory.write_seg_word(self.registers.ss, self.registers.sp, ret_ip)
                next_ip = ops[0].value & 0xFFFF
                jump_occurred = True

            elif mnemonic == "RET":
                # Pop IP from stack
                ret_ip = self.memory.read_seg_word(self.registers.ss, self.registers.sp)
                self.registers.sp = (self.registers.sp + 2) & 0xFFFF
                next_ip = ret_ip & 0xFFFF
                jump_occurred = True

            # ---------------- I/O (IN / OUT) ----------------
            elif mnemonic == "IN":
                # IN AL, port_num or IN AX, port_num or IN AL, DX
                dst = ops[0]
                port = ops[1].value if ops[1].type == InstructionOperand.TYPE_IMM else self.registers.dx
                port_byte = port & 0xFF
                val = self.ppi.read_io(port_byte)
                self.bus.io_read(port_byte, val)
                self._write_operand_value(dst, val)

            elif mnemonic == "OUT":
                # OUT port_num, AL or OUT port_num, AX or OUT DX, AL
                port = ops[0].value if ops[0].type == InstructionOperand.TYPE_IMM else self.registers.dx
                port_byte = port & 0xFF
                val = self._read_operand_value(ops[1]) & 0xFF
                self.ppi.write_io(port_byte, val)
                self.bus.io_write(port_byte, val)

            # ---------------- PROCESSOR CONTROL ----------------
            elif mnemonic == "NOP":
                pass

            elif mnemonic == "HLT":
                self.halted = True

            elif mnemonic == "STI":
                self.registers.flags.if_flag = 1

            elif mnemonic == "CLI":
                self.registers.flags.if_flag = 0

            elif mnemonic == "INT":
                vec = ops[0].value & 0xFF
                next_ip = next_ip  # Will be overridden by interrupt routine
                self.registers.ip = next_ip
                return self.interrupts.service_interrupt(self, vec, source=f"Software INT {vec}")

            elif mnemonic == "IRET":
                iret_info = self.interrupts.return_from_interrupt(self)
                next_ip = self.registers.ip
                jump_occurred = True

            else:
                raise ValueError(f"Execution error: Unhandled mnemonic '{mnemonic}'")

        except Exception as e:
            self.halted = True
            return {
                "step_number": self.step_count,
                "error": str(e),
                "instruction_text": inst.source_line,
                "address": f"0x{prev_cs:04X}:0x{prev_ip:04X}",
                "halted": True,
            }

        # 4. Advance Instruction Pointer
        self.registers.ip = next_ip

        # 5. Flush and refill prefetch queue if jump/call/ret occurred
        if jump_occurred:
            self.flush_prefetch_queue()
        else:
            self.fill_prefetch_queue()

        step_record = {
            "step_number": self.step_count,
            "type": "INSTRUCTION_EXECUTE",
            "instruction_text": inst.source_line,
            "mnemonic": mnemonic,
            "address": f"0x{prev_cs:04X}:0x{prev_ip:04X}",
            "physical_address": f"0x{self.memory.calc_physical_address(prev_cs, prev_ip):05X}",
            "bytecode": [f"0x{b:02X}" for b in inst.bytecode],
            "previous_registers": prev_regs,
            "current_registers": self.registers.to_dict(),
            "previous_flags": prev_flags,
            "current_flags": self.registers.flags.to_dict()["flags"],
            "alu_trace": alu_trace,
            "bus_transactions": self.bus.history[-2:],
            "queue_before": [f"0x{b:02X}" for b in queue_before],
            "queue_after": [f"0x{b:02X}" for b in self.prefetch_queue],
            "jump_taken": jump_occurred,
            "halted": self.halted,
            "status": "Halted by HLT" if self.halted else "Executed normally",
        }
        self.execution_history.append(step_record)
        return step_record

    # -------------------------------------------------------------------------
    # Run Loop with Step Limit
    # -------------------------------------------------------------------------

    def run(self, max_steps: int = 500) -> Dict[str, Any]:
        """Run execution continuously until HLT or maximum step limit."""
        steps_executed = 0
        step_logs: List[Dict[str, Any]] = []

        while not self.halted and steps_executed < max_steps:
            res = self.step()
            steps_executed += 1
            step_logs.append(res)
            if self.halted or "error" in res:
                break

        return {
            "steps_executed": steps_executed,
            "halted": self.halted,
            "hit_step_limit": steps_executed >= max_steps and not self.halted,
            "final_registers": self.registers.to_dict(),
            "final_ppi": self.ppi.to_dict(),
            "step_logs": step_logs,
        }

    # -------------------------------------------------------------------------
    # Operand Evaluation Helpers
    # -------------------------------------------------------------------------

    def _read_operand_value(self, op: InstructionOperand) -> int:
        if op.type == InstructionOperand.TYPE_REG:
            return self.registers.get_reg(op.value)

        if op.type == InstructionOperand.TYPE_IMM:
            return op.value & (0xFFFF if op.is_16bit else 0xFF)

        if op.type == InstructionOperand.TYPE_LABEL:
            return op.value & 0xFFFF

        if op.type == InstructionOperand.TYPE_MEM:
            effective_addr = self._calc_effective_address(op)
            if op.is_16bit:
                val = self.memory.read_seg_word(self.registers.ds, effective_addr)
                paddr = self.memory.calc_physical_address(self.registers.ds, effective_addr)
                self.bus.memory_read(paddr, val, is_16bit=True)
                return val
            else:
                val = self.memory.read_seg_byte(self.registers.ds, effective_addr)
                paddr = self.memory.calc_physical_address(self.registers.ds, effective_addr)
                self.bus.memory_read(paddr, val, is_16bit=False)
                return val

        raise ValueError(f"Unknown operand type: '{op.type}'")

    def _write_operand_value(self, op: InstructionOperand, val: int) -> None:
        if op.type == InstructionOperand.TYPE_REG:
            self.registers.set_reg(op.value, val)
            return

        if op.type == InstructionOperand.TYPE_MEM:
            effective_addr = self._calc_effective_address(op)
            if op.is_16bit:
                self.memory.write_seg_word(self.registers.ds, effective_addr, val)
                paddr = self.memory.calc_physical_address(self.registers.ds, effective_addr)
                self.bus.memory_write(paddr, val, is_16bit=True)
            else:
                self.memory.write_seg_byte(self.registers.ds, effective_addr, val)
                paddr = self.memory.calc_physical_address(self.registers.ds, effective_addr)
                self.bus.memory_write(paddr, val, is_16bit=False)
            return

        raise ValueError(f"Cannot write to non-lvalue operand type: '{op.type}'")

    def _calc_effective_address(self, op: InstructionOperand) -> int:
        ea = op.disp & 0xFFFF
        if op.base_reg:
            ea = (ea + self.registers.get_reg(op.base_reg)) & 0xFFFF
        if op.index_reg:
            ea = (ea + self.registers.get_reg(op.index_reg)) & 0xFFFF
        return ea

    # -------------------------------------------------------------------------
    # Comprehensive Status Serializer
    # -------------------------------------------------------------------------

    def get_full_state(self) -> Dict[str, Any]:
        """Return rich architectural snapshot of the entire microprocessor simulation."""
        return {
            "session_id": self.session_id,
            "step_count": self.step_count,
            "halted": self.halted,
            "registers": self.registers.to_dict(),
            "flags": self.registers.flags.to_dict(),
            "biu": {
                "prefetch_queue": [f"0x{b:02X}" for b in self.prefetch_queue],
                "queue_capacity": self.PREFETCH_QUEUE_CAPACITY,
                "queue_occupancy": len(self.prefetch_queue),
                "ip_fetch": f"0x{self.ip_fetch:04X}",
                "physical_fetch": f"0x{self.memory.calc_physical_address(self.registers.cs, self.ip_fetch):05X}",
            },
            "bus": self.bus.to_dict(),
            "ppi": self.ppi.to_dict(),
            "timers": self.timers.to_dict(),
            "current_instruction": (
                self.instruction_map_by_offset[self.registers.ip].to_dict()
                if self.registers.ip in self.instruction_map_by_offset
                else None
            ),
        }
