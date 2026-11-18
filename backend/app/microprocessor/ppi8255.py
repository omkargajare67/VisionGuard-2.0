from typing import Any, Dict


class PPI8255:
    """Intel 8255 Programmable Peripheral Interface (PPI) Simulation.

    Provides three 8-bit ports (A, B, C) and a Control Word register.
    Supports Mode 0 (Basic I/O), Mode 1 (Strobed I/O), and BSR (Bit Set/Reset) mode.
    Integrated with VisionGuard: Port A ingests optical flags; Port B drives sorting actuators.
    """

    DEFAULT_BASE_ADDR = 0x80  # Port A: 80H, Port B: 81H, Port C: 82H, Control: 83H

    def __init__(self, base_addr: int = DEFAULT_BASE_ADDR):
        self.base_addr = base_addr
        self.reset()

    def reset(self) -> None:
        """Reset PPI to power-on default: all ports Mode 0 Input (Control Word = 0x9B)."""
        self.port_a_dir = "IN"       # "IN" or "OUT"
        self.port_b_dir = "IN"       # "IN" or "OUT"
        self.port_c_upper_dir = "IN" # "IN" or "OUT"
        self.port_c_lower_dir = "IN" # "IN" or "OUT"
        self.mode_group_a = 0        # 0 = Mode 0, 1 = Mode 1
        self.mode_group_b = 0        # 0 = Mode 0, 1 = Mode 1

        # Port latch/external signal states (8 bits each)
        self._port_a_in = 0x00
        self._port_a_out = 0x00
        self._port_b_in = 0x00
        self._port_b_out = 0x00
        self._port_c_in = 0x00
        self._port_c_out = 0x00

        self.control_word = 0x9B     # 10011011b (All ports input, Mode 0)
        self.last_bsr_action: str | None = None

        # Mode 1 Handshake registers
        self.mode1_handshake = {
            "STB_A": 1,  # Active-low strobe input for Port A
            "IBF_A": 0,  # Input Buffer Full flag
            "INTR_A": 0, # Interrupt request to 8086
            "OBF_B": 1,  # Active-low Output Buffer Full for Port B
            "ACK_B": 1,  # Active-low Acknowledge input for Port B
            "INTR_B": 0, # Interrupt request for Port B
        }

    # -------------------------------------------------------------------------
    # Control Word Processing
    # -------------------------------------------------------------------------

    def write_control(self, cw: int) -> Dict[str, Any]:
        """Write to Control Word Register.

        If D7 == 1: Mode Set Word.
        If D7 == 0: Bit Set/Reset (BSR) on Port C.
        """
        cw = cw & 0xFF
        if (cw & 0x80) != 0:
            # Mode Set Definition
            self.control_word = cw
            # Group A mode: bits 6 & 5
            mode_a_bits = (cw >> 5) & 0x03
            self.mode_group_a = 1 if mode_a_bits == 1 else 0
            # Port A dir: bit 4 (1 = Input, 0 = Output)
            self.port_a_dir = "IN" if ((cw >> 4) & 1) else "OUT"
            # Port C upper dir: bit 3 (1 = Input, 0 = Output)
            self.port_c_upper_dir = "IN" if ((cw >> 3) & 1) else "OUT"
            # Group B mode: bit 2 (0 = Mode 0, 1 = Mode 1)
            self.mode_group_b = 1 if ((cw >> 2) & 1) else 0
            # Port B dir: bit 1 (1 = Input, 0 = Output)
            self.port_b_dir = "IN" if ((cw >> 1) & 1) else "OUT"
            # Port C lower dir: bit 0 (1 = Input, 0 = Output)
            self.port_c_lower_dir = "IN" if (cw & 1) else "OUT"

            # Reset output latches on mode reconfigure
            self._port_a_out = 0x00
            self._port_b_out = 0x00
            self._port_c_out = 0x00
            self.last_bsr_action = None

            return {
                "type": "MODE_SET",
                "control_word_hex": f"0x{cw:02X}",
                "control_word_bin": f"{cw:08b}",
                "port_a_dir": self.port_a_dir,
                "port_b_dir": self.port_b_dir,
                "port_c_upper_dir": self.port_c_upper_dir,
                "port_c_lower_dir": self.port_c_lower_dir,
                "mode_group_a": f"Mode {self.mode_group_a}",
                "mode_group_b": f"Mode {self.mode_group_b}",
            }
        else:
            # BSR Mode: D7 = 0
            bit_to_alter = (cw >> 1) & 0x07
            set_reset = cw & 1  # 1 = Set, 0 = Reset
            if set_reset == 1:
                self._port_c_out |= (1 << bit_to_alter)
                action = f"SET Port C bit {bit_to_alter} to HIGH (1)"
            else:
                self._port_c_out &= ~(1 << bit_to_alter)
                action = f"RESET Port C bit {bit_to_alter} to LOW (0)"
            self._port_c_out &= 0xFF
            self.last_bsr_action = action

            return {
                "type": "BSR",
                "control_word_hex": f"0x{cw:02X}",
                "bit": bit_to_alter,
                "action": action,
                "port_c_current": f"0x{self._port_c_out:02X}",
            }

    # -------------------------------------------------------------------------
    # Port Read / Write for 8086 IN / OUT instructions
    # -------------------------------------------------------------------------

    def read_port(self, port_name: str) -> int:
        p = port_name.upper()
        if p == "A":
            if self.port_a_dir == "IN":
                val = self._port_a_in & 0xFF
                if self.mode_group_a == 1:
                    # In Mode 1 input: reading port clears IBF and INTR
                    self.mode1_handshake["IBF_A"] = 0
                    self.mode1_handshake["INTR_A"] = 0
                return val
            return self._port_a_out & 0xFF

        elif p == "B":
            if self.port_b_dir == "IN":
                val = self._port_b_in & 0xFF
                if self.mode_group_b == 1:
                    self.mode1_handshake["INTR_B"] = 0
                return val
            return self._port_b_out & 0xFF

        elif p == "C":
            # Combine input and output pins depending on direction of Upper / Lower
            val = 0
            # Lower (bits 0-3)
            if self.port_c_lower_dir == "IN":
                val |= (self._port_c_in & 0x0F)
            else:
                val |= (self._port_c_out & 0x0F)
            # Upper (bits 4-7)
            if self.port_c_upper_dir == "IN":
                val |= (self._port_c_in & 0xF0)
            else:
                val |= (self._port_c_out & 0xF0)

            # In Mode 1, overlay status flags on Port C pins
            if self.mode_group_a == 1:
                val = (val & ~0x30) | (self.mode1_handshake["IBF_A"] << 5) | (self.mode1_handshake["INTR_A"] << 3)
            return val & 0xFF

        else:
            raise ValueError(f"Unknown PPI port: '{port_name}'")

    def write_port(self, port_name: str, val: int) -> None:
        p = port_name.upper()
        val = val & 0xFF
        if p == "A":
            self._port_a_out = val
        elif p == "B":
            self._port_b_out = val
            if self.mode_group_b == 1:
                # Mode 1 output: CPU write asserts OBF (0) and clears INTR
                self.mode1_handshake["OBF_B"] = 0
                self.mode1_handshake["INTR_B"] = 0
        elif p == "C":
            self._port_c_out = val
        else:
            raise ValueError(f"Unknown PPI port: '{port_name}'")

    # -------------------------------------------------------------------------
    # I/O Address Bus Decoder (IN / OUT)
    # -------------------------------------------------------------------------

    def read_io(self, port_addr: int) -> int:
        offset = port_addr - self.base_addr
        if offset == 0:
            return self.read_port("A")
        elif offset == 1:
            return self.read_port("B")
        elif offset == 2:
            return self.read_port("C")
        elif offset == 3:
            return self.control_word
        else:
            return 0xFF

    def write_io(self, port_addr: int, val: int) -> None:
        offset = port_addr - self.base_addr
        if offset == 0:
            self.write_port("A", val)
        elif offset == 1:
            self.write_port("B", val)
        elif offset == 2:
            self.write_port("C", val)
        elif offset == 3:
            self.write_control(val)

    # -------------------------------------------------------------------------
    # External Physical/Vision Line Drivers
    # -------------------------------------------------------------------------

    def set_port_a_external_input(self, val: int) -> None:
        """Inject 8-bit electrical signal on Port A pins (e.g. from OpenCV camera flags)."""
        self._port_a_in = val & 0xFF
        if self.mode_group_a == 1:
            # Mode 1: external strobe latches input into buffer and asserts IBF + INTR
            self.mode1_handshake["IBF_A"] = 1
            self.mode1_handshake["INTR_A"] = 1

    def set_port_b_external_input(self, val: int) -> None:
        self._port_b_in = val & 0xFF

    def set_port_c_external_input(self, val: int) -> None:
        self._port_c_in = val & 0xFF

    # -------------------------------------------------------------------------
    # VisionGuard Specific Helper
    # -------------------------------------------------------------------------

    def configure_for_visionguard(self) -> None:
        """Configure standard VisionGuard sorting line profile:

        Port A: Input (80H) - ingests 6 OpenCV inspection flags.
        Port B: Output (81H) - drives sorting gate, conveyor, and LEDs.
        Port C: Mode 0 Basic I/O (82H).
        Control Word = 0x90 (10010000b: Mode 0, Port A=IN, Port B=OUT, Port C=OUT).
        """
        self.write_control(0x90)

    def import_vision_flags(
        self,
        d: int = 1,
        s: int = 0,
        c: int = 1,
        l: int = 1,
        m: int = 1,
        g: int = 1,
    ) -> int:
        """Encode 6 binary vision inspection flags into 8-bit Port A input word:

        PA0: D (Product detected)
        PA1: S (Surface defect / scratch)
        PA2: C (Components complete)
        PA3: L (Label present)
        PA4: M (Marking correct)
        PA5: G (Contour geometry OK)
        PA6-7: Reserved (0)
        """
        word = (
            (d & 1)
            | ((s & 1) << 1)
            | ((c & 1) << 2)
            | ((l & 1) << 3)
            | ((m & 1) << 4)
            | ((g & 1) << 5)
        )
        self.set_port_a_external_input(word)
        return word

    def get_port_b_actuator_signals(self) -> Dict[str, Any]:
        """Decode Port B outputs into VisionGuard actuator signals:

        PB0: Conveyor Motor (1 = RUN, 0 = STOP)
        PB1: Reject Gate Servo (1 = ACTUATE/DIVERT, 0 = PASS)
        PB2: Green LED (1 = PASS)
        PB3: Red LED (1 = REJECT)
        PB4: Defect Buzzer (1 = ALARM)
        PB5: System Busy (1 = BUSY)
        """
        val = self._port_b_out & 0xFF
        return {
            "raw_byte": val,
            "hex": f"0x{val:02X}",
            "binary": f"{val:08b}",
            "conveyor_motor": (val >> 0) & 1,
            "reject_gate": (val >> 1) & 1,
            "green_led": (val >> 2) & 1,
            "red_led": (val >> 3) & 1,
            "buzzer": (val >> 4) & 1,
            "busy": (val >> 5) & 1,
            "decision": "PASS" if ((val >> 2) & 1) else ("REJECT" if ((val >> 3) & 1) else "IDLE"),
        }

    def to_dict(self) -> Dict[str, Any]:
        curr_a = self.read_port("A")
        curr_b = self.read_port("B")
        curr_c = self.read_port("C")

        return {
            "base_address": f"0x{self.base_addr:02X}",
            "ports_mapping": {
                "PORT_A": f"0x{self.base_addr:02X}",
                "PORT_B": f"0x{self.base_addr + 1:02X}",
                "PORT_C": f"0x{self.base_addr + 2:02X}",
                "CONTROL": f"0x{self.base_addr + 3:02X}",
            },
            "control_word": {
                "hex": f"0x{self.control_word:02X}",
                "binary": f"{self.control_word:08b}",
                "last_bsr": self.last_bsr_action,
            },
            "configuration": {
                "port_a_direction": self.port_a_dir,
                "port_b_direction": self.port_b_dir,
                "port_c_upper_direction": self.port_c_upper_dir,
                "port_c_lower_direction": self.port_c_lower_dir,
                "group_a_mode": f"Mode {self.mode_group_a}",
                "group_b_mode": f"Mode {self.mode_group_b}",
            },
            "port_values": {
                "PORT_A": {"val": curr_a, "hex": f"0x{curr_a:02X}", "bin": f"{curr_a:08b}"},
                "PORT_B": {"val": curr_b, "hex": f"0x{curr_b:02X}", "bin": f"{curr_b:08b}"},
                "PORT_C": {"val": curr_c, "hex": f"0x{curr_c:02X}", "bin": f"{curr_c:08b}"},
            },
            "handshake_signals": self.mode1_handshake,
            "actuators": self.get_port_b_actuator_signals(),
        }
