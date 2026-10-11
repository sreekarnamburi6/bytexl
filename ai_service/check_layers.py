from __future__ import annotations

import argparse

from .models_registry import ModelUnavailableError, REGISTRY, _load_model


def main() -> None:
    parser = argparse.ArgumentParser(description="Inspect model registry or load a single model.")
    parser.add_argument("model_id", nargs="?", help="Optional allowlisted model identifier")
    args = parser.parse_args()

    if not args.model_id:
        for model_id, spec in REGISTRY.items():
            status = "enabled" if spec["enabled"] else f"disabled: {spec['disabled_reason']}"
            print(f"{model_id}: {status}; output={spec['output']}; class count={len(spec['labels'])}")
        return

    try:
        model, spec = _load_model(args.model_id)
    except ModelUnavailableError as error:
        raise SystemExit(str(error)) from error

    print(f"{spec['name']}: input={model.input_shape}, output={model.output_shape}")
    for layer in model.layers:
        print(f"{layer.name}: {layer.__class__.__name__}")


if __name__ == "__main__":
    main()