from __future__ import annotations

from io import BytesIO
import warnings

import numpy as np
from PIL import Image, UnidentifiedImageError

from .constants import IMAGE_SIZE, MAX_IMAGE_PIXELS

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def prepare_image(image_bytes: bytes, preprocessing: str) -> np.ndarray:
    """Decode a bounded PNG/JPEG and apply only the registered model scaling."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(image_bytes)) as source:
                if source.format not in {"PNG", "JPEG"}:
                    raise ValueError("Only PNG and JPEG images are supported.")
                if source.width < 32 or source.height < 32:
                    raise ValueError("Image dimensions are too small for this model.")
                image = source.convert("RGB").resize(IMAGE_SIZE, Image.Resampling.BILINEAR)
    except (UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise ValueError("The image is invalid or exceeds the safe image size.") from error

    image_array = np.asarray(image, dtype=np.float32)
    if preprocessing == "zero_to_one":
        image_array /= 255.0
    elif preprocessing != "model_internal_0_to_255":
        raise ValueError("Unsupported model preprocessing configuration.")
    return np.expand_dims(image_array, axis=0)
