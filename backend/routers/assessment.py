from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from dependencies import get_current_user
from models.user import User
from schemas.assessment import AssessmentCreateRequest
from services.assessment_service import AssessmentService
from services.cv_service import CVService
from services.prolog_service import PrologService
from utils.response import success_response

router = APIRouter()


@router.get("/")
async def list_assessments(
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    assessment_service: AssessmentService = Depends(AssessmentService),
):
    result = await assessment_service.list_for_user(current_user.id, page, size, db)
    return success_response(
        data=result,
        message="Assessments retrieved successfully.",
    )


@router.get("/{assessment_id}")
async def get_assessment(
    assessment_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    assessment_service: AssessmentService = Depends(AssessmentService),
):
    assessment = await assessment_service.get_for_user(assessment_id, current_user.id, db)
    return success_response(
        data=assessment.model_dump(mode="json"),
        message="Assessment retrieved successfully.",
    )


@router.post("/", status_code=201)
async def create_assessment(
    payload: AssessmentCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    assessment_service: AssessmentService = Depends(AssessmentService),
    cv_service: CVService = Depends(CVService),
    prolog_service: PrologService = Depends(PrologService),
):
    assessment = await assessment_service.create(
        payload, current_user, db, cv_service, prolog_service
    )
    return success_response(
        data=assessment.model_dump(mode="json"),
        message="Assessment saved successfully.",
    )
