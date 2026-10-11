"""Disease-specific, lazy model adapters."""

from .brain_tumor import predict_brain_tumor
from .glaucoma import predict_glaucoma
from .kidney_stone import predict_kidney_stone
from .malaria import predict_malaria
from .pneumonia import predict_pneumonia
from .retinopathy import predict_retinopathy
from .tuberculosis import predict_tuberculosis

IMAGE_PREDICTORS = {
    "brain_tumor": predict_brain_tumor,
    "glaucoma": predict_glaucoma,
    "kidney_stone": predict_kidney_stone,
    "malaria": predict_malaria,
    "pneumonia": predict_pneumonia,
    "retinopathy": predict_retinopathy,
    "tuberculosis": predict_tuberculosis,
}