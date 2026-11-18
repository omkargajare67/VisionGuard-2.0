from typing import Any, Dict, Optional, Tuple
from backend.app.microprocessor.registers8086 import FlagsRegister


def compute_parity_flag(val: int) -> int:
    """Parity is set if the least-significant byte (bits 0-7) has an even number of 1 bits."""
    low_byte = val & 0xFF
    ones_count = bin(low_byte).count("1")
    return 1 if (ones_count % 2 == 0) else 0


class ALU8086:
    """Educational 8086 Arithmetic & Logic Unit (ALU).

    Performs 8-bit and 16-bit arithmetic and bitwise logical operations,
    evaluating conditional flags: CF, PF, AF, ZF, SF, OF.
    """

    @classmethod
    def execute(
        cls,
        operation: str,
        op1: int,
        op2: Optional[int],
        flags: FlagsRegister,
        is_16bit: bool = True,
    ) -> Tuple[int, Dict[str, Any]]:
        """Execute an ALU operation on 8-bit or 16-bit operands and update flags.

        Returns (result, trace_details_dict).
        """
        op = operation.upper()
        mask = 0xFFFF if is_16bit else 0xFF
        sign_bit = 0x8000 if is_16bit else 0x80
        bits = 16 if is_16bit else 8

        op1 = op1 & mask
        if op2 is not None:
            op2 = op2 & mask

        res = 0
        carry = flags.cf
        aux_carry = flags.af
        overflow = flags.of
        prev_flags = flags.to_dict()["flags"]

        calc_str = ""

        if op == "ADD":
            assert op2 is not None
            full_res = op1 + op2
            res = full_res & mask
            carry = 1 if full_res > mask else 0
            # AF: carry out of bit 3
            aux_carry = 1 if ((op1 & 0x0F) + (op2 & 0x0F)) > 0x0F else 0
            # OF: signed overflow
            overflow = 1 if (~(op1 ^ op2) & (op1 ^ res) & sign_bit) != 0 else 0
            calc_str = f"ADD: 0x{op1:04X} + 0x{op2:04X} = 0x{res:04X} (Carry: {carry})"

            flags.cf = carry
            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op == "ADC":
            assert op2 is not None
            c_in = flags.cf
            full_res = op1 + op2 + c_in
            res = full_res & mask
            carry = 1 if full_res > mask else 0
            aux_carry = 1 if ((op1 & 0x0F) + (op2 & 0x0F) + c_in) > 0x0F else 0
            overflow = 1 if (~(op1 ^ op2) & (op1 ^ res) & sign_bit) != 0 else 0
            calc_str = f"ADC: 0x{op1:04X} + 0x{op2:04X} + CF({c_in}) = 0x{res:04X}"

            flags.cf = carry
            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op in ("SUB", "CMP"):
            assert op2 is not None
            full_res = op1 - op2
            res = full_res & mask
            carry = 1 if op1 < op2 else 0
            aux_carry = 1 if (op1 & 0x0F) < (op2 & 0x0F) else 0
            overflow = 1 if ((op1 ^ op2) & (op1 ^ res) & sign_bit) != 0 else 0
            calc_str = f"{op}: 0x{op1:04X} - 0x{op2:04X} = 0x{res:04X} (Borrow: {carry})"

            flags.cf = carry
            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

            if op == "CMP":
                # CMP performs subtraction solely to set flags; does not write back result
                res = op1

        elif op in ("SBB",):
            assert op2 is not None
            b_in = flags.cf
            full_res = op1 - op2 - b_in
            res = full_res & mask
            carry = 1 if (op1 < op2 + b_in) else 0
            aux_carry = 1 if (op1 & 0x0F) < ((op2 & 0x0F) + b_in) else 0
            overflow = 1 if ((op1 ^ op2) & (op1 ^ res) & sign_bit) != 0 else 0
            calc_str = f"SBB: 0x{op1:04X} - 0x{op2:04X} - CF({b_in}) = 0x{res:04X}"

            flags.cf = carry
            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op == "INC":
            full_res = op1 + 1
            res = full_res & mask
            # INC affects AF, OF, PF, SF, ZF, but NOT CF
            aux_carry = 1 if ((op1 & 0x0F) + 1) > 0x0F else 0
            overflow = 1 if op1 == (sign_bit - 1) else 0
            calc_str = f"INC: 0x{op1:04X} + 1 = 0x{res:04X}"

            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op == "DEC":
            full_res = op1 - 1
            res = full_res & mask
            # DEC affects AF, OF, PF, SF, ZF, but NOT CF
            aux_carry = 1 if (op1 & 0x0F) == 0 else 0
            overflow = 1 if op1 == sign_bit else 0
            calc_str = f"DEC: 0x{op1:04X} - 1 = 0x{res:04X}"

            flags.af = aux_carry
            flags.of = overflow
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op in ("AND", "TEST"):
            assert op2 is not None
            res = (op1 & op2) & mask
            calc_str = f"{op}: 0x{op1:04X} AND 0x{op2:04X} = 0x{res:04X}"

            # Logical operations clear CF and OF; AF is undefined (clear here)
            flags.cf = 0
            flags.of = 0
            flags.af = 0
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

            if op == "TEST":
                res = op1  # TEST sets flags without altering destination register

        elif op == "OR":
            assert op2 is not None
            res = (op1 | op2) & mask
            calc_str = f"OR: 0x{op1:04X} OR 0x{op2:04X} = 0x{res:04X}"

            flags.cf = 0
            flags.of = 0
            flags.af = 0
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op == "XOR":
            assert op2 is not None
            res = (op1 ^ op2) & mask
            calc_str = f"XOR: 0x{op1:04X} XOR 0x{op2:04X} = 0x{res:04X}"

            flags.cf = 0
            flags.of = 0
            flags.af = 0
            flags.zf = 1 if res == 0 else 0
            flags.sf = 1 if (res & sign_bit) != 0 else 0
            flags.pf = compute_parity_flag(res)

        elif op == "NOT":
            res = (~op1) & mask
            calc_str = f"NOT: NOT(0x{op1:04X}) = 0x{res:04X}"
            # NOT does not affect any conditional flags

        else:
            raise ValueError(f"Unsupported ALU operation: '{operation}'")

        curr_flags = flags.to_dict()["flags"]

        trace = {
            "operation": op,
            "is_16bit": is_16bit,
            "operand1": op1,
            "operand2": op2,
            "result": res,
            "hex_op1": f"0x{op1:04X}" if is_16bit else f"0x{op1:02X}",
            "hex_op2": (f"0x{op2:04X}" if is_16bit else f"0x{op2:02X}") if op2 is not None else None,
            "hex_result": f"0x{res:04X}" if is_16bit else f"0x{res:02X}",
            "bin_op1": f"{op1:0{bits}b}",
            "bin_op2": f"{op2:0{bits}b}" if op2 is not None else None,
            "bin_result": f"{res:0{bits}b}",
            "calculation_summary": calc_str,
            "previous_flags": prev_flags,
            "current_flags": curr_flags,
        }

        return res, trace
