import time
from typing import Any, Dict, List, Optional
from backend.app.deam.inspection_decision import SAMPLE_FLAG_MAP
from backend.app.microprocessor.cpu8086 import CPU8086
from backend.app.microprocessor.example_programs import EXAMPLE_PROGRAMS


class MicroprocessorService:
    """Session orchestration service for independent 8086 CPU and 8255 PPI simulation sessions."""

    def __init__(self):
        self._sessions: Dict[str, CPU8086] = {}
        # Pre-seed a default session
        self.get_or_create_session("default")

    def get_or_create_session(self, session_id: str) -> CPU8086:
        if session_id not in self._sessions:
            self._sessions[session_id] = CPU8086(session_id=session_id)
        return self._sessions[session_id]

    def get_session(self, session_id: str) -> CPU8086:
        if session_id not in self._sessions:
            raise KeyError(f"Simulation session '{session_id}' not found.")
        return self._sessions[session_id]

    def reset_session(self, session_id: str) -> Dict[str, Any]:
        cpu = self.get_or_create_session(session_id)
        cpu.reset()
        return cpu.get_full_state()

    def assemble_and_load(
        self, session_id: str, source_code: str, base_offset: int = 0x0000
    ) -> Dict[str, Any]:
        cpu = self.get_or_create_session(session_id)
        res = cpu.load_assembly_program(source_code, base_offset=base_offset)
        res["full_state"] = cpu.get_full_state()
        return res

    def step(self, session_id: str) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        step_result = cpu.step()
        return {
            "step": step_result,
            "full_state": cpu.get_full_state(),
        }

    def run(self, session_id: str, max_steps: int = 500) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        run_res = cpu.run(max_steps=max_steps)
        run_res["full_state"] = cpu.get_full_state()
        return run_res

    def get_state(self, session_id: str) -> Dict[str, Any]:
        cpu = self.get_or_create_session(session_id)
        return cpu.get_full_state()

    def get_memory_dump(
        self, session_id: str, segment: int, offset: int, count: int = 64
    ) -> List[Dict[str, Any]]:
        cpu = self.get_session(session_id)
        return cpu.memory.get_memory_dump(segment, offset, count=count)

    def get_stack_view(self, session_id: str, depth: int = 8) -> List[Dict[str, Any]]:
        cpu = self.get_session(session_id)
        return cpu.memory.get_stack_view(cpu.registers.ss, cpu.registers.sp, depth=depth)

    # -------------------------------------------------------------------------
    # PPI Methods
    # -------------------------------------------------------------------------

    def configure_ppi(self, session_id: str, control_word: int) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        res = cpu.ppi.write_control(control_word)
        res["ppi_state"] = cpu.ppi.to_dict()
        return res

    def write_ppi_port(self, session_id: str, port: str, val: int) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        cpu.ppi.write_port(port, val)
        return cpu.ppi.to_dict()

    def import_vision_flags(
        self,
        session_id: str,
        d: int = 1,
        s: int = 0,
        c: int = 1,
        l: int = 1,
        m: int = 1,
        g: int = 1,
    ) -> Dict[str, Any]:
        """Import OpenCV binary flags into 8255 Port A for 8086 IN instruction reading."""
        cpu = self.get_session(session_id)
        word = cpu.ppi.import_vision_flags(d=d, s=s, c=c, l=l, m=m, g=g)
        return {
            "imported_word": word,
            "hex": f"0x{word:02X}",
            "binary": f"{word:08b}",
            "flags": {"D": d, "S": s, "C": c, "L": l, "M": m, "G": g},
            "ppi_state": cpu.ppi.to_dict(),
        }

    def import_sample_flags(self, session_id: str, sample_id: str) -> Dict[str, Any]:
        """Look up benchmark flags for synthetic workpiece VG-001..VG-006 and load into Port A."""
        flags = SAMPLE_FLAG_MAP.get(sample_id.upper(), {"d": 1, "s": 0, "c": 1, "l": 1, "m": 1, "g": 1})
        res = self.import_vision_flags(
            session_id=session_id,
            d=flags["d"],
            s=flags["s"],
            c=flags["c"],
            l=flags["l"],
            m=flags["m"],
            g=flags["g"],
        )
        res["sample_id"] = sample_id
        return res

    # -------------------------------------------------------------------------
    # Interrupts & Timers
    # -------------------------------------------------------------------------

    def raise_interrupt(
        self, session_id: str, int_type: str = "INTR", vector: int = 8
    ) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        if int_type.upper() == "NMI":
            cpu.interrupts.raise_nmi()
            return {"status": "NMI Raised", "type": "NMI", "vector": 2}
        else:
            cpu.interrupts.raise_intr(vector)
            return {
                "status": "INTR Raised",
                "type": "INTR",
                "vector": vector,
                "if_flag": cpu.registers.flags.if_flag,
                "will_service_immediately": cpu.registers.flags.if_flag == 1,
            }

    def configure_timer(
        self, session_id: str, mode: int = 0, count: int = 10
    ) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        return cpu.timers.configure(mode=mode, count=count)

    def tick_timer(self, session_id: str, ticks: int = 1) -> Dict[str, Any]:
        cpu = self.get_session(session_id)
        return cpu.timers.tick(count=ticks)

    def get_example_programs(self) -> Dict[str, Any]:
        return EXAMPLE_PROGRAMS


microprocessor_service = MicroprocessorService()
