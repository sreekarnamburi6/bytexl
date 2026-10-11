from __future__ import annotations

from ..models_registry import predict_image


def run_image_model(model_id: str, image_bytes: bytes) -> dict:
    return predict_image(model_id, image_bytes)