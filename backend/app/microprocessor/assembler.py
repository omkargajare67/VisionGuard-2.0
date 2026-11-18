import re
from typing import Any, Dict, List, Optional, Tuple
from backend.app.microprocessor.instruction_set import Instruction, InstructionOperand
from backend.app.microprocessor.registers8086 import Registers8086


REG_ID_16 = {"AX": 0, "CX": 1, "DX": 2, "BX": 3, "SP": 4, "BP": 5, "SI": 6, "DI": 7}
REG_ID_8 = {"AL": 0, "CL": 1, "DL": 2, "BL": 3, "AH": 4, "CH": 5, "DH": 6, "BH": 7}


def parse_numeric_literal(val_str: str) -> Optional[int]:
    """Parse integer literal supporting decimal, hex (0x12, 12H, 0FFh), binary (101B)."""
    s = val_str.strip().upper()
    try:
        # Hex starting with 0X
        if s.startswith("0X"):
            return int(s, 16)
        # Hex ending with H
        if s.endswith("H"):
            hex_part = s[:-1]
            return int(hex_part, 16)
        # Binary ending with B
        if s.endswith("B") and all(c in "01" for c in s[:-1]):
            return int(s[:-1], 2)
        # Plain decimal
        return int(s, 10)
    except ValueError:
        return None


