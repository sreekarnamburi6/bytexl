from __future__ import annotations

from ..models_registry import REGISTRY


def expected_modality(model_id: str) -> str:
    """Return the selected model's expected modality; no automatic modality claim is made."""
    spec = REGISTRY.get(model_id)
    if not spec or not spec["enabled"]:
        return "unavailable"
    return str(spec["modality"])
