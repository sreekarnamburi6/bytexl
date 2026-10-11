from __future__ import annotations

from ._shared import run_image_model


def predict_kidney_stone(image_bytes: bytes) -> dict:
    return run_image_model("kidney_stone", image_bytes)