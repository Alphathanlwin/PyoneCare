import logging
import math

import httpx

from config import settings
from schemas.clinic import ClinicResponse

logger = logging.getLogger(__name__)

# The legacy "Places API" (maps.googleapis.com/maps/api/place/*) returns
# REQUEST_DENIED for projects that only have "Places API (New)" enabled —
# which is the default for newly-created Google Cloud projects. Places API
# (New) also returns the phone number directly in the search response, so a
# separate Place Details lookup per result is no longer needed.
SEARCH_NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby"
FIELD_MASK = (
    "places.id,places.displayName,places.formattedAddress,"
    "places.rating,places.location,places.nationalPhoneNumber"
)
MAX_RADIUS_M = 50000


class ClinicServiceUnavailableError(Exception):
    """Raised when the Google Places API cannot be reached, errors, or is unconfigured."""


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r_km = 6371.0
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = math.sin(d_lat / 2) ** 2 + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(d_lng / 2) ** 2
    return r_km * 2 * math.asin(math.sqrt(a))


class ClinicService:
    async def nearby(self, lat: float, lng: float, radius_m: int) -> list[ClinicResponse]:
        """Returns nearby dentists sorted by distance, closest first.

        Raises ClinicServiceUnavailableError if no API key is configured or
        on any network/API failure, so callers can surface a consistent 503.
        """
        if not settings.GOOGLE_PLACES_API_KEY:
            raise ClinicServiceUnavailableError()

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }
        payload = {
            "includedTypes": ["dentist"],
            "maxResultCount": 20,
            "locationRestriction": {
                "circle": {
                    "center": {"latitude": lat, "longitude": lng},
                    "radius": min(radius_m, MAX_RADIUS_M),
                }
            },
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(SEARCH_NEARBY_URL, headers=headers, json=payload)
                response.raise_for_status()
                places = response.json().get("places", [])

                clinics = []
                for place in places:
                    location = place.get("location", {})
                    place_lat, place_lng = location.get("latitude"), location.get("longitude")
                    if place_lat is None or place_lng is None:
                        continue
                    clinics.append(
                        ClinicResponse(
                            place_id=place["id"],
                            name=place.get("displayName", {}).get("text", "Unknown clinic"),
                            address=place.get("formattedAddress"),
                            rating=place.get("rating"),
                            distance_km=round(_haversine_km(lat, lng, place_lat, place_lng), 2),
                            phone=place.get("nationalPhoneNumber"),
                        )
                    )
                clinics.sort(key=lambda c: c.distance_km)
                return clinics
        except (httpx.HTTPError, KeyError, ValueError) as exc:
            logger.warning("Google Places service unavailable: %s", exc)
            raise ClinicServiceUnavailableError() from exc
