"""Product lifecycle model for virtual production line items."""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from backend.app.production_line.models import ProductStatus


class Product:
    def __init__(
        self,
        product_id: str,
        name: str,
        sample_id: Optional[str] = None,
        custom_image_base64: Optional[str] = None,
        created_tick: int = 0,
    ):
        self.product_id = product_id
        self.name = name
        self.sample_id = sample_id
        self.custom_image_base64 = custom_image_base64
        self.position: float = 0.0
        self.status: str = ProductStatus.QUEUED

        self.created_tick: int = created_tick
        self.entry_tick: Optional[int] = None
        self.inspection_tick: Optional[int] = None
        self.completion_tick: Optional[int] = None

        self.created_at: str = datetime.now(timezone.utc).isoformat()
        self.completed_at: Optional[str] = None

        # Diagnostic records
        self.inspection_result: Optional[Dict[str, Any]] = None
        self.deam_decision: Optional[Dict[str, Any]] = None
        self.microprocessor_result: Optional[Dict[str, Any]] = None
        self.sorting_result: Optional[str] = None  # "PASS" or "REJECT"
        self.fault_reason: Optional[str] = None
        self.lane: Optional[str] = None  # "PASS_LANE", "REJECT_LANE"
        self.is_completed: bool = False

    def update_position(self, delta: float, max_pos: float = 100.0) -> float:
        self.position = min(max_pos, self.position + delta)
        return self.position

    def transition_to(self, new_status: str) -> None:
        self.status = new_status

    def mark_completed(self, tick: int) -> None:
        if not self.is_completed:
            self.is_completed = True
            self.completion_tick = tick
            self.completed_at = datetime.now(timezone.utc).isoformat()
            self.status = ProductStatus.EXITED

    def to_dict(self) -> Dict[str, Any]:
        return {
            "product_id": self.product_id,
            "name": self.name,
            "sample_id": self.sample_id,
            "position": round(self.position, 2),
            "status": self.status,
            "created_tick": self.created_tick,
            "entry_tick": self.entry_tick,
            "inspection_tick": self.inspection_tick,
            "completion_tick": self.completion_tick,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "inspection_result": self.inspection_result,
            "deam_decision": self.deam_decision,
            "microprocessor_result": self.microprocessor_result,
            "sorting_result": self.sorting_result,
            "fault_reason": self.fault_reason,
            "lane": self.lane,
            "is_completed": self.is_completed,
        }
