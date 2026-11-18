from typing import Dict, Optional, Tuple
import cv2
import numpy as np


class PreprocessedData:
    def __init__(
        self,
        original: np.ndarray,
        resized: np.ndarray,
        grayscale: np.ndarray,
        blurred: np.ndarray,
        bilateral: np.ndarray,
        clahe: np.ndarray,
        edges: np.ndarray,
        morph_gradient: np.ndarray,
        blackhat: np.ndarray,
    ):
        self.original = original
        self.resized = resized
        self.grayscale = grayscale
        self.blurred = blurred
        self.bilateral = bilateral
        self.clahe = clahe
        self.edges = edges
        self.morph_gradient = morph_gradient
        self.blackhat = blackhat


def validate_image(img: Optional[np.ndarray]) -> Tuple[bool, str]:
    """Validate that the image is a valid, non-empty OpenCV array with expected shape."""
    if img is None:
        return False, "Image object is None."
    if not isinstance(img, np.ndarray):
        return False, "Image is not a valid numpy ndarray."
    if img.size == 0 or len(img.shape) < 2:
        return False, "Image is empty or has invalid dimensional rank."
    h, w = img.shape[:2]
    if h < 32 or w < 32:
        return False, f"Image resolution ({w}x{h}) is too small for inspection."
    return True, "Image is valid."


def preprocess_image(
    img: np.ndarray,
    target_width: int = 640,
    target_height: int = 480,
    apply_clahe: bool = True,
    canny_low: int = 50,
    canny_high: int = 150,
) -> PreprocessedData:
    """Execute complete classical computer vision preprocessing pipeline."""
    is_valid, msg = validate_image(img)
    if not is_valid:
        raise ValueError(f"Preprocessing validation failed: {msg}")

    # Preserve original copy
    original_copy = img.copy()

    # Resize to standard inspection dimensions if required
    h, w = img.shape[:2]
    if w != target_width or h != target_height:
        resized = cv2.resize(original_copy, (target_width, target_height), interpolation=cv2.INTER_AREA)
    else:
        resized = original_copy.copy()

    # Convert to grayscale
    if len(resized.shape) == 3:
        grayscale = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    else:
        grayscale = resized.copy()

    # Gaussian Blur (kernel 5x5, sigma=1.2)
    blurred = cv2.GaussianBlur(grayscale, (5, 5), 1.2)

    # Bilateral Filter (diameter=9, sigmaColor=75, sigmaSpace=75) - preserves sharp edges while smoothing texture
    bilateral = cv2.bilateralFilter(grayscale, 9, 75, 75)

    # Contrast Limited Adaptive Histogram Equalization (CLAHE)
    if apply_clahe:
        clahe_obj = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        clahe = clahe_obj.apply(bilateral)
    else:
        clahe = bilateral.copy()

    # Morphological Operations
    kernel_rect = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    morph_gradient = cv2.morphologyEx(clahe, cv2.MORPH_GRADIENT, kernel_rect)

    # Black-hat transform (highlights dark structures against brighter casing)
    kernel_cross = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
    blackhat = cv2.morphologyEx(grayscale, cv2.MORPH_BLACKHAT, kernel_cross)

    # Canny Edge Detection
    edges = cv2.Canny(bilateral, canny_low, canny_high)

    return PreprocessedData(
        original=original_copy,
        resized=resized,
        grayscale=grayscale,
        blurred=blurred,
        bilateral=bilateral,
        clahe=clahe,
        edges=edges,
        morph_gradient=morph_gradient,
        blackhat=blackhat,
    )
