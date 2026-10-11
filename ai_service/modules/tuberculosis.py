from __future__ import annotations

from ._shared import run_image_model


def predict_tuberculosis(image_bytes: bytes) -> dict:
    return run_image_model("tuberculosis", image_bytes)