from datetime import datetime, timezone
import time
from typing import Dict, List, Optional, Tuple
import cv2
import numpy as np

from backend.app.models.schemas import (
    BoundingBox,
    IndividualCheck,
    InspectionConfig,
    InspectionFlags,
    InspectionResult,
)
from backend.app.vision.preprocessing import PreprocessedData, preprocess_image, validate_image
from backend.app.vision.synthetic_samples import cv2_to_base64


class DefectDetector:
    def __init__(self, config: Optional[InspectionConfig] = None):
        self.config = config or InspectionConfig()

    def analyze(self, img: np.ndarray, sample_id_or_filename: str = "custom_input") -> InspectionResult:
        """Run complete defect detection pipeline on an input image."""
        start_time = time.perf_counter()
        timestamp = datetime.now(timezone.utc).isoformat()

        # Step 0: Image Validation
        is_valid, val_msg = validate_image(img)
        if not is_valid:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return self._build_unreadable_result(
                sample_id_or_filename,
                timestamp,
                duration_ms,
                f"Invalid image: {val_msg}",
            )

        # Step 1: Preprocessing
        try:
            prep: PreprocessedData = preprocess_image(
                img,
                target_width=self.config.image_resolution[0],
                target_height=self.config.image_resolution[1],
            )
        except Exception as e:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return self._build_unreadable_result(
                sample_id_or_filename,
                timestamp,
                duration_ms,
                f"Preprocessing failed: {str(e)}",
            )

        annotated = prep.resized.copy()
        defects: List[str] = []
        checks: Dict[str, IndividualCheck] = {}

        # Step 2: Check A - Product Detection
        product_ok, product_bbox, product_contour, prod_check = self._check_product_detection(
            prep.grayscale, annotated
        )
        checks["product_detection"] = prod_check

        if not product_ok or product_contour is None or product_bbox is None:
            duration_ms = (time.perf_counter() - start_time) * 1000.0
            return self._build_unreadable_result(
                sample_id_or_filename,
                timestamp,
                duration_ms,
                prod_check.details,
                annotated_img=annotated,
                edge_img=prep.edges,
                processed_img=prep.clahe,
                grayscale_img=prep.grayscale,
                enhanced_img=prep.clahe,
            )

        # Step 3: Check B - Label Inspection
        label_ok, label_check = self._check_label(prep.grayscale, annotated)
        checks["label_inspection"] = label_check
        if not label_ok:
            defects.append("Missing white identification label.")

        # Step 4: Check C - Colour Inspection
        color_ok, color_check = self._check_marking_color(prep.resized, annotated)
        checks["color_inspection"] = color_check
        if not color_ok:
            defects.append("Identification marking colour outside specification (Blue expected).")

        # Step 5: Check D - Component Inspection
        comp_ok, comp_check, missing_comps = self._check_components(prep.grayscale, prep.edges, annotated)
        checks["component_inspection"] = comp_check
        if not comp_ok:
            defects.append(f"Missing electronic component(s): {', '.join(missing_comps)}.")

        # Step 6: Check E - Outline / Geometry Inspection
        outline_ok, outline_check = self._check_outline(product_contour, product_bbox, annotated)
        checks["outline_inspection"] = outline_check
        if not outline_ok:
            defects.append(outline_check.details)

        # Step 7: Check F - Surface Scratch Inspection
        scratch_found, scratch_check, _ = self._check_surface_scratch(
            prep.grayscale, prep.edges, product_contour, annotated
        )
        checks["surface_inspection"] = scratch_check
        if scratch_found:
            defects.append("Abrasive surface scratch defect detected on casing.")

        # Aggregate preliminary status
        surface_ok = not scratch_found
        all_passed = (
            product_ok
            and label_ok
            and color_ok
            and comp_ok
            and outline_ok
            and surface_ok
        )

        status = "PASS" if all_passed else "REJECT"

        # Overlay final status banner
        self._draw_status_banner(annotated, status, defects, sample_id_or_filename)

        duration_ms = (time.perf_counter() - start_time) * 1000.0

        flags = InspectionFlags(
            product_detected=1 if product_ok else 0,
            label_present=1 if label_ok else 0,
            marking_correct=1 if color_ok else 0,
            components_complete=1 if comp_ok else 0,
            geometry_ok=1 if outline_ok else 0,
            surface_defect_detected=1 if scratch_found else 0,
        )

        return InspectionResult(
            sample_id_or_filename=sample_id_or_filename,
            timestamp=timestamp,
            processing_time_ms=round(duration_ms, 2),
            status=status,
            product_bounding_box=product_bbox,
            flags=flags,
            checks=checks,
            defect_descriptions=defects,
            annotated_image=cv2_to_base64(annotated),
            edge_image=cv2_to_base64(prep.edges),
            processed_image=cv2_to_base64(prep.clahe),
            grayscale_image=cv2_to_base64(prep.grayscale),
            enhanced_image=cv2_to_base64(prep.clahe),
        )

    # -------------------------------------------------------------------------
    # INDIVIDUAL INSPECTION ALGORITHMS
    # -------------------------------------------------------------------------

    def _check_product_detection(
        self, grayscale: np.ndarray, annotated: np.ndarray
    ) -> Tuple[bool, Optional[BoundingBox], Optional[np.ndarray], IndividualCheck]:
        """Detect product casing against neutral light background."""
        _, thresh = cv2.threshold(grayscale, 160, 255, cv2.THRESH_BINARY_INV)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if not contours:
            check = IndividualCheck(
                check_name="Product Presence",
                passed=False,
                binary_flag=0,
                measured_value="0 px",
                threshold="> 50,000 px",
                details="No product casing detected in field of view.",
            )
            return False, None, None, check

        # Find largest contour
        largest_cnt = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_cnt)

        min_expected_area = 50000.0
        max_expected_area = 240000.0

        if area < min_expected_area or area > max_expected_area:
            check = IndividualCheck(
                check_name="Product Presence",
                passed=False,
                binary_flag=0,
                measured_value=f"{int(area):,} px",
                threshold="50,000 - 240,000 px",
                details=f"Detected contour area ({int(area):,} px) outside allowable bounds.",
            )
            return False, None, None, check

        x, y, w, h = cv2.boundingRect(largest_cnt)
        bbox = BoundingBox(x=int(x), y=int(y), width=int(w), height=int(h))

        center_x = x + w / 2.0
        center_y = y + h / 2.0
        centered = (260 <= center_x <= 380) and (190 <= center_y <= 290)

        passed = centered
        cv2.rectangle(
            annotated,
            (x, y),
            (x + w, y + h),
            (0, 255, 0) if passed else (0, 0, 255),
            2,
        )

        check = IndividualCheck(
            check_name="Product Presence & Position",
            passed=passed,
            binary_flag=1 if passed else 0,
            measured_value=f"Center ({int(center_x)}, {int(center_y)}), Area {int(area):,} px",
            threshold="Center in zone [260-380, 190-290]",
            details="Product correctly detected and positioned within inspection zone." if passed else "Product misaligned.",
            bbox=bbox,
        )
        return passed, bbox, largest_cnt, check

    def _check_label(self, grayscale: np.ndarray, annotated: np.ndarray) -> Tuple[bool, IndividualCheck]:
        """Verify presence of white identification label."""
        roi_cfg = self.config.label_roi
        x, y, w, h = roi_cfg.x, roi_cfg.y, roi_cfg.width, roi_cfg.height
        label_crop = grayscale[y : y + h, x : x + w]

        mean_val = float(np.mean(label_crop))
        threshold = self.config.min_label_brightness  # 200.0

        passed = mean_val >= threshold
        color = (0, 255, 0) if passed else (0, 0, 255)
        cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)
        cv2.putText(
            annotated,
            f"LABEL: {'OK' if passed else 'FAIL'}",
            (x, y - 6),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA,
        )

        check = IndividualCheck(
            check_name="Identification Label Check",
            passed=passed,
            binary_flag=1 if passed else 0,
            measured_value=f"Mean brightness {mean_val:.1f} / 255",
            threshold=f">= {threshold:.1f}",
            details="White identification label present and verified." if passed else "Missing white identification label.",
            bbox=roi_cfg,
        )
        return passed, check

    def _check_marking_color(self, bgr_img: np.ndarray, annotated: np.ndarray) -> Tuple[bool, IndividualCheck]:
        """Verify identification marking badge conforms to specified blue hue range."""
        roi_cfg = self.config.marking_roi
        x, y, w, h = roi_cfg.x, roi_cfg.y, roi_cfg.width, roi_cfg.height
        crop_bgr = bgr_img[y : y + h, x : x + w]

        crop_hsv = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2HSV)
        lower_blue = np.array(self.config.hsv_blue_range["lower"], dtype=np.uint8)
        upper_blue = np.array(self.config.hsv_blue_range["upper"], dtype=np.uint8)

        mask = cv2.inRange(crop_hsv, lower_blue, upper_blue)
        blue_pixels = int(cv2.countNonZero(mask))

        min_blue_threshold = 800
        passed = blue_pixels >= min_blue_threshold

        color = (0, 255, 0) if passed else (0, 0, 255)
        cx = x + w // 2
        cy = y + h // 2
        cv2.circle(annotated, (cx, cy), 32, color, 2)
        cv2.putText(
            annotated,
            f"MARKING: {'OK' if passed else 'FAIL'}",
            (x - 5, y - 8),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.45,
            color,
            1,
            cv2.LINE_AA,
        )

        check = IndividualCheck(
            check_name="Marking Colour Verification",
            passed=passed,
            binary_flag=1 if passed else 0,
            measured_value=f"{blue_pixels} blue pixels (HSV [95-135])",
            threshold=f">= {min_blue_threshold} px",
            details="Identification stamp colour conforms to standard Blue." if passed else "Incorrect marking hue (expected Blue, non-conforming colour detected).",
            bbox=roi_cfg,
        )
        return passed, check

    def _check_components(
        self, grayscale: np.ndarray, edges: np.ndarray, annotated: np.ndarray
    ) -> Tuple[bool, IndividualCheck, List[str]]:
        """Verify all three terminal/electronic components are mounted."""
        missing: List[str] = []
        all_ok = True

        for i, roi_cfg in enumerate(self.config.component_rois):
            name = f"C{i+1}"
            x, y, w, h = roi_cfg.x, roi_cfg.y, roi_cfg.width, roi_cfg.height
            gray_crop = grayscale[y : y + h, x : x + w]
            edges_crop = edges[y : y + h, x : x + w]

            mean_brightness = float(np.mean(gray_crop))
            edge_count = int(np.count_nonzero(edges_crop))
            total_pixels = w * h
            edge_density = edge_count / float(total_pixels)

            comp_present = (mean_brightness >= 78.0) and (edge_density >= self.config.min_component_edge_density)

            cx = x + w // 2
            cy = y + h // 2
            color = (0, 255, 0) if comp_present else (0, 0, 255)
            cv2.circle(annotated, (cx, cy), 26, color, 2)
            cv2.putText(
                annotated,
                f"{name}: {'OK' if comp_present else 'MISSING'}",
                (x - 6, y + h + 16),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.38,
                color,
                1,
                cv2.LINE_AA,
            )

            if not comp_present:
                missing.append(name)
                all_ok = False

        check = IndividualCheck(
            check_name="Electronic Component Presence (3x)",
            passed=all_ok,
            binary_flag=1 if all_ok else 0,
            measured_value=f"{3 - len(missing)}/3 present",
            threshold="3/3 components present",
            details="All 3 components verified." if all_ok else f"Missing component(s): {', '.join(missing)}.",
        )
        return all_ok, check, missing

    def _check_outline(
        self, contour: np.ndarray, bbox: BoundingBox, annotated: np.ndarray
    ) -> Tuple[bool, IndividualCheck]:
        """Analyze contour solidity, rectangularity, dimensions, and vertices."""
        area = float(cv2.contourArea(contour))
        hull = cv2.convexHull(contour)
        hull_area = float(cv2.contourArea(hull))

        solidity = area / hull_area if hull_area > 0 else 0.0
        aspect_ratio = float(bbox.width) / float(bbox.height) if bbox.height > 0 else 0.0

        bbox_area = float(bbox.width * bbox.height)
        rectangularity = area / bbox_area if bbox_area > 0 else 0.0

        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)
        vertex_count = len(approx)

        # Nominal rectangle:
        # solidity >= 0.985, rectangularity >= 0.985, vertex_count == 4, aspect_ratio in [1.25, 1.42]
        solid_ok = solidity >= 0.985
        rect_ok = rectangularity >= 0.985
        vert_ok = (vertex_count == 4)
        aspect_ok = (1.25 <= aspect_ratio <= 1.42)

        passed = solid_ok and rect_ok and vert_ok and aspect_ok

        color = (0, 255, 0) if passed else (0, 0, 255)
        cv2.drawContours(annotated, [contour], -1, color, 2)
        if not passed:
            cv2.putText(
                annotated,
                "CONTOUR DEFECT",
                (bbox.x + 10, bbox.y + 24),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (0, 0, 255),
                2,
                cv2.LINE_AA,
            )

        details = "Nominal rectangular geometry verified." if passed else (
            f"Structural contour defect: solidity {solidity:.3f}, rect-ratio {rectangularity:.3f}, vertices {vertex_count}."
        )

        check = IndividualCheck(
            check_name="Structural Outline & Geometry",
            passed=passed,
            binary_flag=1 if passed else 0,
            measured_value=f"Solidity: {solidity:.3f}, Rect: {rectangularity:.3f}, Vertices: {vertex_count}",
            threshold="Solidity >= 0.985, Rect >= 0.985, Vertices = 4, AR in [1.25, 1.42]",
            details=details,
            bbox=bbox,
        )
        return passed, check

    def _check_surface_scratch(
        self,
        grayscale: np.ndarray,
        edges: np.ndarray,
        product_contour: np.ndarray,
        annotated: np.ndarray,
    ) -> Tuple[bool, IndividualCheck, List[Tuple[int, int]]]:
        """Detect abrasive scratches on casing surface excluding labels, markings, components, and casing boundary."""
        h, w = grayscale.shape[:2]

        # 1. Start with mask strictly inside product contour, eroded by 16px to stay safely inside casing border
        casing_mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(casing_mask, [product_contour], -1, 255, -1)
        erode_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 17))
        surface_mask = cv2.erode(casing_mask, erode_kernel)

        # 2. Exclude label region with safety margin
        cv2.rectangle(surface_mask, (150, 120), (320, 220), 0, -1)
        # 3. Exclude marking region with safety margin
        cv2.circle(surface_mask, (420, 170), 42, 0, -1)
        # 4. Exclude component regions with safety margin
        for roi_cfg in self.config.component_rois:
            cx = roi_cfg.x + roi_cfg.width // 2
            cy = roi_cfg.y + roi_cfg.height // 2
            cv2.circle(surface_mask, (cx, cy), 38, 0, -1)
        # 5. Exclude screws
        for sc in [(140, 110), (500, 110), (140, 370), (500, 370)]:
            cv2.circle(surface_mask, sc, 20, 0, -1)

        # Detect scratches: dark line features (pixel intensity < 30) or high edge response strictly in surface ROI
        surface_gray = cv2.bitwise_and(grayscale, grayscale, mask=surface_mask)
        surface_edges = cv2.bitwise_and(edges, edges, mask=surface_mask)

        # Dark scratch threshold
        _, dark_thresh = cv2.threshold(surface_gray, 30, 255, cv2.THRESH_BINARY_INV)
        dark_scratch = cv2.bitwise_and(dark_thresh, surface_mask)

        scratch_combined = cv2.bitwise_or(dark_scratch, surface_edges)
        scratch_combined = cv2.bitwise_and(scratch_combined, surface_mask)

        contours, _ = cv2.findContours(scratch_combined, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        scratch_found = False
        max_defect_length = 0.0
        defect_pts: List[Tuple[int, int]] = []

        for cnt in contours:
            length = cv2.arcLength(cnt, False)
            cnt_area = cv2.contourArea(cnt)
            if length >= 26.0 or cnt_area >= self.config.scratch_threshold_pixels:
                scratch_found = True
                max_defect_length = max(max_defect_length, length)
                cv2.drawContours(annotated, [cnt], -1, (0, 0, 255), 2)
                x, y, cw, ch = cv2.boundingRect(cnt)
                cv2.rectangle(annotated, (x - 4, y - 4), (x + cw + 4, y + ch + 4), (0, 0, 255), 2)
                cv2.putText(
                    annotated,
                    "SCRATCH",
                    (x - 4, y - 8),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.45,
                    (0, 0, 255),
                    1,
                    cv2.LINE_AA,
                )

        check = IndividualCheck(
            check_name="Surface Scratch Inspection",
            passed=not scratch_found,
            binary_flag=0 if scratch_found else 1,
            measured_value=f"Max scratch length: {max_defect_length:.1f} px",
            threshold=f"< 26.0 px length and < {self.config.scratch_threshold_pixels} px area",
            details="Surface clean, zero defects detected." if not scratch_found else f"Surface scratch detected (length {max_defect_length:.1f} px).",
        )
        return scratch_found, check, defect_pts

    def _draw_status_banner(
        self,
        img: np.ndarray,
        status: str,
        defects: List[str],
        sample_id: str,
    ) -> None:
        """Draw an industrial status banner across the top of the annotated image."""
        banner_h = 42
        color = (0, 180, 0) if status == "PASS" else ((0, 0, 220) if status == "REJECT" else (0, 160, 230))
        cv2.rectangle(img, (0, 0), (img.shape[1], banner_h), (25, 28, 32), -1)
        cv2.line(img, (0, banner_h), (img.shape[1], banner_h), color, 2)

        # Status Badge
        cv2.rectangle(img, (12, 8), (110, 34), color, -1)
        cv2.putText(img, status, (22, 27), cv2.FONT_HERSHEY_DUPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

        # Sample and verdict text
        label_text = f"Sample: {sample_id} | Verdict: {status}"
        if defects:
            label_text += f" ({len(defects)} fault{'s' if len(defects) > 1 else ''})"
        cv2.putText(img, label_text, (125, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (230, 235, 240), 1, cv2.LINE_AA)

    def _build_unreadable_result(
        self,
        sample_id: str,
        timestamp: str,
        duration_ms: float,
        reason: str,
        annotated_img: Optional[np.ndarray] = None,
        edge_img: Optional[np.ndarray] = None,
        processed_img: Optional[np.ndarray] = None,
        grayscale_img: Optional[np.ndarray] = None,
        enhanced_img: Optional[np.ndarray] = None,
    ) -> InspectionResult:
        """Helper to create an UNREADABLE inspection result."""
        empty_img = np.zeros((480, 640, 3), dtype=np.uint8)
        if annotated_img is None:
            annotated_img = empty_img.copy()
            cv2.putText(annotated_img, "UNREADABLE", (200, 240), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 165, 255), 2)

        flags = InspectionFlags(
            product_detected=0,
            label_present=0,
            marking_correct=0,
            components_complete=0,
            geometry_ok=0,
            surface_defect_detected=0,
        )

        checks = {
            "product_detection": IndividualCheck(
                check_name="Product Presence",
                passed=False,
                binary_flag=0,
                measured_value="None",
                threshold="Valid product contour",
                details=reason,
            )
        }

        return InspectionResult(
            sample_id_or_filename=sample_id,
            timestamp=timestamp,
            processing_time_ms=round(duration_ms, 2),
            status="UNREADABLE",
            product_bounding_box=None,
            flags=flags,
            checks=checks,
            defect_descriptions=[reason],
            annotated_image=cv2_to_base64(annotated_img),
            edge_image=cv2_to_base64(edge_img if edge_img is not None else empty_img[:, :, 0]),
            processed_image=cv2_to_base64(processed_img if processed_img is not None else empty_img),
            grayscale_image=cv2_to_base64(grayscale_img if grayscale_img is not None else empty_img[:, :, 0]),
            enhanced_image=cv2_to_base64(enhanced_img if enhanced_img is not None else empty_img),
        )
