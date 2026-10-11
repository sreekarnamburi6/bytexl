"""Lazy and allowlisted access to supplied image classification models."""

from __future__ import annotations

import gc
import json
import math
import os
from pathlib import Path
from threading import Lock
from typing import Any

from .utils.image_preprocess import prepare_image

REGISTRY_PATH = Path(__file__).with_name("model.registry.json")
MODEL_DIRECTORY = Path(__file__).with_name("models")
REGISTRY: dict[str, dict[str, Any]] = json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))
_model_lock = Lock()
_loaded_model_id: str | None = None
_loaded_model: Any = None


class ModelUnavailableError(RuntimeError):
    """Raised when a model is disabled or its artifact is incompatible."""


def list_models() -> list[dict[str, Any]]:
    return [
        {"id": model_id, **{key: value for key, value in spec.items() if key != "file"}}
        for model_id, spec in REGISTRY.items()
    ]


def _load_model(model_id: str) -> tuple[Any, dict[str, Any]]:
    global _loaded_model, _loaded_model_id

    spec = REGISTRY.get(model_id)
    if spec is None:
        raise ModelUnavailableError("Unknown model.")
    if not spec["enabled"]:
        raise ModelUnavailableError(spec["disabled_reason"])

    with _model_lock:
        if _loaded_model_id == model_id and _loaded_model is not None:
            return _loaded_model, spec

        os.environ["KERAS_BACKEND"] = "torch"
        import keras

        if _loaded_model is not None:
            del _loaded_model
            _loaded_model = None
            _loaded_model_id = None
            keras.backend.clear_session()
            gc.collect()

        artifact = (MODEL_DIRECTORY / spec["file"]).resolve()
        if artifact.parent != MODEL_DIRECTORY.resolve() or not artifact.is_file():
            raise ModelUnavailableError("The configured model artifact is missing or invalid.")

        try:
            model = keras.models.load_model(artifact, compile=False, safe_mode=True)
        except Exception as error:
            raise ModelUnavailableError("This model could not be loaded by the configured Keras runtime.") from error

        if tuple(model.input_shape[1:]) != (224, 224, 3):
            raise ModelUnavailableError("The model input shape does not match the verified registry.")
        expected_outputs = 1 if spec["output"] == "binary_sigmoid" else len(spec["labels"])
        if int(model.output_shape[-1]) != expected_outputs:
            raise ModelUnavailableError("The model output count does not match the verified class map.")

        _loaded_model = model
        _loaded_model_id = model_id
        return model, spec


def predict_image(model_id: str, image_bytes: bytes) -> dict[str, Any]:
    model, spec = _load_model(model_id)
    batch = prepare_image(image_bytes, spec["preprocessing"])

    with _model_lock:
        raw = model.predict(batch, verbose=0)

    values = [float(value) for value in raw[0]]
    if spec["output"] == "binary_sigmoid":
        positive_score = values[0]
        scores = [1.0 - positive_score, positive_score]
    else:
        scores = values

    if len(scores) != len(spec["labels"]) or any(not math.isfinite(score) for score in scores):
        raise ModelUnavailableError("The model returned an invalid score vector.")
    if any(score < 0.0 or score > 1.0 for score in scores):
        raise ModelUnavailableError("The model returned scores outside the probability range.")
    if spec["output"] == "multiclass_softmax" and not math.isclose(sum(scores), 1.0, abs_tol=0.05):
        raise ModelUnavailableError("The model returned an invalid softmax score vector.")

    ranked = sorted(zip(spec["labels"], scores), key=lambda item: item[1], reverse=True)
    return {
        "model_id": model_id,
        "model_name": spec["name"],
        "label": ranked[0][0],
        "score": ranked[0][1],
        "scores": [{"label": label, "score": score} for label, score in ranked],
        "engine": "keras-3-torch",
        "result_type": "experimental_model_output",
        "disclaimer": "Real-time image-classification result only; it is not a medical diagnosis.",
    }
