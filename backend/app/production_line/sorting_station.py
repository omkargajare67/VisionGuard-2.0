"""Sorting station directing inspected items to PASS or REJECT lanes."""

from typing import Any, Dict, Optional
from backend.app.production_line.actuators import ActuatorSubsystem
from backend.app.production_line.models import ProductStatus, StationPositions
from backend.app.production_line.product import Product


class SortingStation:
    def __init__(self, position: float = StationPositions.SORTING_STATION):
        self.position: float = float(position)
        self.current_product: Optional[Product] = None
        self.busy: bool = False
        self.pass_lane_count: int = 0
        self.reject_lane_count: int = 0

    def route_product(
        self, product: Product, actuators: ActuatorSubsystem
    ) -> Dict[str, Any]:
        """Activate sorting diverter, LEDs, buzzer, and route to pass or reject lane."""
        self.busy = True
        self.current_product = product

        decision = product.sorting_result or "REJECT"

        if decision == "PASS":
            product.lane = "PASS_LANE"
            product.transition_to(ProductStatus.PASSED)
            self.pass_lane_count += 1
            actuators.set_sorting_action("PASS")
        else:
            product.lane = "REJECT_LANE"
            product.transition_to(ProductStatus.REJECTED)
            self.reject_lane_count += 1
            actuators.set_sorting_action("REJECT")

        self.busy = False

        return {
            "product_id": product.product_id,
            "decision": decision,
            "lane": product.lane,
            "diverter_active": actuators.reject_gate == 1,
            "green_led": actuators.green_led,
            "red_led": actuators.red_led,
            "buzzer": actuators.alarm_buzzer,
            "pass_total": self.pass_lane_count,
            "reject_total": self.reject_lane_count,
        }

    def reset(self) -> None:
        self.current_product = None
        self.busy = False
        self.pass_lane_count = 0
        self.reject_lane_count = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "position": round(self.position, 2),
            "busy": self.busy,
            "current_product_id": self.current_product.product_id if self.current_product else None,
            "pass_lane_count": self.pass_lane_count,
            "reject_lane_count": self.reject_lane_count,
            "total_routed": self.pass_lane_count + self.reject_lane_count,
        }
