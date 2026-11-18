from typing import Any, Dict, Optional


class TimerChannel8253:
    """Individual 16-bit countdown counter channel."""

    def __init__(self, channel_id: int = 0):
        self.channel_id = channel_id
        self.mode = 0  # 0 = Terminal Count, 3 = Square Wave
        self.initial_count = 1000
        self.current_count = 1000
        self.out_pin = 0
        self.terminal_count = False
        self.enabled = True
        self.half_period_toggle = False

    def reset(self) -> None:
        self.current_count = self.initial_count
        self.out_pin = 0 if self.mode == 0 else 1
        self.terminal_count = False
        self.half_period_toggle = False

    def configure(self, mode: int, count: int) -> None:
        self.mode = mode
        self.initial_count = max(1, count & 0xFFFF)
        self.current_count = self.initial_count
        self.terminal_count = False
        if mode == 0:
            self.out_pin = 0  # Mode 0: OUT is LOW until terminal count
        elif mode == 3:
            self.out_pin = 1  # Mode 3: OUT starts HIGH
        self.half_period_toggle = False

    def tick(self) -> bool:
        """Advance timer by one input clock cycle.

        Returns True if a rising edge on OUT occurred (terminal count event).
        """
        if not self.enabled:
            return False

        fired = False
        if self.mode == 0:
            # Mode 0: Interrupt on Terminal Count
            if self.current_count > 0:
                self.current_count -= 1
                if self.current_count == 0:
                    self.terminal_count = True
                    self.out_pin = 1
                    fired = True
            else:
                # Wraps around
                self.current_count = 0xFFFF

        elif self.mode == 3:
            # Mode 3: Square Wave Generator
            self.current_count -= 2 if self.current_count >= 2 else self.current_count
            if self.current_count <= 0:
                self.current_count = self.initial_count
                self.out_pin = 1 if self.out_pin == 0 else 0
                if self.out_pin == 1:
                    fired = True
                    self.terminal_count = True

        return fired

    def to_dict(self) -> Dict[str, Any]:
        return {
            "channel": self.channel_id,
            "mode": f"Mode {self.mode} ({'Terminal Count' if self.mode == 0 else 'Square Wave'})",
            "initial_count": self.initial_count,
            "current_count": self.current_count,
            "out_pin": self.out_pin,
            "terminal_count": self.terminal_count,
            "enabled": self.enabled,
        }


class Timer8253:
    """Educational Programmable Interval Timer (Intel 8253/8254)."""

    def __init__(self, interrupt_controller: Optional[Any] = None):
        self.interrupt_controller = interrupt_controller
        self.channel0 = TimerChannel8253(0)
        self.total_ticks = 0

    def reset(self) -> None:
        self.channel0.reset()
        self.total_ticks = 0

    def configure(self, mode: int = 0, count: int = 10, irq_vector: Optional[int] = 8) -> Dict[str, Any]:
        self.channel0.configure(mode, count)
        self.irq_vector = irq_vector
        return self.to_dict()

    def tick(self, count: int = 1) -> Dict[str, Any]:
        """Simulate clock ticks."""
        triggered_interrupts = 0
        for _ in range(count):
            self.total_ticks += 1
            rising_edge = self.channel0.tick()
            if rising_edge:
                if self.interrupt_controller and self.channel0.mode == 0:
                    # In Mode 0, terminal count raises IRQ
                    self.interrupt_controller.raise_intr(8)
                    triggered_interrupts += 1

        res = self.to_dict()
        res["ticks_advanced"] = count
        res["triggered_interrupts"] = triggered_interrupts
        return res

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_ticks": self.total_ticks,
            "channel0": self.channel0.to_dict(),
        }
