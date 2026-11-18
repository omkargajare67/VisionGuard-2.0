import base64
from typing import Dict, List, Optional
import cv2
import numpy as np
from backend.app.models.schemas import SampleMetadata

CANVAS_WIDTH = 640
CANVAS_HEIGHT = 480

BACKGROUND_COLOR = (238, 240, 242)  # Light neutral gray in BGR
CASING_COLOR = (50, 55, 60)         # Dark industrial slate in BGR
CASING_BORDER = (85, 90, 95)
SCREW_RIM = (180, 185, 190)
SCREW_CORE = (30, 30, 35)

LABEL_BG = (250, 252, 255)          # Crisp white in BGR
LABEL_BORDER = (200, 200, 205)
LABEL_TEXT = (35, 35, 40)

BLUE_MARKING_COLOR = (220, 110, 25) # Industrial Blue in BGR (H: ~108, S: ~226, V: ~220)
RED_MARKING_COLOR = (25, 45, 230)   # Industrial Red/Orange in BGR (H: ~3, S: ~227, V: ~230)

COMP_BODY = (45, 135, 195)          # Metallic bronze/gold component body in BGR
COMP_BORDER = (30, 90, 130)
COMP_VENT = (20, 50, 80)
FOOTPRINT_COLOR = (70, 75, 80)      # Empty PCB silkscreen outline in BGR


def cv2_to_base64(img: np.ndarray, ext: str = ".jpg") -> str:
    """Encode OpenCV image to base64 data URI."""
    success, buffer = cv2.imencode(ext, img)
    if not success:
        return ""
    b64_str = base64.b64encode(buffer).decode("utf-8")
    mime = "image/jpeg" if ext.lower() in [".jpg", ".jpeg"] else "image/png"
    return f"data:{mime};base64,{b64_str}"


