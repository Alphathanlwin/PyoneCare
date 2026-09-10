from fastapi import APIRouter, Depends, Query

from dependencies import get_current_user
from exceptions import ClinicServiceUnavailableException
from models.user import User
from services.clinic_service import ClinicService, ClinicServiceUnavailableError
from utils.response import success_response

router = APIRouter()


@router.get("/nearby")
async def get_nearby_clinics(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius: int = Query(5000, ge=100, le=50000),
    current_user: User = Depends(get_current_user),
    clinic_service: ClinicService = Depends(ClinicService),
):
    try:
        clinics = await clinic_service.nearby(lat, lng, radius)
    except ClinicServiceUnavailableError:
        raise ClinicServiceUnavailableException()

    return success_response(
        data={"items": [c.model_dump() for c in clinics]},
        message="Nearby clinics retrieved successfully.",
    )


@router.get("/search")
async def search_clinics(
    q: str = Query(..., min_length=2, max_length=120),
    current_user: User = Depends(get_current_user),
    clinic_service: ClinicService = Depends(ClinicService),
):
    """Area/place-name search — the fallback for when the browser blocks or
    denies precise geolocation."""
    try:
        clinics = await clinic_service.search_text(q)
    except ClinicServiceUnavailableError:
        raise ClinicServiceUnavailableException()

    return success_response(
        data={"items": [c.model_dump() for c in clinics]},
        message="Clinics retrieved successfully.",
    )
