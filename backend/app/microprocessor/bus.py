from typing import Any, Dict, List


class SystemBus8086:
    """Educational 8086 Demultiplexed Bus Subsystem.

    Models:
      - 20-bit Address Bus (A0 - A19)
      - 16-bit Data Bus (D0 - D15)
      - Active Control Bus Lines: ALE, MEMR, MEMW, IOR, IOW, DEN, DT_R, INTR, NMI
    """

    def __init__(self, history_limit: int = 32):
        self.history_limit = history_limit
        self.address_bus: int = 0x00000
        self.data_bus: int = 0x0000
        self.control_signals: Dict[str, int] = {
            "ALE": 0,
            "MEMR": 0,
            "MEMW": 0,
            "IOR": 0,
            "IOW": 0,
            "DEN": 0,
            "DT_R": 0,
            "INTR": 0,
            "NMI": 0,
        }
        self.last_transaction_type: str = "IDLE"
        self.history: List[Dict[str, Any]] = []
        self.cycle_count: int = 0

    def reset(self) -> None:
        self.address_bus = 0x00000
        self.data_bus = 0x0000
        for k in self.control_signals:
            self.control_signals[k] = 0
        self.last_transaction_type = "IDLE"
        self.history = []
        self.cycle_count = 0

    def record_transaction(
        self,
        trans_type: str,
        address: int,
        data: int,
        signals: Dict[str, int],
        description: str = "",
    ) -> Dict[str, Any]:
        self.cycle_count += 1
        self.address_bus = address & 0xFFFFF
        self.data_bus = data & 0xFFFF
        self.last_transaction_type = trans_type
        for k, v in signals.items():
            if k in self.control_signals:
                self.control_signals[k] = v

        entry = {
            "cycle": self.cycle_count,
            "type": trans_type,
            "address": f"0x{self.address_bus:05X}",
            "data": f"0x{self.data_bus:04X}",
            "control_signals": dict(self.control_signals),
            "description": description,
        }
        self.history.append(entry)
        if len(self.history) > self.history_limit:
            self.history.pop(0)
        return entry

    def fetch_cycle(self, physical_addr: int, byte_val: int) -> Dict[str, Any]:
        return self.record_transaction(
            trans_type="INSTRUCTION_FETCH",
            address=physical_addr,
            data=byte_val,
            signals={"ALE": 1, "MEMR": 1, "MEMW": 0, "IOR": 0, "IOW": 0, "DEN": 1, "DT_R": 0},
            description=f"BIU prefetched byte 0x{byte_val:02X} from 0x{physical_addr:05X}",
        )

    def memory_read(self, physical_addr: int, word_val: int, is_16bit: bool = True) -> Dict[str, Any]:
        return self.record_transaction(
            trans_type="MEMORY_READ",
            address=physical_addr,
            data=word_val,
            signals={"ALE": 1, "MEMR": 1, "MEMW": 0, "IOR": 0, "IOW": 0, "DEN": 1, "DT_R": 0},
            description=f"Read {'word 0x' + f'{word_val:04X}' if is_16bit else 'byte 0x' + f'{word_val:02X}'} from 0x{physical_addr:05X}",
        )

    def memory_write(self, physical_addr: int, word_val: int, is_16bit: bool = True) -> Dict[str, Any]:
        return self.record_transaction(
            trans_type="MEMORY_WRITE",
            address=physical_addr,
            data=word_val,
            signals={"ALE": 1, "MEMR": 0, "MEMW": 1, "IOR": 0, "IOW": 0, "DEN": 1, "DT_R": 1},
            description=f"Wrote {'word 0x' + f'{word_val:04X}' if is_16bit else 'byte 0x' + f'{word_val:02X}'} to 0x{physical_addr:05X}",
        )

    def io_read(self, port_addr: int, val: int) -> Dict[str, Any]:
        return self.record_transaction(
            trans_type="IO_READ",
            address=port_addr,
            data=val,
            signals={"ALE": 1, "MEMR": 0, "MEMW": 0, "IOR": 1, "IOW": 0, "DEN": 1, "DT_R": 0},
            description=f"IN: Read byte 0x{val:02X} from I/O Port 0x{port_addr:02X}",
        )

    def io_write(self, port_addr: int, val: int) -> Dict[str, Any]:
        return self.record_transaction(
            trans_type="IO_WRITE",
            address=port_addr,
            data=val,
            signals={"ALE": 1, "MEMR": 0, "MEMW": 0, "IOR": 0, "IOW": 1, "DEN": 1, "DT_R": 1},
            description=f"OUT: Wrote byte 0x{val:02X} to I/O Port 0x{port_addr:02X}",
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "address_bus": f"0x{self.address_bus:05X}",
            "data_bus": f"0x{self.data_bus:04X}",
            "control_signals": self.control_signals,
            "last_transaction": self.last_transaction_type,
            "cycle_count": self.cycle_count,
            "recent_history": self.history[-8:],
        }
