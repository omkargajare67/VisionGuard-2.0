from typing import Any, Dict, List, Optional


class InstructionOperand:
    """Represents an operand for an 8086 assembly instruction."""

    TYPE_REG = "REGISTER"
    TYPE_IMM = "IMMEDIATE"
    TYPE_MEM = "MEMORY"
    TYPE_LABEL = "LABEL"

    def __init__(
        self,
        op_type: str,
        value: Any,
        is_16bit: bool = True,
        raw_text: str = "",
        disp: int = 0,
        base_reg: Optional[str] = None,
        index_reg: Optional[str] = None,
    ):
        self.type = op_type
        self.value = value
        self.is_16bit = is_16bit
        self.raw_text = raw_text
        self.disp = disp
        self.base_reg = base_reg
        self.index_reg = index_reg

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": self.type,
            "value": self.value,
            "is_16bit": self.is_16bit,
            "raw": self.raw_text,
        }


class Instruction:
    """Represents an assembled 8086 instruction with bytecode and execution semantics."""

    def __init__(
        self,
        mnemonic: str,
        operands: List[InstructionOperand],
        bytecode: List[int],
        source_line: str,
        line_number: int,
        offset: int = 0,
    ):
        self.mnemonic = mnemonic.upper()
        self.operands = operands
        self.bytecode = bytecode
        self.source_line = source_line
        self.line_number = line_number
        self.offset = offset
        self.size = len(bytecode)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mnemonic": self.mnemonic,
            "offset": f"0x{self.offset:04X}",
            "size": self.size,
            "bytecode": [f"0x{b:02X}" for b in self.bytecode],
            "bytecode_raw": self.bytecode,
            "source": self.source_line,
            "line_number": self.line_number,
            "operands": [op.to_dict() for op in self.operands],
        }
