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
SEARCH_TEXT_URL = "https://places.googleapis.com/v1/places:searchText"
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
    async def _post_places(self, url: str, payload: dict) -> list[dict]:
        """POSTs to a Places API (New) endpoint and returns the raw `places`
        list. Raises ClinicServiceUnavailableError on missing key or any
        network/API failure so callers surface a consistent 503.

        Every failure path logs enough to actually debug it — the HTTP status
        and Google's response body (which carries the real reason, e.g.
        REQUEST_DENIED / API not enabled / billing / key restriction), or the
        network error with a traceback.
        """
        op = url.rsplit("/", 1)[-1]  # e.g. "places:searchText"

        if not settings.GOOGLE_PLACES_API_KEY:
            logger.error("clinic search (%s): GOOGLE_PLACES_API_KEY is not set", op)
            raise ClinicServiceUnavailableError()

        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": settings.GOOGLE_PLACES_API_KEY,
            "X-Goog-FieldMask": FIELD_MASK,
        }
        logger.debug("clinic search (%s): request payload=%s", op, payload)

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(url, headers=headers, json=payload)
        except httpx.HTTPError:
            logger.exception("clinic search (%s): network error calling Google Places", op)
            raise ClinicServiceUnavailableError()

        if response.status_code >= 400:
            # Google puts { "error": { "status": ..., "message": ... } } here.
            logger.error(
                "clinic search (%s): Google Places returned HTTP %s — body: %s",
                op,
                response.status_code,
                response.text[:2000],
            )
            raise ClinicServiceUnavailableError()

        try:
            body = response.json()
        except ValueError:
            logger.exception(
                "clinic search (%s): Google Places returned non-JSON (HTTP %s) — body: %s",
                op,
                response.status_code,
                response.text[:2000],
            )
            raise ClinicServiceUnavailableError()

        places = body.get("places", [])
        logger.info("clinic search (%s): %d result(s)", op, len(places))
        return places

    def _to_clinic(self, place: dict, origin: tuple[float, float] | None) -> ClinicResponse | None:
        location = place.get("location", {})
        place_lat, place_lng = location.get("latitude"), location.get("longitude")
        distance = None
        if origin is not None and place_lat is not None and place_lng is not None:
            distance = round(_haversine_km(origin[0], origin[1], place_lat, place_lng), 2)
        place_id = place.get("id")
        if not place_id:
            return None
        return ClinicResponse(
            place_id=place_id,
            name=place.get("displayName", {}).get("text", "Unknown clinic"),
            address=place.get("formattedAddress"),
            rating=place.get("rating"),
            distance_km=distance,
            phone=place.get("nationalPhoneNumber"),
        )

    async def nearby(self, lat: float, lng: float, radius_m: int) -> list[ClinicResponse]:
        """Returns dentists near a coordinate, sorted by distance (closest first)."""
        places = await self._post_places(
            SEARCH_NEARBY_URL,
            {
                "includedTypes": ["dentist"],
                "maxResultCount": 20,
                "locationRestriction": {
                    "circle": {
                        "center": {"latitude": lat, "longitude": lng},
                        "radius": min(radius_m, MAX_RADIUS_M),
                    }
                },
            },
        )
        clinics = [c for p in places if (c := self._to_clinic(p, (lat, lng)))]
        clinics.sort(key=lambda c: c.distance_km if c.distance_km is not None else float("inf"))
        return clinics

    async def search_text(self, query: str) -> list[ClinicResponse]:
        """Returns dentists matching a free-text area/place query — the
        fallback for when the browser won't give a precise location. Results
        keep Google's relevance order and carry no distance (no user origin).
        """
        places = await self._post_places(
            SEARCH_TEXT_URL,
            {
                "textQuery": f"dentist in {query}",
                "includedType": "dentist",
                "maxResultCount": 20,
            },
        )
        return [c for p in places if (c := self._to_clinic(p, None))]
