from __future__ import annotations

from ._shared import run_image_model


def predict_brain_tumor(image_bytes: bytes) -> dict:
    return run_image_model("brain_tumor", image_bytes)
