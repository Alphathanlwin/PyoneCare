from pydantic import BaseModel


class ClinicResponse(BaseModel):
    place_id: str
    name: str
    address: str | None
    rating: float | None
    # None when the result came from an area/text search (no user origin to
    # measure from); a number when it came from a coordinate-based nearby search.
    distance_km: float | None = None
    phone: str | None
