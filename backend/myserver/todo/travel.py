import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils import timezone


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
        return None

    use_future = departure_time is not None and departure_time > timezone.now()
    url = KAKAO_FUTURE_DIRECTIONS_URL if use_future else KAKAO_DIRECTIONS_URL
    params = {
        "origin": f'{origin["lng"]},{origin["lat"]}',
        "destination": f'{destination["lng"]},{destination["lat"]}',
        "priority": "RECOMMEND",
        "summary": "true",
    }
    if use_future:
        params["departure_time"] = departure_time.astimezone(timezone.get_current_timezone()).strftime("%Y%m%d%H%M")

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
        summary = payload.get("routes", [{}])[0].get("summary", {})
        duration = summary.get("duration")
        distance = summary.get("distance")
        if duration is None:
            return None
        return {"duration": int(duration), "distance": int(distance or 0)}
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, IndexError):
        return None


def calculate_travel_warnings(tasks):
    """Return warnings for consecutive tasks whose travel estimate exceeds the gap."""
    ordered = sorted(tasks, key=lambda task: (task.date, task.id))
    warnings = []

    for previous, next_task in zip(ordered, ordered[1:]):
        if not previous.end or not previous.location or not next_task.location:
            continue

        previous_location = _parse_location(previous.location)
        next_location = _parse_location(next_task.location)
        if not previous_location or not next_location:
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
            continue

        # Use the previous task's end as the departure time. For future schedules,
        # Kakao's future-driving endpoint accounts for the scheduled departure time.
        route = _request_travel_time(previous_location, next_location, previous.end)
        if not route:
            continue

        deficit = route["duration"] - gap_seconds
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

    return warnings
