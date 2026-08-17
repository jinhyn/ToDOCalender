import json
import logging
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils import timezone


logger = logging.getLogger(__name__)
KAKAO_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions"
KAKAO_FUTURE_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/future/directions"


def _parse_location(value):
    if not value:
        return None
    if isinstance(value, dict):
        data = value
    else:
        try:
            data = json.loads(value)
        except (TypeError, ValueError):
            return None
    try:
        lat = float(data["lat"])
        lng = float(data["lng"])
    except (KeyError, TypeError, ValueError):
        return None
    return {"lat": lat, "lng": lng}


def _request_travel_time(origin, destination, departure_time=None):
    api_key = getattr(settings, "KAKAO_REST_API_KEY", "")
    if not api_key:
        logger.warning("Travel warning skipped: KAKAO_REST_API_KEY is not configured")
        return None

    use_future = departure_time is not None and departure_time > timezone.now()
    url = KAKAO_FUTURE_DIRECTIONS_URL if use_future else KAKAO_DIRECTIONS_URL
    params = {
        "origin": f'{origin["lng"]},{origin["lat"]}',
        "destination": f'{destination["lng"]},{destination["lat"]}',
        "priority": "TIME",
        "summary": "true",
    }
    if use_future:
        params["departure_time"] = departure_time.astimezone(timezone.get_current_timezone()).strftime("%Y%m%d%H%M")

    logger.warning(
        "Travel route request: endpoint=%s departure=%s origin=%s destination=%s",
        "future" if use_future else "current",
        departure_time.isoformat() if departure_time else None,
        origin,
        destination,
    )

    request = Request(
        f"{url}?{urlencode(params)}",
        headers={
            "Authorization": f"KakaoAK {api_key}",
            "Content-Type": "application/json",
        },
        method="GET",
    )
    try:
        with urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
        routes = payload.get("routes") or []
        if not routes:
            logger.warning("Kakao directions returned no routes: %s", payload)
            return None
        summary = routes[0].get("summary", {})
        duration = summary.get("duration")
        distance = summary.get("distance")
        if duration is None:
            logger.warning("Kakao directions response has no duration: %s", payload)
            return None
        logger.warning("Travel route result: duration=%ss distance=%sm", duration, distance or 0)
        return {"duration": int(duration), "distance": int(distance or 0)}
    except HTTPError as exc:
        try:
            body = exc.read().decode("utf-8", errors="replace")
        except Exception:
            body = ""
        logger.error("Kakao directions HTTP %s: %s", exc.code, body[:1000])
        return None
    except (URLError, TimeoutError) as exc:
        logger.error("Kakao directions network error: %s", exc)
        return None
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        logger.error("Kakao directions response parse error: %s", exc)
        return None


def calculate_travel_warnings(tasks):
    """Return warnings for consecutive tasks whose travel estimate exceeds the gap."""
    ordered = sorted(tasks, key=lambda task: (task.date, task.id))
    warnings = []
    logger.warning("Travel warning check: %s tasks", len(ordered))

    for previous, next_task in zip(ordered, ordered[1:]):
        logger.warning(
            "Travel pair: #%s '%s' -> #%s '%s' | end=%s next_start=%s",
            previous.id,
            previous.title,
            next_task.id,
            next_task.title,
            previous.end,
            next_task.date,
        )
        if not previous.end or not previous.location or not next_task.location:
            logger.warning("Travel pair skipped: missing end/location")
            continue

        previous_location = _parse_location(previous.location)
        next_location = _parse_location(next_task.location)
        if not previous_location or not next_location:
            logger.warning("Travel pair skipped: invalid location data")
            continue

        gap_seconds = int((next_task.date - previous.end).total_seconds())
        if gap_seconds < 0:
            warnings.append({
                "previous_task_id": previous.id,
                "next_task_id": next_task.id,
                "previous_title": previous.title,
                "next_title": next_task.title,
                "previous_location_name": previous.location_name or "이전 일정 위치",
                "next_location_name": next_task.location_name or "다음 일정 위치",
                "available_seconds": gap_seconds,
                "travel_seconds": 0,
                "distance_meters": 0,
                "deficit_seconds": abs(gap_seconds),
                "reason": "overlap",
            })
            continue

        if previous_location == next_location:
            logger.warning("Travel pair skipped: same location")
            continue

        route = _request_travel_time(previous_location, next_location, previous.end)
        if not route:
            continue

        deficit = route["duration"] - gap_seconds
        logger.warning("Travel comparison: available=%ss travel=%ss deficit=%ss", gap_seconds, route["duration"], deficit)
        if deficit > 0:
            warnings.append({
                "previous_task_id": previous.id,
                "next_task_id": next_task.id,
                "previous_title": previous.title,
                "next_title": next_task.title,
                "previous_location_name": previous.location_name or "이전 일정 위치",
                "next_location_name": next_task.location_name or "다음 일정 위치",
                "available_seconds": gap_seconds,
                "travel_seconds": route["duration"],
                "distance_meters": route["distance"],
                "deficit_seconds": deficit,
                "reason": "travel_time",
            })

    logger.warning("Travel warning result: %s warnings", len(warnings))
    return warnings
