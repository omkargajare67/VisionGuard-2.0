from typing import Any, Dict


class FlagsRegister:
    """Intel 8086 16-bit FLAGS Register.

    Bit layout:
      15 14 13 12 | 11 10  9  8 |  7  6  5  4 |  3  2  1  0
       -  -  -  - | OF DF IF TF | SF ZF  - AF |  - PF  - CF
    """

    CF_BIT = 0   # Carry Flag
    PF_BIT = 2   # Parity Flag
    AF_BIT = 4   # Auxiliary Carry Flag
    ZF_BIT = 6   # Zero Flag
    SF_BIT = 7   # Sign Flag
    TF_BIT = 8   # Trap Flag
    IF_BIT = 9   # Interrupt Enable Flag
    DF_BIT = 10  # Direction Flag
    OF_BIT = 11  # Overflow Flag

    def __init__(self, value: int = 0x0200):
        # Default IF=1 (interrupts enabled by default in many educational setups, 0x0200)
        self._value = value & 0xFFFF

    @property
    def value(self) -> int:
        return self._value

    @value.setter
    def value(self, val: int) -> None:
        self._value = val & 0xFFFF

    def _get_bit(self, bit: int) -> int:
        return (self._value >> bit) & 1

    def _set_bit(self, bit: int, flag: bool) -> None:
        if flag:
            self._value |= (1 << bit)
        else:
            self._value &= ~(1 << bit)
        self._value &= 0xFFFF

    @property
    def cf(self) -> int:
        return self._get_bit(self.CF_BIT)

    @cf.setter
    def cf(self, v: bool | int) -> None:
        self._set_bit(self.CF_BIT, bool(v))

    @property
    def pf(self) -> int:
        return self._get_bit(self.PF_BIT)

    @pf.setter
    def pf(self, v: bool | int) -> None:
        self._set_bit(self.PF_BIT, bool(v))

    @property
    def af(self) -> int:
        return self._get_bit(self.AF_BIT)

    @af.setter
    def af(self, v: bool | int) -> None:
        self._set_bit(self.AF_BIT, bool(v))

    @property
    def zf(self) -> int:
        return self._get_bit(self.ZF_BIT)

    @zf.setter
    def zf(self, v: bool | int) -> None:
        self._set_bit(self.ZF_BIT, bool(v))

    @property
    def sf(self) -> int:
        return self._get_bit(self.SF_BIT)

    @sf.setter
    def sf(self, v: bool | int) -> None:
        self._set_bit(self.SF_BIT, bool(v))

    @property
    def tf(self) -> int:
        return self._get_bit(self.TF_BIT)

    @tf.setter
    def tf(self, v: bool | int) -> None:
        self._set_bit(self.TF_BIT, bool(v))

    @property
    def if_flag(self) -> int:
        return self._get_bit(self.IF_BIT)

    @if_flag.setter
    def if_flag(self, v: bool | int) -> None:
        self._set_bit(self.IF_BIT, bool(v))

    @property
    def df(self) -> int:
        return self._get_bit(self.DF_BIT)

    @df.setter
    def df(self, v: bool | int) -> None:
        self._set_bit(self.DF_BIT, bool(v))

    @property
    def of(self) -> int:
        return self._get_bit(self.OF_BIT)

    @of.setter
    def of(self, v: bool | int) -> None:
        self._set_bit(self.OF_BIT, bool(v))

    def to_dict(self) -> Dict[str, Any]:
        return {
            "value": self._value,
            "hex": f"0x{self._value:04X}",
            "binary": f"{self._value:016b}",
            "flags": {
                "CF": self.cf,
                "PF": self.pf,
                "AF": self.af,
                "ZF": self.zf,
                "SF": self.sf,
                "TF": self.tf,
                "IF": self.if_flag,
                "DF": self.df,
                "OF": self.of,
            },
        }