def base64_to_cv2(b64_str: str) -> Optional[np.ndarray]:
    """Decode base64 data URI to OpenCV BGR image."""
    try:
        if "," in b64_str:
            b64_str = b64_str.split(",")[1]
        decoded = base64.b64decode(b64_str)
        nparr = np.frombuffer(decoded, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def draw_screws(img: np.ndarray, corner_defect: bool = False) -> None:
    """Draw corner mounting screws on the product casing."""
    positions = [(140, 110), (140, 370), (500, 370)]
    if not corner_defect:
        positions.append((500, 110))
    for (cx, cy) in positions:
        cv2.circle(img, (cx, cy), 7, SCREW_RIM, -1)
        cv2.circle(img, (cx, cy), 5, SCREW_CORE, -1)
        cv2.line(img, (cx - 3, cy), (cx + 3, cy), SCREW_RIM, 1)


def draw_label(img: np.ndarray, present: bool = True) -> None:
    """Draw white identification label with barcode simulation."""
    if not present:
        return
    x, y, w, h = 160, 130, 150, 80
    cv2.rectangle(img, (x, y), (x + w, y + h), LABEL_BG, -1)
    cv2.rectangle(img, (x, y), (x + w, y + h), LABEL_BORDER, 1)
    cv2.putText(img, "VG-8086", (x + 10, y + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.55, LABEL_TEXT, 2)
    cv2.putText(img, "CTRL-UNIT", (x + 10, y + 42), cv2.FONT_HERSHEY_SIMPLEX, 0.38, LABEL_TEXT, 1)
    # Simulate barcode stripes
    for bx in range(x + 10, x + w - 10, 6):
        thickness = 2 if (bx // 6) % 2 == 0 else 1
        cv2.line(img, (bx, y + 50), (bx, y + 72), LABEL_TEXT, thickness)


def draw_marking(img: np.ndarray, color_bgr: tuple) -> None:
    """Draw circular identification marking badge."""
    cx, cy, r = 420, 170, 28
    cv2.circle(img, (cx, cy), r, color_bgr, -1)
    cv2.circle(img, (cx, cy), r, (255, 255, 255), 2)
    cv2.circle(img, (cx, cy), r - 8, (255, 255, 255), 1)
    cv2.putText(img, "OK", (cx - 12, cy + 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 2)


def draw_components(img: np.ndarray, missing_index: Optional[int] = None) -> None:
    """Draw three cylindrical electronic components along the bottom row."""
    positions = [(200, 300), (320, 300), (440, 300)]
    for i, (cx, cy) in enumerate(positions):
        if i == missing_index:
            # Draw missing component footprint
            cv2.circle(img, (cx, cy), 22, FOOTPRINT_COLOR, 1, cv2.LINE_AA)
            cv2.circle(img, (cx, cy), 4, (120, 125, 130), -1)
            cv2.putText(img, f"C{i+1}", (cx - 10, cy - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.35, FOOTPRINT_COLOR, 1)
        else:
            # Draw full component body
            cv2.circle(img, (cx, cy), 22, COMP_BODY, -1)
            cv2.circle(img, (cx, cy), 22, COMP_BORDER, 2)
            cv2.circle(img, (cx, cy), 14, (60, 160, 220), 1)
            # Component vent cross
            cv2.line(img, (cx - 8, cy), (cx + 8, cy), COMP_VENT, 2)
            cv2.line(img, (cx, cy - 8), (cx, cy + 8), COMP_VENT, 2)
            cv2.putText(img, f"C{i+1}", (cx - 10, cy - 26), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (150, 155, 160), 1)


def draw_casing(img: np.ndarray, corner_defect: bool = False) -> None:
    """Draw rectangular control module casing with optional corner defect."""
    x1, y1 = 120, 90
    x2, y2 = 520, 390

    if not corner_defect:
        cv2.rectangle(img, (x1, y1), (x2, y2), CASING_COLOR, -1)
        cv2.rectangle(img, (x1, y1), (x2, y2), CASING_BORDER, 2)
    else:
        # Inward structural notch cut into the top-right corner
        pts = np.array([
            [x1, y1],
            [430, y1],         # Top edge stops early
            [430, 160],        # Cuts deep into the casing
            [x2, 160],         # Moves out to right edge
            [x2, y2],          # Bottom-right
            [x1, y2],          # Bottom-left
        ], np.int32)
        cv2.fillPoly(img, [pts], CASING_COLOR)
        cv2.polylines(img, [pts], True, CASING_BORDER, 2)


def draw_scratch(img: np.ndarray) -> None:
    """Draw realistic high-contrast surface scratch in inspection zone."""
    pts = np.array([
        (335, 225),
        (350, 230),
        (365, 228),
        (378, 240),
        (395, 245),
        (405, 242),
    ], np.int32)
    for i in range(len(pts) - 1):
        cv2.line(img, tuple(pts[i]), tuple(pts[i + 1]), (15, 18, 22), 3, cv2.LINE_AA)
    # Secondary splinter branch
    cv2.line(img, (365, 228), (375, 220), (20, 22, 25), 2, cv2.LINE_AA)


SAMPLE_REGISTRY: Dict[str, Dict] = {
    "VG-001": {
        "name": "Nominal Control Module",
        "defect_category": "NONE",
        "expected_condition": "Nominal product. All components, label and marking are correct.",
        "expected_status": "PASS",
        "description": "Control unit meeting all dimensional, surface, and component placement tolerances.",
    },
    "VG-002": {
        "name": "Missing Identification Label",
        "defect_category": "LABEL_ABSENT",
        "expected_condition": "Missing identification label in designated inspection ROI.",
        "expected_status": "REJECT",
        "description": "White ID label absent. Fails product identification check.",
    },
    "VG-003": {
        "name": "Incorrect Marking Colour",
        "defect_category": "COLOUR_DEVIATION",
        "expected_condition": "Incorrect blue marking colour (Red/Orange detected instead).",
        "expected_status": "REJECT",
        "description": "Identification stamp has incorrect hue outside standard blue specification.",
    },
    "VG-004": {
        "name": "Missing Electronic Component",
        "defect_category": "MISSING_COMPONENT",
        "expected_condition": "One of three required components (C2) is missing from footprint.",
        "expected_status": "REJECT",
        "description": "Terminal component C2 missing from PCB mounting position.",
    },
    "VG-005": {
        "name": "Structural Outline Defect",
        "defect_category": "CONTOUR_DEVIATION",
        "expected_condition": "Incorrect outer contour with cut corner and low solidity.",
        "expected_status": "REJECT",
        "description": "Mechanical casing damage resulting in non-rectangular outline and broken edge.",
    },
    "VG-006": {
        "name": "Surface Scratch Defect",
        "defect_category": "SURFACE_SCRATCH",
        "expected_condition": "Visible dark surface scratch traversing module casing.",
        "expected_status": "REJECT",
        "description": "Surface abrasive defect detected exceeding allowable scratch length threshold.",
    },
}


def generate_sample_image(sample_id: str) -> np.ndarray:
    """Deterministically generate an industrial inspection sample image (640x480)."""
    # Create neutral light background
    img = np.full((CANVAS_HEIGHT, CANVAS_WIDTH, 3), BACKGROUND_COLOR, dtype=np.uint8)

    if sample_id not in SAMPLE_REGISTRY:
        raise ValueError(f"Unknown sample ID: {sample_id}")

    # 1. Base Casing
    corner_defect = (sample_id == "VG-005")
    draw_casing(img, corner_defect=corner_defect)

    # 2. Screws
    draw_screws(img, corner_defect=corner_defect)

    # 3. Label
    label_present = (sample_id != "VG-002")
    draw_label(img, present=label_present)

    # 4. Marking
    marking_color = RED_MARKING_COLOR if sample_id == "VG-003" else BLUE_MARKING_COLOR
    draw_marking(img, color_bgr=marking_color)

    # 5. Components
    missing_comp_idx = 1 if sample_id == "VG-004" else None
    draw_components(img, missing_index=missing_comp_idx)

    # 6. Surface Scratch
    if sample_id == "VG-006":
        draw_scratch(img)

    return img


def get_all_samples_metadata() -> List[SampleMetadata]:
    """Return catalog of all available synthetic sample definitions."""
    results = []
    for sid, info in SAMPLE_REGISTRY.items():
        results.append(
            SampleMetadata(
                sample_id=sid,
                name=info["name"],
                defect_category=info["defect_category"],
                expected_condition=info["expected_condition"],
                expected_status=info["expected_status"],
                description=info["description"],
            )
        )
    return results
