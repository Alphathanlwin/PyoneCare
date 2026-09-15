import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models.enums import Condition, RiskLevel, Urgency


class SymptomPayload(BaseModel):
    cold_sensitivity: bool
    hot_sensitivity: bool
    pressure_pain: bool
    spontaneous_pain: bool
    bleeding_gums: bool
    swollen_gums: bool
    receding_gums: bool
    black_spot: bool
    white_spot: bool
    yellow_staining: bool
    bad_breath: bool
    dry_mouth: bool
    mouth_ulcer: bool
    burning_sensation: bool
    loose_tooth: bool
    broken_tooth: bool
    brushes_twice_daily: bool
    uses_floss: bool
    sugary_diet: bool
    acid_exposure: bool

    model_config = ConfigDict(extra="forbid")


class PhotosPayload(BaseModel):
    """Base64-encoded (optionally data:-URI-prefixed) guided-capture photos.
    All three angles are optional/nullable — a user may skip the camera step
    entirely or fall back to uploading only some of them.
    """

    front: str | None = None
    upper: str | None = None
    lower: str | None = None


class AssessmentCreateRequest(BaseModel):
    symptoms: SymptomPayload
    photos: PhotosPayload = PhotosPayload()


class RecommendationResponse(BaseModel):
    id: uuid.UUID
    action: str
    urgency: Urgency

    model_config = ConfigDict(from_attributes=True)


class DiagnosisResponse(BaseModel):
    id: uuid.UUID
    condition: Condition
    explanation: str
    triggered_rules: list[str]
    recommendations: list[RecommendationResponse]

    model_config = ConfigDict(from_attributes=True)


class AssessmentResponse(BaseModel):
    id: uuid.UUID
    created_at: datetime
    risk_level: RiskLevel
    diagnoses: list[DiagnosisResponse]

    model_config = ConfigDict(from_attributes=True)
