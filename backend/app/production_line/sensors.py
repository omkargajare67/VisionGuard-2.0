"""Virtual sensor network modeling photoelectric and proximity sensors."""

from typing import Any, Dict, List, Optional
from backend.app.production_line.models import StationPositions


class VirtualSensor:
    def __init__(
        self,
        sensor_id: str,
        name: str,
        position: float,
        detection_range: float = 3.5,
    ):
        self.sensor_id = sensor_id
        self.name = name
        self.position = float(position)
        self.detection_range = float(detection_range)

        self.active: bool = False
        self.detection_count: int = 0
        self.last_activated_tick: Optional[int] = None
        self.associated_product_id: Optional[str] = None
        self.event_history: List[Dict[str, Any]] = []

    def check_detection(self, product_id: str, product_position: float, tick: int) -> bool:
        """Check if a product is within detection range."""
        in_range = abs(product_position - self.position) <= self.detection_range
        was_active = self.active

        if in_range:
            self.active = True
            self.associated_product_id = product_id
            if not was_active or self.associated_product_id != product_id:
                self.detection_count += 1
                self.last_activated_tick = tick
                if len(self.event_history) < 100:
                    self.event_history.append({
                        "tick": tick,
                        "product_id": product_id,
                        "position": round(product_position, 2),
                    })
                return True  # Newly triggered
        return False

    def clear(self) -> None:
        self.active = False
        self.associated_product_id = None

    def reset(self) -> None:
        self.active = False
        self.detection_count = 0
        self.last_activated_tick = None
        self.associated_product_id = None
        self.event_history.clear()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sensor_id": self.sensor_id,
            "name": self.name,
            "position": round(self.position, 2),
            "active": self.active,
            "detection_count": self.detection_count,
            "last_activated_tick": self.last_activated_tick,
            "associated_product_id": self.associated_product_id,
        }


class SensorNetwork:
    def __init__(self, positions: Optional[StationPositions] = None):
        pos = positions or StationPositions()
        self.ir_sensor_1 = VirtualSensor("IR-01", "Product Arrival Sensor", pos.IR_SENSOR_1)
        self.ir_sensor_2 = VirtualSensor("IR-02", "Inspection Position Sensor", pos.INSPECTION_STATION)
        self.ir_sensor_3 = VirtualSensor("IR-03", "Sorting Station Sensor", pos.SORTING_STATION)
        self.exit_sensor = VirtualSensor("EXIT-01", "Exit Confirmation Sensor", pos.EXIT_SENSOR)

    def update_all(self, active_products: List[Any], tick: int) -> List[Dict[str, Any]]:
        """Update sensor states against all active products on the conveyor.
        Returns list of newly triggered sensor events."""
        events = []
        sensors = [self.ir_sensor_1, self.ir_sensor_2, self.ir_sensor_3, self.exit_sensor]

        # Reset active status for each tick before evaluating
        for s in sensors:
            s.clear()

        for prod in active_products:
            for s in sensors:
                if s.check_detection(prod.product_id, prod.position, tick):
                    events.append({
                        "sensor_id": s.sensor_id,
                        "name": s.name,
                        "product_id": prod.product_id,
                        "position": round(prod.position, 2),
                        "tick": tick,
                    })

        return events

    def reset(self) -> None:
        self.ir_sensor_1.reset()
        self.ir_sensor_2.reset()
        self.ir_sensor_3.reset()
        self.exit_sensor.reset()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ir_sensor_1": self.ir_sensor_1.to_dict(),
            "ir_sensor_2": self.ir_sensor_2.to_dict(),
            "ir_sensor_3": self.ir_sensor_3.to_dict(),
            "exit_sensor": self.exit_sensor.to_dict(),
        }
