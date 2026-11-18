from typing import Any, Dict, List, Optional, Tuple


class InterruptController8086:
    """Educational Intel 8086 Interrupt Subsystem.

    Features:
      - 256-entry Interrupt Vector Table (IVT) in lower 1 KB of RAM (0x00000 - 0x003FF).
      - Hardware Maskable Interrupts (INTR), gated by IF flag.
      - Non-Maskable Interrupts (NMI, Type 2), always serviced.
      - Software Interrupts (INT n).
      - Push FLAGS, CS, IP sequence and IRET restoration.
    """

    IVT_BASE = 0x00000
    IVT_SIZE = 1024  # 256 vectors * 4 bytes

    def __init__(self, memory: Any):
        self.memory = memory
        self.pending_intr: Optional[int] = None
        self.pending_nmi: bool = False
        self.history: List[Dict[str, Any]] = []
        self.init_default_ivt()

    def reset(self) -> None:
        self.pending_intr = None
        self.pending_nmi = False
        self.history = []
        self.init_default_ivt()

    def set_vector(self, vector_num: int, segment: int, offset: int) -> None:
        """Set a 4-byte IVT entry (IP low, IP high, CS low, CS high)."""
        vec = vector_num & 0xFF
        paddr = vec * 4
        # Little endian: Offset low, Offset high, Segment low, Segment high
        self.memory.write_byte(paddr + 0, offset & 0xFF)
        self.memory.write_byte(paddr + 1, (offset >> 8) & 0xFF)
        self.memory.write_byte(paddr + 2, segment & 0xFF)
        self.memory.write_byte(paddr + 3, (segment >> 8) & 0xFF)

    def get_vector(self, vector_num: int) -> Tuple[int, int]:
        """Read 4-byte IVT entry returning (segment, offset)."""
        vec = vector_num & 0xFF
        paddr = vec * 4
        off_l = self.memory.read_byte(paddr + 0)
        off_h = self.memory.read_byte(paddr + 1)
        seg_l = self.memory.read_byte(paddr + 2)
        seg_h = self.memory.read_byte(paddr + 3)
        offset = (off_h << 8) | off_l
        segment = (seg_h << 8) | seg_l
        return segment, offset

    def init_default_ivt(self) -> None:
        """Initialize standard educational 8086 vectors."""
        # Type 0: Divide by Zero -> 0x0000:0x0400
        self.set_vector(0, 0x0000, 0x0400)
        # Type 1: Single Step Trap -> 0x0000:0x0420
        self.set_vector(1, 0x0000, 0x0420)
        # Type 2: Non-Maskable Interrupt (NMI) -> 0x0000:0x0440
        self.set_vector(2, 0x0000, 0x0440)
        # Type 3: Breakpoint -> 0x0000:0x0460
        self.set_vector(3, 0x0000, 0x0460)
        # Type 4: Overflow -> 0x0000:0x0480
        self.set_vector(4, 0x0000, 0x0480)
        # Type 8: System Timer Tick (IRQ0) -> 0x0000:0x0500
        self.set_vector(8, 0x0000, 0x0500)
        # Type 9: Product Proximity Arrival Sensor (IRQ1) -> 0x0000:0x0520
        self.set_vector(9, 0x0000, 0x0520)
        # Type 80H (128): VisionGuard Inspection Routine -> 0x1000:0x0200
        self.set_vector(0x80, 0x1000, 0x0200)

    def raise_nmi(self) -> None:
        """Trigger Non-Maskable Interrupt (Type 2)."""
        self.pending_nmi = True

    def raise_intr(self, vector_num: int) -> None:
        """Trigger Maskable Hardware Interrupt (INTR)."""
        self.pending_intr = vector_num & 0xFF

    def check_and_service(self, cpu: Any) -> Optional[Dict[str, Any]]:
        """Check for pending interrupts and service highest priority.

        Priority order: 1) NMI, 2) INTR (if IF=1).
        """
        if self.pending_nmi:
            self.pending_nmi = False
            return self.service_interrupt(cpu, vector_num=2, source="NMI (Hardware Non-Maskable)")

        if self.pending_intr is not None:
            if cpu.registers.flags.if_flag == 1:
                vec = self.pending_intr
                self.pending_intr = None
                return self.service_interrupt(cpu, vector_num=vec, source=f"INTR (Hardware IRQ Vector 0x{vec:02X})")
            # If IF == 0, interrupt remains pending in controller latch

        return None

    def service_interrupt(self, cpu: Any, vector_num: int, source: str) -> Dict[str, Any]:
        """Execute full 8086 interrupt entry protocol:

        1. Push FLAGS to stack
        2. Clear IF and TF
        3. Push CS to stack
        4. Push IP to stack
        5. Load CS and IP from IVT entry (vector * 4)
        """
        regs = cpu.registers
        old_cs = regs.cs
        old_ip = regs.ip
        old_flags = regs.flags.value

        # Push FLAGS (SP -= 2, write word)
        regs.sp = (regs.sp - 2) & 0xFFFF
        self.memory.write_seg_word(regs.ss, regs.sp, old_flags)

        # Clear IF and TF
        regs.flags.if_flag = 0
        regs.flags.tf = 0

        # Push CS
        regs.sp = (regs.sp - 2) & 0xFFFF
        self.memory.write_seg_word(regs.ss, regs.sp, old_cs)

        # Push IP
        regs.sp = (regs.sp - 2) & 0xFFFF
        self.memory.write_seg_word(regs.ss, regs.sp, old_ip)

        # Vector address lookup
        target_cs, target_ip = self.get_vector(vector_num)
        regs.cs = target_cs
        regs.ip = target_ip

        # Flush prefetch queue in BIU because execution jumps to ISR
        cpu.flush_prefetch_queue()

        entry = {
            "source": source,
            "vector": vector_num,
            "vector_hex": f"0x{vector_num:02X}",
            "vector_paddr": f"0x{vector_num * 4:05X}",
            "saved_cs": f"0x{old_cs:04X}",
            "saved_ip": f"0x{old_ip:04X}",
            "saved_flags": f"0x{old_flags:04X}",
            "isr_cs": f"0x{target_cs:04X}",
            "isr_ip": f"0x{target_ip:04X}",
            "isr_physical": f"0x{self.memory.calc_physical_address(target_cs, target_ip):05X}",
            "new_sp": f"0x{regs.sp:04X}",
        }
        self.history.append(entry)
        return entry

    def return_from_interrupt(self, cpu: Any) -> Dict[str, Any]:
        """Execute IRET instruction:

        1. Pop IP from stack
        2. Pop CS from stack
        3. Pop FLAGS from stack
        """
        regs = cpu.registers
        # Pop IP
        restored_ip = self.memory.read_seg_word(regs.ss, regs.sp)
        regs.sp = (regs.sp + 2) & 0xFFFF
        # Pop CS
        restored_cs = self.memory.read_seg_word(regs.ss, regs.sp)
        regs.sp = (regs.sp + 2) & 0xFFFF
        # Pop FLAGS
        restored_flags = self.memory.read_seg_word(regs.ss, regs.sp)
        regs.sp = (regs.sp + 2) & 0xFFFF

        regs.ip = restored_ip
        regs.cs = restored_cs
        regs.flags.value = restored_flags

        # Flush prefetch queue
        cpu.flush_prefetch_queue()

        return {
            "action": "IRET",
            "restored_cs": f"0x{restored_cs:04X}",
            "restored_ip": f"0x{restored_ip:04X}",
            "restored_flags": f"0x{restored_flags:04X}",
            "restored_sp": f"0x{regs.sp:04X}",
        }

    def get_ivt_summary(self, max_vectors: int = 16) -> List[Dict[str, Any]]:
        """Return table of active IVT vectors."""
        table: List[Dict[str, Any]] = []
        for v in range(max_vectors):
            seg, off = self.get_vector(v)
            paddr = self.memory.calc_physical_address(seg, off)
            names = {
                0: "Divide Error (Type 0)",
                1: "Single Step / Trap (Type 1)",
                2: "NMI Non-Maskable (Type 2)",
                3: "Breakpoint INT 3 (Type 3)",
                4: "Overflow INTO (Type 4)",
                8: "System Timer IRQ0 (Type 8)",
                9: "Proximity Sensor IRQ1 (Type 9)",
            }
            table.append({
                "vector": v,
                "hex": f"0x{v:02X}",
                "ivt_addr": f"0x{v * 4:05X}",
                "isr_segment": f"0x{seg:04X}",
                "isr_offset": f"0x{off:04X}",
                "isr_physical": f"0x{paddr:05X}",
                "name": names.get(v, f"User Vector {v}"),
            })
        return table
