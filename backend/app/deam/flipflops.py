from typing import Any, Dict, List, Optional
from backend.app.deam.logic_gates import validate_bit


def simulate_sr_flipflop(
    s: int,
    r: int,
    q_current: int,
    clock: int = 1,
    async_set: int = 0,
    async_reset: int = 0,
) -> Dict[str, Any]:
    """Simulate SR (Set-Reset) Flip-Flop with invalid condition handling and async pins."""
    s_b = validate_bit(s)
    r_b = validate_bit(r)
    q_b = validate_bit(q_current)
    clk = validate_bit(clock)
    aset = validate_bit(async_set)
    ares = validate_bit(async_reset)

    # Asynchronous priority overrides
    if aset == 1 and ares == 1:
        return {
            "type": "SR",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": None,
            "q_bar_next": None,
            "operation": "INVALID_ASYNC",
            "details": "Simultaneous Asynchronous Preset and Clear is prohibited.",
            "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
        }
    if aset == 1:
        return {
            "type": "SR",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": 1,
            "q_bar_next": 0,
            "operation": "ASYNC_SET",
            "details": "Asynchronous Preset forced Q to 1.",
            "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
        }
    if ares == 1:
        return {
            "type": "SR",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": 0,
            "q_bar_next": 1,
            "operation": "ASYNC_RESET",
            "details": "Asynchronous Clear forced Q to 0.",
            "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
        }

    # Clock edge verification
    if clk == 0:
        return {
            "type": "SR",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": q_b,
            "q_bar_next": 1 - q_b,
            "operation": "NO_CLOCK (HOLD)",
            "details": "Clock is inactive (LOW). Previous state maintained.",
            "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
        }

    # Synchronous evaluation on active clock
    if s_b == 0 and r_b == 0:
        q_next = q_b
        op = "HOLD"
        details = "No change: state retained."
    elif s_b == 0 and r_b == 1:
        q_next = 0
        op = "RESET"
        details = "Reset: Q forced to 0."
    elif s_b == 1 and r_b == 0:
        q_next = 1
        op = "SET"
        details = "Set: Q forced to 1."
    else:  # s_b == 1 and r_b == 1
        return {
            "type": "SR",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": None,
            "q_bar_next": None,
            "operation": "INVALID_STATE",
            "details": "Forbidden condition (S=1, R=1). Both outputs attempt to be 0/indeterminate race hazard.",
            "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
        }

    return {
        "type": "SR",
        "inputs": {"S": s_b, "R": r_b, "Clock": clk},
        "q_current": q_b,
        "q_bar_current": 1 - q_b,
        "q_next": q_next,
        "q_bar_next": 1 - q_next,
        "operation": op,
        "details": details,
        "characteristic_equation": "Q(next) = S + ¬R·Q (with S·R = 0)",
    }


def simulate_jk_flipflop(
    j: int,
    k: int,
    q_current: int,
    clock: int = 1,
) -> Dict[str, Any]:
    """Simulate JK Flip-Flop (resolves SR invalid state via toggle)."""
    j_b = validate_bit(j)
    k_b = validate_bit(k)
    q_b = validate_bit(q_current)
    clk = validate_bit(clock)

    if clk == 0:
        return {
            "type": "JK",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": q_b,
            "q_bar_next": 1 - q_b,
            "operation": "NO_CLOCK (HOLD)",
            "details": "Clock is inactive (LOW). Previous state maintained.",
            "characteristic_equation": "Q(next) = J·¬Q + ¬K·Q",
        }

    if j_b == 0 and k_b == 0:
        q_next = q_b
        op = "HOLD"
        details = "Hold: previous state retained."
    elif j_b == 0 and k_b == 1:
        q_next = 0
        op = "RESET"
        details = "Reset: Q forced to 0."
    elif j_b == 1 and k_b == 0:
        q_next = 1
        op = "SET"
        details = "Set: Q forced to 1."
    else:  # j_b == 1 and k_b == 1
        q_next = 1 - q_b
        op = "TOGGLE"
        details = "Toggle: state inverted (Q becomes ¬Q)."

    return {
        "type": "JK",
        "inputs": {"J": j_b, "K": k_b, "Clock": clk},
        "q_current": q_b,
        "q_bar_current": 1 - q_b,
        "q_next": q_next,
        "q_bar_next": 1 - q_next,
        "operation": op,
        "details": details,
        "characteristic_equation": "Q(next) = J·¬Q + ¬K·Q",
    }


def simulate_d_flipflop(
    d: int,
    q_current: int,
    clock: int = 1,
) -> Dict[str, Any]:
    """Simulate D (Data/Delay) Flip-Flop."""
    d_b = validate_bit(d)
    q_b = validate_bit(q_current)
    clk = validate_bit(clock)

    if clk == 0:
        return {
            "type": "D",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": q_b,
            "q_bar_next": 1 - q_b,
            "operation": "NO_CLOCK (HOLD)",
            "details": "Clock is inactive (LOW). Previous state maintained.",
            "characteristic_equation": "Q(next) = D",
        }

    q_next = d_b
    op = "TRANSFER"
    details = f"Data latch: Q(next) captured D input value ({d_b})."

    return {
        "type": "D",
        "inputs": {"D": d_b, "Clock": clk},
        "q_current": q_b,
        "q_bar_current": 1 - q_b,
        "q_next": q_next,
        "q_bar_next": 1 - q_next,
        "operation": op,
        "details": details,
        "characteristic_equation": "Q(next) = D",
    }


def simulate_t_flipflop(
    t: int,
    q_current: int,
    clock: int = 1,
) -> Dict[str, Any]:
    """Simulate T (Toggle) Flip-Flop."""
    t_b = validate_bit(t)
    q_b = validate_bit(q_current)
    clk = validate_bit(clock)

    if clk == 0:
        return {
            "type": "T",
            "q_current": q_b,
            "q_bar_current": 1 - q_b,
            "q_next": q_b,
            "q_bar_next": 1 - q_b,
            "operation": "NO_CLOCK (HOLD)",
            "details": "Clock is inactive (LOW). Previous state maintained.",
            "characteristic_equation": "Q(next) = T ⊕ Q",
        }

    q_next = q_b ^ t_b
    op = "TOGGLE" if t_b == 1 else "HOLD"
    details = "State inverted (toggle)." if t_b == 1 else "State retained (T=0)."

    return {
        "type": "T",
        "inputs": {"T": t_b, "Clock": clk},
        "q_current": q_b,
        "q_bar_current": 1 - q_b,
        "q_next": q_next,
        "q_bar_next": 1 - q_next,
        "operation": op,
        "details": details,
        "characteristic_equation": "Q(next) = T ⊕ Q",
    }
