from __future__ import annotations

import io
import unittest

from PIL import Image

from ai_service.app import create_app
from ai_service.models_registry import list_models


class ModelRegistryTests(unittest.TestCase):
    def test_only_verified_models_are_enabled(self) -> None:
        models = {model["id"]: model for model in list_models()}
        self.assertEqual(sum(model["enabled"] for model in models.values()), 7)
        self.assertFalse(models["skin_cancer"]["enabled"])
        self.assertNotIn("heart_disease", models)
        self.assertEqual(models["brain_tumor"]["labels"].__len__(), 4)

    def test_registry_shape_matches_declared_classes(self) -> None:
        for model in list_models():
            if not model["enabled"]:
                continue
            expected = 2 if model["output"] == "binary_sigmoid" else len(model["labels"])
            self.assertGreater(expected, 1, model["id"])
            self.assertEqual(len(model["labels"]), expected)


class InferenceApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = create_app("unit-test-secret").test_client()
        self.auth = {"Authorization": "Bearer unit-test-secret"}

    def test_service_requires_internal_token(self) -> None:
        self.assertEqual(self.client.get("/v1/models").status_code, 401)

    def test_catalog_does_not_load_weights(self) -> None:
        response = self.client.get("/v1/models", headers=self.auth)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json["models"]), 8)

    def test_disabled_model_is_rejected(self) -> None:
        response = self.client.post(
            "/v1/predict",
            headers=self.auth,
            data={"model_id": "skin_cancer", "image": (io.BytesIO(b"x"), "sample.png")},
        )
        self.assertEqual(response.status_code, 422)

    def test_invalid_image_is_rejected(self) -> None:
        response = self.client.post(
            "/v1/predict",
            headers=self.auth,
            data={"model_id": "pneumonia", "image": (io.BytesIO(b"not an image"), "sample.png")},
        )
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()