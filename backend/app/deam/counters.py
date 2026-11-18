from typing import Any, Dict, List
from backend.app.deam.logic_gates import validate_bit


def simulate_counter_tick(
    counter_type: str,
    current_value: int,
    bits: int = 4,
    modulo: int = 16,
    enable: int = 1,
    reset: int = 0,
) -> Dict[str, Any]:
    """Execute a single clock tick on synchronous up, down, or modulo-N counters."""
    ctype = counter_type.lower()
    en = validate_bit(enable)
    rst = validate_bit(reset)

    max_val_by_bits = (1 << bits) - 1

    # Effective upper bound
    if ctype == "modulo":
        if modulo < 2 or modulo > (1 << bits):
            raise ValueError(f"Modulo N must be between 2 and {1 << bits} for {bits}-bit counter.")
        effective_mod = modulo
    else:
        effective_mod = 1 << bits

    # Reset behavior
    if rst == 1:
        next_val = 0
        overflow = 0
        underflow = 0
        op = "RESET"
    elif en == 0:
        next_val = current_value % effective_mod
        overflow = 0
        underflow = 0
        op = "HOLD"
    else:
        if ctype == "up":
            if current_value >= max_val_by_bits:
                next_val = 0
                overflow = 1
                underflow = 0
                op = "OVERFLOW_WRAP"
            else:
                next_val = current_value + 1
                overflow = 0
                underflow = 0
                op = "INCREMENT"
        elif ctype == "down":
            if current_value <= 0:
                next_val = max_val_by_bits
                overflow = 0
                underflow = 1
                op = "UNDERFLOW_WRAP"
            else:
                next_val = current_value - 1
                overflow = 0
                underflow = 0
                op = "DECREMENT"
        elif ctype == "modulo":
            if current_value >= (effective_mod - 1):
                next_val = 0
                overflow = 1
                underflow = 0
                op = "MODULO_ROLLOVER"
            else:
                next_val = current_value + 1
                overflow = 0
                underflow = 0
                op = "INCREMENT"
        else:
            raise ValueError(f"Unknown counter type: '{counter_type}'. Supported: 'up', 'down', 'modulo'.")

    # Format binary representation
    bin_str = format(next_val, f"0{bits}b")
    bin_list = [int(ch) for ch in bin_str]

    return {
        "counter_type": ctype,
        "bits": bits,
        "modulo": effective_mod,
        "enable": en,
        "reset": rst,
        "previous_value": current_value,
        "next_value": next_val,
        "binary_state": bin_list,
        "binary_string": bin_str,
        "overflow": overflow,
        "underflow": underflow,
        "terminal_count": 1 if (overflow or underflow or next_val == effective_mod - 1) else 0,
        "operation": op,
    }


def simulate_ripple_counter_demo(clock_pulses: int = 8, bits: int = 4) -> List[Dict[str, Any]]:
    """Educational demonstration of 4-bit Asynchronous (Ripple) Counter propagation."""
    trace = []
    # Flip-flops Q3, Q2, Q1, Q0 (Q0 is clocked by external Clock, Q1 by ¬Q0, etc.)
    q = [0] * bits
    for pulse in range(clock_pulses + 1):
        if pulse > 0:
            # Increment binary ripple
            for bit_idx in range(bits):
                q[bit_idx] ^= 1
                if q[bit_idx] == 1:
                    break  # ripple carry stops

        dec = sum(q[i] * (1 << i) for i in range(bits))
        trace.append({
            "clock_pulse": pulse,
            "q_bits": list(q),  # [Q0, Q1, Q2, Q3]
            "binary_msb_first": "".join(str(q[bits - 1 - i]) for i in range(bits)),
            "decimal_count": dec,
        })
    return trace
