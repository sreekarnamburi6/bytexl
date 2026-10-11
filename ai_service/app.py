from __future__ import annotations

import hmac
import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")
os.environ["KERAS_BACKEND"] = "torch"

from flask import Flask, jsonify, request
from werkzeug.exceptions import RequestEntityTooLarge

from .models_registry import ModelUnavailableError, list_models
from .modules import IMAGE_PREDICTORS
from .utils.constants import MAX_UPLOAD_BYTES
from .utils.image_checks import inspect_image_bytes


def create_app(service_token: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES + 1024 * 1024
    expected_token = service_token if service_token is not None else os.environ.get("AI_SERVICE_TOKEN", "")

    @app.before_request
    def authenticate_internal_calls():
        if request.path.startswith("/v1/"):
            if not expected_token:
                return jsonify({"error": "The local AI service token is not configured."}), 503
            provided = request.headers.get("Authorization", "")
            if not hmac.compare_digest(provided, f"Bearer {expected_token}"):
                return jsonify({"error": "Unauthorized AI service request."}), 401
        return None

    @app.get("/v1/health")
    def health():
        return jsonify({"ok": True, "engine": "keras-3-torch"})

    @app.get("/v1/models")
    def models():
        return jsonify({"models": list_models()})

    @app.post("/v1/predict")
    def predict():
        model_id = request.form.get("model_id", "")
        predictor = IMAGE_PREDICTORS.get(model_id)
        upload = request.files.get("image")
        if predictor is None:
            return jsonify({"error": "This model is not enabled."}), 422
        if upload is None:
            return jsonify({"error": "An image file is required."}), 400

        image_bytes = upload.read(MAX_UPLOAD_BYTES + 1)
        if not image_bytes:
            return jsonify({"error": "The uploaded image is empty."}), 400
        if len(image_bytes) > MAX_UPLOAD_BYTES:
            return jsonify({"error": "Image is larger than the 15 MB limit."}), 413

        try:
            image_info = inspect_image_bytes(image_bytes)
            result = predictor(image_bytes)
        except ValueError as error:
            return jsonify({"error": str(error)}), 422
        except ModelUnavailableError as error:
            return jsonify({"error": str(error)}), 503
        except Exception:
            app.logger.exception("Model inference failed for %s", model_id)
            return jsonify({"error": "Model inference failed. No result was generated."}), 503

        return jsonify({**result, "image": image_info})

    @app.errorhandler(RequestEntityTooLarge)
    def upload_too_large(_error):
        return jsonify({"error": "Image is larger than the 15 MB limit."}), 413

    return app


app = create_app()


if __name__ == "__main__":
    if not os.environ.get("AI_SERVICE_TOKEN"):
        raise SystemExit("Set AI_SERVICE_TOKEN before starting the AI service.")
    app.run(host="127.0.0.1", port=int(os.environ.get("AI_SERVICE_PORT", "8001")), debug=False, threaded=False)