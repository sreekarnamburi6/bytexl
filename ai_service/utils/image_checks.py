from __future__ import annotations

from io import BytesIO
import warnings

from PIL import Image, UnidentifiedImageError

from .constants import MAX_IMAGE_PIXELS

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS


def inspect_image_bytes(image_bytes: bytes) -> dict[str, int | str]:
    """Validate encoding and dimensions, without claiming medical modality detection."""
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", Image.DecompressionBombWarning)
            with Image.open(BytesIO(image_bytes)) as image:
                image_format = image.format
                width, height = image.size
                if image_format not in {"PNG", "JPEG"}:
                    raise ValueError("Only PNG and JPEG images are supported.")
                image.verify()
    except (UnidentifiedImageError, Image.DecompressionBombError, Image.DecompressionBombWarning) as error:
        raise ValueError("The uploaded file is not a safe, valid image.") from error

    if width < 32 or height < 32:
        raise ValueError("Image dimensions are too small for model input.")
    return {"format": str(image_format), "width": width, "height": height}