class Registers8086:
    """Complete 16-bit register set for the Intel 8086 Microprocessor."""

    EIGHT_BIT_REGS = {"AL", "AH", "BL", "BH", "CL", "CH", "DL", "DH"}
    SIXTEEN_BIT_REGS = {
        "AX", "BX", "CX", "DX",
        "SP", "BP", "SI", "DI",
        "CS", "DS", "SS", "ES",
        "IP",
    }

    def __init__(self):
        self.reset()

    def reset(self) -> None:
        # General purpose 16-bit
        self._ax = 0x0000
        self._bx = 0x0000
        self._cx = 0x0000
        self._dx = 0x0000

        # Pointers & Index
        self._sp = 0xFFFE  # Top of 64KB stack segment
        self._bp = 0x0000
        self._si = 0x0000
        self._di = 0x0000

        # Segment registers
        self._cs = 0x1000  # Default code segment: 0x10000 physical
        self._ds = 0x2000  # Default data segment: 0x20000 physical
        self._ss = 0x3000  # Default stack segment: 0x30000 physical
        self._es = 0x4000  # Default extra segment: 0x40000 physical

        # Instruction Pointer
        self._ip = 0x0000

        # FLAGS
        self.flags = FlagsRegister(0x0200)

    # AX / AH / AL
    @property
    def ax(self) -> int:
        return self._ax

    @ax.setter
    def ax(self, val: int) -> None:
        self._ax = val & 0xFFFF

    @property
    def al(self) -> int:
        return self._ax & 0xFF

    @al.setter
    def al(self, val: int) -> None:
        self._ax = (self._ax & 0xFF00) | (val & 0xFF)

    @property
    def ah(self) -> int:
        return (self._ax >> 8) & 0xFF

    @ah.setter
    def ah(self, val: int) -> None:
        self._ax = (self._ax & 0x00FF) | ((val & 0xFF) << 8)

    # BX / BH / BL
    @property
    def bx(self) -> int:
        return self._bx

    @bx.setter
    def bx(self, val: int) -> None:
        self._bx = val & 0xFFFF

    @property
    def bl(self) -> int:
        return self._bx & 0xFF

    @bl.setter
    def bl(self, val: int) -> None:
        self._bx = (self._bx & 0xFF00) | (val & 0xFF)

    @property
    def bh(self) -> int:
        return (self._bx >> 8) & 0xFF

    @bh.setter
    def bh(self, val: int) -> None:
        self._bx = (self._bx & 0x00FF) | ((val & 0xFF) << 8)

    # CX / CH / CL
    @property
    def cx(self) -> int:
        return self._cx

    @cx.setter
    def cx(self, val: int) -> None:
        self._cx = val & 0xFFFF

    @property
    def cl(self) -> int:
        return self._cx & 0xFF

    @cl.setter
    def cl(self, val: int) -> None:
        self._cx = (self._cx & 0xFF00) | (val & 0xFF)

    @property
    def ch(self) -> int:
        return (self._cx >> 8) & 0xFF

    @ch.setter
    def ch(self, val: int) -> None:
        self._cx = (self._cx & 0x00FF) | ((val & 0xFF) << 8)

    # DX / DH / DL
    @property
    def dx(self) -> int:
        return self._dx

    @dx.setter
    def dx(self, val: int) -> None:
        self._dx = val & 0xFFFF

    @property
    def dl(self) -> int:
        return self._dx & 0xFF

    @dl.setter
    def dl(self, val: int) -> None:
        self._dx = (self._dx & 0xFF00) | (val & 0xFF)

    @property
    def dh(self) -> int:
        return (self._dx >> 8) & 0xFF

    @dh.setter
    def dh(self, val: int) -> None:
        self._dx = (self._dx & 0x00FF) | ((val & 0xFF) << 8)

    # Pointers and Indexes
    @property
    def sp(self) -> int:
        return self._sp

    @sp.setter
    def sp(self, val: int) -> None:
        self._sp = val & 0xFFFF

    @property
    def bp(self) -> int:
        return self._bp

    @bp.setter
    def bp(self, val: int) -> None:
        self._bp = val & 0xFFFF

    @property
    def si(self) -> int:
        return self._si

    @si.setter
    def si(self, val: int) -> None:
        self._si = val & 0xFFFF

    @property
    def di(self) -> int:
        return self._di

    @di.setter
    def di(self, val: int) -> None:
        self._di = val & 0xFFFF

    # Segment Registers
    @property
    def cs(self) -> int:
        return self._cs

    @cs.setter
    def cs(self, val: int) -> None:
        self._cs = val & 0xFFFF

    @property
    def ds(self) -> int:
        return self._ds

    @ds.setter
    def ds(self, val: int) -> None:
        self._ds = val & 0xFFFF

    @property
    def ss(self) -> int:
        return self._ss

    @ss.setter
    def ss(self, val: int) -> None:
        self._ss = val & 0xFFFF

    @property
    def es(self) -> int:
        return self._es

    @es.setter
    def es(self, val: int) -> None:
        self._es = val & 0xFFFF

    # Instruction Pointer
    @property
    def ip(self) -> int:
        return self._ip

    @ip.setter
    def ip(self, val: int) -> None:
        self._ip = val & 0xFFFF

    def get_reg(self, name: str) -> int:
        u = name.upper()
        if u == "AX": return self.ax
        if u == "AL": return self.al
        if u == "AH": return self.ah
        if u == "BX": return self.bx
        if u == "BL": return self.bl
        if u == "BH": return self.bh
        if u == "CX": return self.cx
        if u == "CL": return self.cl
        if u == "CH": return self.ch
        if u == "DX": return self.dx
        if u == "DL": return self.dl
        if u == "DH": return self.dh
        if u == "SP": return self.sp
        if u == "BP": return self.bp
        if u == "SI": return self.si
        if u == "DI": return self.di
        if u == "CS": return self.cs
        if u == "DS": return self.ds
        if u == "SS": return self.ss
        if u == "ES": return self.es
        if u == "IP": return self.ip
        if u in ("FLAGS", "FLAG"): return self.flags.value
        raise ValueError(f"Unknown register name: '{name}'")

    def set_reg(self, name: str, val: int) -> None:
        u = name.upper()
        if u == "AX": self.ax = val
        elif u == "AL": self.al = val
        elif u == "AH": self.ah = val
        elif u == "BX": self.bx = val
        elif u == "BL": self.bl = val
        elif u == "BH": self.bh = val
        elif u == "CX": self.cx = val
        elif u == "CL": self.cl = val
        elif u == "CH": self.ch = val
        elif u == "DX": self.dx = val
        elif u == "DL": self.dl = val
        elif u == "DH": self.dh = val
        elif u == "SP": self.sp = val
        elif u == "BP": self.bp = val
        elif u == "SI": self.si = val
        elif u == "DI": self.di = val
        elif u == "CS": self.cs = val
        elif u == "DS": self.ds = val
        elif u == "SS": self.ss = val
        elif u == "ES": self.es = val
        elif u == "IP": self.ip = val
        elif u in ("FLAGS", "FLAG"): self.flags.value = val
        else:
            raise ValueError(f"Unknown register name: '{name}'")

    def is_16bit(self, name: str) -> bool:
        u = name.upper()
        return u in self.SIXTEEN_BIT_REGS or u in ("FLAGS", "FLAG")

    def to_dict(self) -> Dict[str, Any]:
        return {
            "general": {
                "AX": {"hex": f"0x{self.ax:04X}", "dec": self.ax, "bin": f"{self.ax:016b}", "H": f"0x{self.ah:02X}", "L": f"0x{self.al:02X}"},
                "BX": {"hex": f"0x{self.bx:04X}", "dec": self.bx, "bin": f"{self.bx:016b}", "H": f"0x{self.bh:02X}", "L": f"0x{self.bl:02X}"},
                "CX": {"hex": f"0x{self.cx:04X}", "dec": self.cx, "bin": f"{self.cx:016b}", "H": f"0x{self.ch:02X}", "L": f"0x{self.cl:02X}"},
                "DX": {"hex": f"0x{self.dx:04X}", "dec": self.dx, "bin": f"{self.dx:016b}", "H": f"0x{self.dh:02X}", "L": f"0x{self.dl:02X}"},
            },
            "pointers": {
                "SP": {"hex": f"0x{self.sp:04X}", "dec": self.sp, "bin": f"{self.sp:016b}"},
                "BP": {"hex": f"0x{self.bp:04X}", "dec": self.bp, "bin": f"{self.bp:016b}"},
                "SI": {"hex": f"0x{self.si:04X}", "dec": self.si, "bin": f"{self.si:016b}"},
                "DI": {"hex": f"0x{self.di:04X}", "dec": self.di, "bin": f"{self.di:016b}"},
            },
            "segments": {
                "CS": {"hex": f"0x{self.cs:04X}", "dec": self.cs, "base_physical": f"0x{(self.cs << 4):05X}"},
                "DS": {"hex": f"0x{self.ds:04X}", "dec": self.ds, "base_physical": f"0x{(self.ds << 4):05X}"},
                "SS": {"hex": f"0x{self.ss:04X}", "dec": self.ss, "base_physical": f"0x{(self.ss << 4):05X}"},
                "ES": {"hex": f"0x{self.es:04X}", "dec": self.es, "base_physical": f"0x{(self.es << 4):05X}"},
            },
            "special": {
                "IP": {"hex": f"0x{self.ip:04X}", "dec": self.ip, "physical": f"0x{((self.cs << 4) + self.ip) & 0xFFFFF:05X}"},
                "FLAGS": self.flags.to_dict(),
            },
        }
