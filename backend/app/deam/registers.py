from typing import Any, Dict, List, Optional, Tuple
from backend.app.deam.logic_gates import validate_bit


class ShiftRegister:
    """Configurable 4-bit / 8-bit Shift Register supporting SISO, SIPO, PISO, and PIPO modes."""

    def __init__(self, size: int = 4, initial_state: Optional[List[int]] = None):
        if size not in (4, 8):
            raise ValueError(f"Register size must be 4 or 8 bits (received {size}).")
        self.size = size
        if initial_state:
            if len(initial_state) != size:
                raise ValueError(f"Initial state length ({len(initial_state)}) does not match register size ({size}).")
            self.state = [validate_bit(b) for b in initial_state]
        else:
            self.state = [0] * size

    def parallel_load(self, parallel_data: List[int]) -> List[int]:
        """Load parallel word directly into register flip-flops (PIPO / PISO load)."""
        if len(parallel_data) != self.size:
            raise ValueError(f"Parallel data length ({len(parallel_data)}) must match size ({self.size}).")
        self.state = [validate_bit(b) for b in parallel_data]
        return list(self.state)

    def clock_shift_right(self, serial_in: int) -> Tuple[int, List[int]]:
        """Clock edge: Shift right by 1 bit, insert serial_in at MSB, shift out LSB."""
        s_in = validate_bit(serial_in)
        serial_out = self.state[-1]  # LSB pushed out
        # Shift: [s_in, state[0], state[1], ..., state[n-2]]
        self.state = [s_in] + self.state[:-1]
        return serial_out, list(self.state)

    def clock_shift_left(self, serial_in: int) -> Tuple[int, List[int]]:
        """Clock edge: Shift left by 1 bit, insert serial_in at LSB, shift out MSB."""
        s_in = validate_bit(serial_in)
        serial_out = self.state[0]  # MSB pushed out
        # Shift: [state[1], state[2], ..., s_in]
        self.state = self.state[1:] + [s_in]
        return serial_out, list(self.state)


def simulate_register_step(
    reg_type: str,
    current_state: List[int],
    serial_in: int = 0,
    parallel_in: Optional[List[int]] = None,
    shift_dir: str = "right",
    load_parallel: bool = False,
) -> Dict[str, Any]:
    """Execute a single clock transition / operation on a shift register."""
    mode = reg_type.upper()
    if mode not in ("SISO", "SIPO", "PISO", "PIPO"):
        raise ValueError(f"Invalid register type: '{reg_type}'. Must be SISO, SIPO, PISO, or PIPO.")

    reg = ShiftRegister(size=len(current_state), initial_state=current_state)
    prev_state = list(reg.state)

    if load_parallel and parallel_in:
        new_state = reg.parallel_load(parallel_in)
        serial_out = new_state[-1] if shift_dir == "right" else new_state[0]
        operation = "PARALLEL_LOAD"
    else:
        if shift_dir == "right":
            serial_out, new_state = reg.clock_shift_right(serial_in)
            operation = "SHIFT_RIGHT"
        else:
            serial_out, new_state = reg.clock_shift_left(serial_in)
            operation = "SHIFT_LEFT"

    # Mode-specific output visibility
    if mode == "SISO":
        visible_output = {"serial_out": serial_out}
    elif mode == "SIPO":
        visible_output = {"parallel_out": new_state, "serial_out": serial_out}
    elif mode == "PISO":
        visible_output = {"serial_out": serial_out}
    else:  # PIPO
        visible_output = {"parallel_out": new_state}

    return {
        "reg_type": mode,
        "size": reg.size,
        "operation": operation,
        "previous_state": prev_state,
        "serial_in": validate_bit(serial_in),
        "parallel_in": [validate_bit(b) for b in parallel_in] if parallel_in else None,
        "current_state": new_state,
        "outputs": visible_output,
        "binary_representation": "".join(str(b) for b in new_state),
        "decimal_value": sum(b << (reg.size - 1 - i) for i, b in enumerate(new_state)),
    }
