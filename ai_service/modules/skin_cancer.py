from __future__ import annotations

from ..models_registry import ModelUnavailableError, predict_image


def predict_skin_cancer(image_bytes: bytes) -> dict:
    return predict_image("skin_cancer", image_bytes)
