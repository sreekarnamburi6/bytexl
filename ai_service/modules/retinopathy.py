from __future__ import annotations

from ._shared import run_image_model


def predict_retinopathy(image_bytes: bytes) -> dict:
    return run_image_model("retinopathy", image_bytes)