class Assembler8086:
    """Educational Two-Pass Assembler for Intel 8086 Instruction Subset."""

    VALID_MNEMONICS = {
        "MOV", "PUSH", "POP", "XCHG",
        "ADD", "ADC", "SUB", "SBB", "INC", "DEC", "CMP",
        "AND", "OR", "XOR", "NOT", "TEST",
        "JMP", "JZ", "JE", "JNZ", "JNE", "JC", "JNC", "LOOP", "CALL", "RET",
        "IN", "OUT",
        "NOP", "HLT", "STI", "CLI", "INT", "IRET",
    }

    def assemble(self, source_code: str, base_offset: int = 0x0000) -> Dict[str, Any]:
        """Assemble multiline source string into instructions and binary machine code."""
        lines = source_code.splitlines()
        errors: List[str] = []
        symbol_table: Dict[str, int] = {}
        parsed_lines: List[Tuple[int, str, Optional[str], Optional[str], List[str]]] = []

        # ---------------------------------------------------------------------
        # Pass 1: Line Tokenization & Label Discovery
        # ---------------------------------------------------------------------
        current_offset = base_offset

        for line_no, raw_line in enumerate(lines, start=1):
            # Strip comments
            cleaned = raw_line.split(";", 1)[0].strip()
            if not cleaned:
                continue

            label: Optional[str] = None
            mnemonic: Optional[str] = None
            operands: List[str] = []

            # Check if line contains label (ends with :)
            if ":" in cleaned:
                parts = cleaned.split(":", 1)
                label_candidate = parts[0].strip()
                if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", label_candidate):
                    errors.append(f"Line {line_no}: Invalid label name '{label_candidate}'")
                    continue
                label = label_candidate.upper()
                cleaned = parts[1].strip()

            if label:
                symbol_table[label] = current_offset

            if not cleaned:
                # Line had only a label
                continue

            # Tokenize mnemonic and operands
            tokens = cleaned.split(None, 1)
            mnemonic = tokens[0].upper()
            if mnemonic not in self.VALID_MNEMONICS:
                errors.append(f"Line {line_no}: Unknown or unsupported mnemonic '{mnemonic}'")
                continue

            if len(tokens) > 1:
                # Split operands by comma (preserving brackets)
                raw_ops = [op.strip() for op in tokens[1].split(",") if op.strip()]
                operands = raw_ops

            # In Pass 1, compute exact instruction size by test-generating bytecode with forward references allowed
            try:
                test_ops = self._parse_operands(operands, symbol_table, current_offset, allow_forward_ref=True)
                test_bc = self._generate_bytecode(mnemonic, test_ops, current_offset, symbol_table)
                inst_size = len(test_bc)
            except Exception:
                inst_size = self._estimate_instruction_size(mnemonic, operands)

            parsed_lines.append((line_no, raw_line.strip(), label, mnemonic, operands))
            current_offset += inst_size

        if errors:
            return {
                "success": False,
                "instructions": [],
                "labels": symbol_table,
                "errors": errors,
                "bytecode": [],
                "code_size": 0,
            }

        # ---------------------------------------------------------------------
        # Pass 2: Operand Resolution & Bytecode Synthesis
        # ---------------------------------------------------------------------
        instructions: List[Instruction] = []
        final_bytecode: List[int] = []
        curr_offset = base_offset

        for line_no, raw_line, label, mnemonic, raw_operands in parsed_lines:
            assert mnemonic is not None
            try:
                op_objects = self._parse_operands(raw_operands, symbol_table, curr_offset)
                bytecode = self._generate_bytecode(mnemonic, op_objects, curr_offset, symbol_table)
                inst = Instruction(
                    mnemonic=mnemonic,
                    operands=op_objects,
                    bytecode=bytecode,
                    source_line=raw_line,
                    line_number=line_no,
                    offset=curr_offset,
                )
                instructions.append(inst)
                final_bytecode.extend(bytecode)
                curr_offset += len(bytecode)
            except Exception as e:
                errors.append(f"Line {line_no} ('{raw_line}'): {str(e)}")

        return {
            "success": len(errors) == 0,
            "instructions": [inst.to_dict() for inst in instructions],
            "instruction_objects": instructions,
            "labels": symbol_table,
            "errors": errors,
            "bytecode": final_bytecode,
            "code_size": len(final_bytecode),
        }

    # -------------------------------------------------------------------------
    # Operand Parsing Helpers
    # -------------------------------------------------------------------------

    def _parse_operands(
        self,
        raw_ops: List[str],
        symbol_table: Dict[str, int],
        curr_offset: int,
        allow_forward_ref: bool = False,
    ) -> List[InstructionOperand]:
        operands: List[InstructionOperand] = []

        for raw in raw_ops:
            token = raw.strip()

            # Check if memory operand [ ... ]
            if token.startswith("[") and token.endswith("]"):
                inner = token[1:-1].strip().upper()
                mem_op = self._parse_memory_operand(inner, symbol_table, allow_forward_ref=allow_forward_ref)
                operands.append(mem_op)
                continue

            u = token.upper()
            # Register operand
            if u in Registers8086.SIXTEEN_BIT_REGS or u in Registers8086.EIGHT_BIT_REGS or u in ("FLAGS", "FLAG"):
                is_16 = u in Registers8086.SIXTEEN_BIT_REGS or u in ("FLAGS", "FLAG")
                operands.append(
                    InstructionOperand(
                        op_type=InstructionOperand.TYPE_REG,
                        value=u,
                        is_16bit=is_16,
                        raw_text=raw,
                    )
                )
                continue

            # Numeric immediate literal
            num_val = parse_numeric_literal(token)
            if num_val is not None:
                is_16 = num_val > 0xFF or num_val < -128
                operands.append(
                    InstructionOperand(
                        op_type=InstructionOperand.TYPE_IMM,
                        value=num_val,
                        is_16bit=is_16,
                        raw_text=raw,
                    )
                )
                continue

            # Label reference (either known or allowed forward ref)
            if u in symbol_table or allow_forward_ref:
                target_addr = symbol_table.get(u, 0)
                operands.append(
                    InstructionOperand(
                        op_type=InstructionOperand.TYPE_LABEL,
                        value=target_addr,
                        is_16bit=True,
                        raw_text=raw,
                    )
                )
                continue

            # Unresolved label/symbol error
            raise ValueError(f"Undefined symbol or invalid operand: '{token}'")

        return operands

    def _parse_memory_operand(
        self, inner: str, symbol_table: Dict[str, int], allow_forward_ref: bool = False
    ) -> InstructionOperand:
        # Check numeric direct address [1000H]
        num = parse_numeric_literal(inner)
        if num is not None:
            return InstructionOperand(
                op_type=InstructionOperand.TYPE_MEM,
                value=num,
                is_16bit=True,
                raw_text=f"[{inner}]",
                disp=num,
            )

        # Check register indirect or based-indexed e.g. [BX], [SI], [BX+SI], [BX+05H]
        parts = [p.strip() for p in inner.split("+")]
        base_reg: Optional[str] = None
        index_reg: Optional[str] = None
        disp = 0

        for p in parts:
            if p in ("BX", "BP"):
                base_reg = p
            elif p in ("SI", "DI"):
                index_reg = p
            else:
                n = parse_numeric_literal(p)
                if n is not None:
                    disp += n
                elif p in symbol_table:
                    disp += symbol_table[p]
                else:
                    raise ValueError(f"Invalid addressing term in memory reference: '[{inner}]'")

        return InstructionOperand(
            op_type=InstructionOperand.TYPE_MEM,
            value={"base": base_reg, "index": index_reg, "disp": disp},
            is_16bit=True,
            raw_text=f"[{inner}]",
            disp=disp,
            base_reg=base_reg,
            index_reg=index_reg,
        )

    def _estimate_instruction_size(self, mnemonic: str, operands: List[str]) -> int:
        if mnemonic in ("NOP", "HLT", "STI", "CLI", "RET", "IRET"):
            return 1
        if mnemonic in ("INC", "DEC") and operands and operands[0].upper() in REG_ID_16:
            return 1
        if mnemonic in ("PUSH", "POP") and operands and operands[0].upper() in REG_ID_16:
            return 1
        if mnemonic in ("INT",):
            return 2
        if mnemonic in ("JMP", "JZ", "JE", "JNZ", "JNE", "JC", "JNC", "LOOP", "CALL"):
            return 3
        if mnemonic in ("IN", "OUT"):
            return 2
        # Default 2-3 bytes
        return 3

    # -------------------------------------------------------------------------
    # Educational Bytecode Generator
    # -------------------------------------------------------------------------

    def _generate_bytecode(
        self,
        mnemonic: str,
        operands: List[InstructionOperand],
        offset: int,
        symbol_table: Dict[str, int],
    ) -> List[int]:
        m = mnemonic.upper()

        # Zero-operand instructions
        if m == "NOP": return [0x90]
        if m == "HLT": return [0xF4]
        if m == "STI": return [0xFB]
        if m == "CLI": return [0xFA]
        if m == "RET": return [0xC3]
        if m == "IRET": return [0xCF]

        # Single operand instructions
        if m == "INT":
            vec = operands[0].value if operands else 3
            return [0xCD, vec & 0xFF]

        if m == "PUSH":
            op = operands[0]
            if op.type == InstructionOperand.TYPE_REG and op.value in REG_ID_16:
                return [0x50 + REG_ID_16[op.value]]
            return [0xFF, 0x36, 0x00, 0x00]

        if m == "POP":
            op = operands[0]
            if op.type == InstructionOperand.TYPE_REG and op.value in REG_ID_16:
                return [0x58 + REG_ID_16[op.value]]
            return [0x8F, 0x06, 0x00, 0x00]

        if m in ("INC", "DEC"):
            op = operands[0]
            base_code = 0x40 if m == "INC" else 0x48
            if op.type == InstructionOperand.TYPE_REG and op.value in REG_ID_16:
                return [base_code + REG_ID_16[op.value]]
            if op.type == InstructionOperand.TYPE_REG and op.value in REG_ID_8:
                modrm = 0xC0 | (REG_ID_8[op.value])
                return [0xFE, modrm]
            return [0xFF, 0x00]

        if m == "NOT":
            op = operands[0]
            if op.type == InstructionOperand.TYPE_REG:
                reg_id = REG_ID_16.get(op.value, REG_ID_8.get(op.value, 0))
                return [0xF7 if op.is_16bit else 0xF6, 0xD0 | reg_id]
            return [0xF7, 0x10]

        # Jumps and Control Flow (relative or absolute target)
        if m in ("JMP", "JZ", "JE", "JNZ", "JNE", "JC", "JNC", "LOOP", "CALL"):
            target = operands[0].value
            target_offset = target if isinstance(target, int) else 0
            # 3-byte near jump format: [opcode, target_low, target_high]
            opcode_map = {
                "JMP": 0xE9,
                "JZ": 0x74,
                "JE": 0x74,
                "JNZ": 0x75,
                "JNE": 0x75,
                "JC": 0x72,
                "JNC": 0x73,
                "LOOP": 0xE2,
                "CALL": 0xE8,
            }
            opc = opcode_map.get(m, 0xE9)
            return [opc, target_offset & 0xFF, (target_offset >> 8) & 0xFF]

        # I/O: IN / OUT
        if m == "IN":
            # Form: IN AL, port or IN AX, port or IN AL, DX
            if len(operands) >= 2 and operands[1].type == InstructionOperand.TYPE_IMM:
                port = operands[1].value & 0xFF
                opc = 0xE5 if operands[0].is_16bit else 0xE4
                return [opc, port]
            return [0xED if operands[0].is_16bit else 0xEC]

        if m == "OUT":
            # Form: OUT port, AL or OUT port, AX or OUT DX, AL
            if len(operands) >= 2 and operands[0].type == InstructionOperand.TYPE_IMM:
                port = operands[0].value & 0xFF
                opc = 0xE7 if operands[1].is_16bit else 0xE6
                return [opc, port]
            return [0xEF if operands[1].is_16bit else 0xEE]

        # Two-operand data transfer and arithmetic/logic
        if len(operands) >= 2:
            dst = operands[0]
            src = operands[1]

            # MOV dest, immediate
            if m == "MOV" and dst.type == InstructionOperand.TYPE_REG and src.type == InstructionOperand.TYPE_IMM:
                if dst.is_16bit:
                    val = src.value & 0xFFFF
                    return [0xB8 + REG_ID_16[dst.value], val & 0xFF, (val >> 8) & 0xFF]
                else:
                    val = src.value & 0xFF
                    return [0xB0 + REG_ID_8[dst.value], val]

            # MOV dest, reg
            if m == "MOV" and dst.type == InstructionOperand.TYPE_REG and src.type == InstructionOperand.TYPE_REG:
                opc = 0x89 if dst.is_16bit else 0x88
                dst_id = REG_ID_16.get(dst.value, REG_ID_8.get(dst.value, 0))
                src_id = REG_ID_16.get(src.value, REG_ID_8.get(src.value, 0))
                modrm = 0xC0 | (src_id << 3) | dst_id
                return [opc, modrm]

            # MOV reg, [memory] or MOV [memory], reg
            if m == "MOV" and dst.type == InstructionOperand.TYPE_REG and src.type == InstructionOperand.TYPE_MEM:
                disp = src.disp & 0xFFFF
                return [0x8B if dst.is_16bit else 0x8A, 0x06, disp & 0xFF, (disp >> 8) & 0xFF]

            if m == "MOV" and dst.type == InstructionOperand.TYPE_MEM and src.type == InstructionOperand.TYPE_REG:
                disp = dst.disp & 0xFFFF
                return [0x89 if src.is_16bit else 0x88, 0x06, disp & 0xFF, (disp >> 8) & 0xFF]

            # XCHG reg, reg
            if m == "XCHG":
                if dst.value == "AX" and src.value in REG_ID_16:
                    return [0x90 + REG_ID_16[src.value]]
                if src.value == "AX" and dst.value in REG_ID_16:
                    return [0x90 + REG_ID_16[dst.value]]
                return [0x87, 0xC0 | (REG_ID_16.get(src.value, 0) << 3) | REG_ID_16.get(dst.value, 0)]

            # ALU operations with immediate
            alu_imm_codes = {
                "ADD": 0x00, "OR": 0x08, "ADC": 0x10, "SBB": 0x18,
                "AND": 0x20, "SUB": 0x28, "XOR": 0x30, "CMP": 0x38, "TEST": 0x20,
            }
            if src.type == InstructionOperand.TYPE_IMM:
                val = src.value & (0xFFFF if dst.is_16bit else 0xFF)
                reg_id = REG_ID_16.get(dst.value, REG_ID_8.get(dst.value, 0))
                ext_code = alu_imm_codes.get(m, 0x00) >> 3
                modrm = 0xC0 | (ext_code << 3) | reg_id
                if dst.is_16bit:
                    return [0x81, modrm, val & 0xFF, (val >> 8) & 0xFF]
                else:
                    return [0x80, modrm, val]

            # ALU operations between registers
            if dst.type == InstructionOperand.TYPE_REG and src.type == InstructionOperand.TYPE_REG:
                alu_opcodes = {
                    "ADD": 0x01, "ADC": 0x11, "SUB": 0x29, "SBB": 0x19,
                    "CMP": 0x39, "AND": 0x21, "OR": 0x09, "XOR": 0x31, "TEST": 0x85,
                }
                opc = alu_opcodes.get(m, 0x01)
                if not dst.is_16bit: opc -= 1
                dst_id = REG_ID_16.get(dst.value, REG_ID_8.get(dst.value, 0))
                src_id = REG_ID_16.get(src.value, REG_ID_8.get(src.value, 0))
                modrm = 0xC0 | (src_id << 3) | dst_id
                return [opc, modrm]

        # Fallback generic educational opcode
        return [0x90, 0x00]
