from typing import Any, Dict, List, Tuple


class Memory8086:
    """1 MB Segmented Physical Memory Subsystem for Intel 8086.

    Physical address space: 20 bits (0x00000 to 0xFFFFF = 1,048,576 bytes).
    Address Translation: Physical Address = ((Segment * 16) + Offset) mod 2^20.
    Storage format: Byte-addressable with little-endian 16-bit word organization.
    """

    MEMORY_SIZE = 1024 * 1024  # 1 MB = 1,048,576 bytes
    ADDRESS_MASK = 0xFFFFF      # 20-bit address wrap-around

    def __init__(self):
        self._memory = bytearray(self.MEMORY_SIZE)
        self.last_accessed_addr: int | None = None
        self.last_access_type: str | None = None  # "READ" or "WRITE"

    def reset(self) -> None:
        """Clear all memory to 0x00."""
        self._memory = bytearray(self.MEMORY_SIZE)
        self.last_accessed_addr = None
        self.last_access_type = None

    @classmethod
    def calc_physical_address(cls, segment: int, offset: int) -> int:
        """Calculate 20-bit physical address from 16-bit segment and offset.

        Formula: Physical Address = ((Segment << 4) + Offset) & 0xFFFFF.
        """
        return ((segment << 4) + offset) & cls.ADDRESS_MASK

    # -------------------------------------------------------------------------
    # Physical Address Byte & Word Access
    # -------------------------------------------------------------------------

    def read_byte(self, physical_addr: int) -> int:
        addr = physical_addr & self.ADDRESS_MASK
        self.last_accessed_addr = addr
        self.last_access_type = "READ"
        return self._memory[addr]

    def write_byte(self, physical_addr: int, val: int) -> None:
        addr = physical_addr & self.ADDRESS_MASK
        self.last_accessed_addr = addr
        self.last_access_type = "WRITE"
        self._memory[addr] = val & 0xFF

    def read_word(self, physical_addr: int) -> int:
        """Read 16-bit word in little-endian order (low byte, high byte)."""
        addr0 = physical_addr & self.ADDRESS_MASK
        addr1 = (physical_addr + 1) & self.ADDRESS_MASK
        low = self._memory[addr0]
        high = self._memory[addr1]
        self.last_accessed_addr = addr0
        self.last_access_type = "READ"
        return (high << 8) | low

    def write_word(self, physical_addr: int, val: int) -> None:
        """Write 16-bit word in little-endian order."""
        addr0 = physical_addr & self.ADDRESS_MASK
        addr1 = (physical_addr + 1) & self.ADDRESS_MASK
        self._memory[addr0] = val & 0xFF
        self._memory[addr1] = (val >> 8) & 0xFF
        self.last_accessed_addr = addr0
        self.last_access_type = "WRITE"

    # -------------------------------------------------------------------------
    # Segment:Offset Accessors
    # -------------------------------------------------------------------------

    def read_seg_byte(self, segment: int, offset: int) -> int:
        paddr = self.calc_physical_address(segment, offset)
        return self.read_byte(paddr)

    def write_seg_byte(self, segment: int, offset: int, val: int) -> None:
        paddr = self.calc_physical_address(segment, offset)
        self.write_byte(paddr, val)

    def read_seg_word(self, segment: int, offset: int) -> int:
        paddr = self.calc_physical_address(segment, offset)
        return self.read_word(paddr)

    def write_seg_word(self, segment: int, offset: int, val: int) -> None:
        paddr = self.calc_physical_address(segment, offset)
        self.write_word(paddr, val)

    def write_bytes(self, physical_addr: int, data: bytes | bytearray | list[int]) -> None:
        """Bulk write sequence of bytes into memory."""
        for i, b in enumerate(data):
            self.write_byte(physical_addr + i, b)

    # -------------------------------------------------------------------------
    # Inspection & Diagnostics Views
    # -------------------------------------------------------------------------

    def get_memory_dump(self, segment: int, offset: int, count: int = 64) -> List[Dict[str, Any]]:
        """Return formatted 16-byte memory rows with hex and ASCII representations."""
        paddr_base = self.calc_physical_address(segment, offset)
        # Align to 16 bytes
        start_addr = paddr_base & ~0x0F
        num_rows = max(1, (count + 15) // 16)
        rows: List[Dict[str, Any]] = []

        for r in range(num_rows):
            row_paddr = (start_addr + (r * 16)) & self.ADDRESS_MASK
            row_offset = (offset & ~0x0F) + (r * 16)
            byte_values: List[int] = []
            hex_strings: List[str] = []
            ascii_chars: List[str] = []

            for col in range(16):
                byte_addr = (row_paddr + col) & self.ADDRESS_MASK
                b = self._memory[byte_addr]
                byte_values.append(b)
                hex_strings.append(f"{b:02X}")
                ascii_chars.append(chr(b) if 32 <= b <= 126 else ".")

            rows.append({
                "segment": f"0x{segment:04X}",
                "offset": f"0x{row_offset:04X}",
                "physical_address": f"0x{row_paddr:05X}",
                "bytes": byte_values,
                "hex_view": " ".join(hex_strings),
                "ascii_view": "".join(ascii_chars),
            })

        return rows

    def get_stack_view(self, ss: int, sp: int, depth: int = 8) -> List[Dict[str, Any]]:
        """Inspect stack memory slots starting from SS:SP upwards towards top of stack."""
        frames: List[Dict[str, Any]] = []
        for i in range(depth):
            curr_offset = (sp + (i * 2)) & 0xFFFF
            paddr = self.calc_physical_address(ss, curr_offset)
            val = self.read_word(paddr)
            frames.append({
                "depth_index": i,
                "offset": f"0x{curr_offset:04X}",
                "physical": f"0x{paddr:05X}",
                "word_value": val,
                "hex_word": f"0x{val:04X}",
                "low_byte": f"0x{val & 0xFF:02X}",
                "high_byte": f"0x{(val >> 8) & 0xFF:02X}",
            })
        return frames
