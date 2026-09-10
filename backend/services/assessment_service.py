import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from exceptions import AssessmentNotFoundException, ForbiddenException
from models.assessment import Assessment
from models.diagnosis import Diagnosis
from models.enums import Condition, RiskLevel, Urgency
from models.recommendation import Recommendation
from models.symptom_response import SymptomResponse
from models.user import User
from schemas.assessment import AssessmentCreateRequest, AssessmentResponse
from services.cv_service import CVService, CVServiceUnavailableError
from services.prolog_service import PrologService
from utils.image_utils import decode_base64_image, save_image, validate_image

PHOTO_ANGLES = ("front", "upper", "lower")


class AssessmentService:
    async def list_for_user(self, user_id: uuid.UUID, page: int, size: int, db: AsyncSession) -> dict:
        offset = (page - 1) * size
        total_query = await db.scalar(select(func.count()).select_from(Assessment).where(Assessment.user_id == user_id))
        total = total_query or 0

        result = await db.execute(
            select(Assessment)
            .where(Assessment.user_id == user_id)
            .order_by(Assessment.created_at.desc())
            .offset(offset)
            .limit(size)
            .options(
                selectinload(Assessment.diagnoses).selectinload(Diagnosis.recommendations),
            )
        )
        assessments = result.scalars().all()

        return {
            "items": [AssessmentResponse.model_validate(item).model_dump(mode="json") for item in assessments],
            "total": total,
            "page": page,
            "size": size,
            "pages": max(1, (total + size - 1) // size) if total else 1,
        }

    async def get_for_user(self, assessment_id: str, user_id: uuid.UUID, db: AsyncSession) -> AssessmentResponse:
        # Queried without a user_id filter so a mismatched owner can be told
        # apart from a truly missing id (403 FORBIDDEN vs 404 NOT_FOUND),
        # rather than collapsing both into 404.
        result = await db.execute(
            select(Assessment)
            .where(Assessment.id == assessment_id)
            .options(
                selectinload(Assessment.diagnoses).selectinload(Diagnosis.recommendations),
            )
        )
        assessment = result.scalar_one_or_none()
        if assessment is None:
            raise AssessmentNotFoundException(assessment_id)
        if assessment.user_id != user_id:
            raise ForbiddenException()
        return AssessmentResponse.model_validate(assessment)

    async def create(
        self,
        payload: AssessmentCreateRequest,
        user: User,
        db: AsyncSession,
        cv_service: CVService,
        prolog_service: PrologService,
    ) -> AssessmentResponse:
        symptoms = dict(payload.symptoms.model_dump())
        photo_urls: dict[str, str | None] = {}
        image_analysis_result: dict[str, dict] = {}

        for angle in PHOTO_ANGLES:
            photo_base64 = getattr(payload.photos, angle)
            if not photo_base64:
                photo_urls[angle] = None
                continue

            image_bytes = decode_base64_image(photo_base64)
            image = validate_image(image_bytes)
            photo_urls[angle] = save_image(image_bytes, image.format)

            try:
                cv_response = await cv_service.analyze(image_bytes)
                image_analysis_result[angle] = cv_response
                for symptom_key in cv_service.extract_symptoms(cv_response):
                    symptoms[symptom_key] = True
            except CVServiceUnavailableError:
                # Graceful fallback: this photo's CV pass is skipped, but its
                # file is already saved, the other photos/angles still get a
                # CV pass, and the questionnaire symptoms are untouched — a
                # partial or total CV outage never fails the assessment.
                image_analysis_result[angle] = {"status": "CV_SERVICE_UNAVAILABLE"}

        active_symptoms = [key for key, value in symptoms.items() if value]
        diagnosis_result = await prolog_service.diagnose(active_symptoms)

        assessment = Assessment(
            user_id=user.id,
            risk_level=RiskLevel(diagnosis_result["overall_risk"]),
            photo_urls=photo_urls if any(photo_urls.values()) else None,
            image_analysis_result=image_analysis_result or None,
        )
        assessment.symptom_responses = [
            SymptomResponse(symptom_key=key, value=value) for key, value in symptoms.items()
        ]
        assessment.diagnoses = [self._build_diagnosis(d) for d in diagnosis_result["diagnoses"]]

        db.add(assessment)
        await db.commit()
        # Scoped to just the server-generated columns — a bare refresh()
        # expires (and thus lazy-loads on next access) every attribute,
        # including the diagnoses/recommendations relationships assigned
        # above in memory. Async lazy-loading can't run implicitly outside
        # a greenlet context, so touching them later raises MissingGreenlet.
        await db.refresh(assessment, attribute_names=["id", "created_at", "risk_level"])
        response = AssessmentResponse.model_validate(assessment)

        return response

    def _build_diagnosis(self, diagnosis: dict) -> Diagnosis:
        condition_key = diagnosis["condition"]
        risk_key = diagnosis["risk_level"]
        return Diagnosis(
            condition=Condition(condition_key),
            explanation=diagnosis["explanation"],
            # Prolog reports the winning risk_level/2 clause via once/1
            # (highest severity by clause order — see knowledge_base.pl's
            # report/0), not clause-level provenance, so triggered_rules
            # records the two predicate calls that actually succeeded for
            # this condition rather than a deeper per-clause trace.
            triggered_rules=[
                f"possible({condition_key.lower()})",
                f"risk_level({condition_key.lower()}, {risk_key.lower()})",
            ],
            recommendations=[
                Recommendation(action=r["action"], urgency=Urgency(r["urgency"]))
                for r in diagnosis["recommendations"]
            ],
        )
