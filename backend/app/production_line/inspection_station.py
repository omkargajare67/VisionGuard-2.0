"""Inspection Station model integrating OpenCV vision engine with the production line."""

import time
from typing import Any, Dict, Optional
import numpy as np

from backend.app.production_line.models import ProductStatus, StationPositions
from backend.app.production_line.product import Product
from backend.app.vision.defect_detection import DefectDetector
from backend.app.vision.synthetic_samples import (
    SAMPLE_REGISTRY,
    base64_to_cv2,
    generate_sample_image,
)


class InspectionStation:
    def __init__(self, position: float = StationPositions.INSPECTION_STATION):
        self.position: float = float(position)
        self.detector = DefectDetector()
        self.current_product: Optional[Product] = None
        self.busy: bool = False
        self.last_inspection_time_ms: float = 0.0
        self.inspection_count: int = 0

    def execute_inspection(self, product: Product) -> Dict[str, Any]:
        """Execute real OpenCV defect detection on the given product.
        Updates product inspection_result and returns binary feature flags.
        Does NOT silently fall back to VG-001 or fabricate data."""
        self.busy = True
        self.current_product = product
        start_t = time.perf_counter()

        img: Optional[np.ndarray] = None
        sample_label = product.sample_id or product.name or "UNKNOWN"

        try:
            # 1. Custom image if uploaded
            if product.custom_image_base64:
                img = base64_to_cv2(product.custom_image_base64)
                if img is None:
                    raise ValueError(
                        f"Invalid or corrupted custom image payload for product '{product.product_id}'"
                    )

            # 2. Synthetic sample if sample_id provided
            elif product.sample_id:
                if product.sample_id not in SAMPLE_REGISTRY:
                    raise ValueError(
                        f"Invalid synthetic sample ID '{product.sample_id}' for product '{product.product_id}'"
                    )
                img = generate_sample_image(product.sample_id)
                sample_label = product.sample_id

            else:
                raise ValueError(
                    f"Product '{product.product_id}' has neither custom image nor valid sample ID"
                )

            # Run actual classical OpenCV inspection
            result_obj = self.detector.analyze(img, sample_id_or_filename=sample_label)
            result_dict = result_obj.model_dump()

            duration_ms = (time.perf_counter() - start_t) * 1000.0
            self.last_inspection_time_ms = round(duration_ms, 2)
            self.inspection_count += 1

            # Extract the 6 canonical DEAM binary flags
            # D = Product Detected / Workpiece Present
            # S = Surface Defect / Scratch
            # C = Components Complete
            # L = Label Present
            # M = Marking Colour Correct
            # G = Geometry Conforming / Product Outline
            flags_obj = result_obj.flags
            feature_flags = {
                "D": int(flags_obj.product_detected),
                "S": int(flags_obj.surface_defect_detected),
                "C": int(flags_obj.components_complete),
                "L": int(flags_obj.label_present),
                "M": int(flags_obj.marking_correct),
                "G": int(flags_obj.geometry_ok),
            }

            product.inspection_result = {
                "sample_id": sample_label,
                "status": result_dict.get("status", "REJECT"),
                "features": feature_flags,
                "flags": result_dict.get("flags", {}),
                "checks": result_dict.get("checks", {}),
                "defect_descriptions": result_dict.get("defect_descriptions", []),
                "processing_time_ms": self.last_inspection_time_ms,
                "annotated_image": result_dict.get("annotated_image", ""),
                "edge_image": result_dict.get("edge_image", ""),
                "processed_image": result_dict.get("processed_image", ""),
            }

            return feature_flags

        except Exception as e:
            self.last_inspection_time_ms = round((time.perf_counter() - start_t) * 1000.0, 2)
            product.status = ProductStatus.ERROR
            product.fault_reason = f"INSPECTION_FAILURE: {str(e)}"
            product.inspection_result = {
                "sample_id": sample_label,
                "status": "ERROR",
                "error": str(e),
                "processing_time_ms": self.last_inspection_time_ms,
            }
            raise e

        finally:
            self.busy = False

    def reset(self) -> None:
        self.current_product = None
        self.busy = False
        self.last_inspection_time_ms = 0.0
        self.inspection_count = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "position": round(self.position, 2),
            "busy": self.busy,
            "current_product_id": self.current_product.product_id if self.current_product else None,
            "last_inspection_time_ms": self.last_inspection_time_ms,
            "inspection_count": self.inspection_count,
        }
