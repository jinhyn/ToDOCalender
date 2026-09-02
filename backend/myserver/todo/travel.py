import json
import logging
from datetime import timedelta
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from django.conf import settings
from django.utils import timezone


logger = logging.getLogger(__name__)
KAKAO_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/directions"
KAKAO_FUTURE_DIRECTIONS_URL = "https://apis-navi.kakaomobility.com/v1/future/directions"
TRAVEL_PLAN_HORIZON_DAYS = 7


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

    logger.info("Travel route request: endpoint=%s", "future" if use_future else "current")

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
            logger.warning("Kakao directions returned no routes")
            return None
        summary = routes[0].get("summary", {})
        duration = summary.get("duration")
        distance = summary.get("distance")
        if duration is None:
            logger.warning("Kakao directions response has no duration")
            return None
        return {"duration": int(duration), "distance": int(distance or 0)}
    except HTTPError as exc:
        logger.error("Kakao directions HTTP %s", exc.code)
        return None
    except (URLError, TimeoutError) as exc:
        logger.error("Kakao directions network error: %s", exc)
        return None
    except (ValueError, KeyError, IndexError, TypeError) as exc:
        logger.error("Kakao directions response parse error: %s", exc)
        return None


def _plan_base(previous, next_task):
    return {
        "previous_task_id": previous.id,
        "next_task_id": next_task.id,
        "previous_title": previous.title,
        "next_title": next_task.title,
        "previous_location_name": previous.location_name or "이전 일정 위치",
        "next_location_name": next_task.location_name or "다음 일정 위치",
        "previous_end": previous.end.isoformat() if previous.end else None,
        "next_start": next_task.date.isoformat(),
    }


def calculate_travel_plans(tasks, horizon_days=TRAVEL_PLAN_HORIZON_DAYS):
    """Return upcoming travel plans once, then let callers derive warnings.

    The short horizon avoids routing distant calendar entries every time the app
    refreshes while still covering the period where departure guidance is useful.
    """
    ordered = sorted(tasks, key=lambda task: (task.date, task.id))
    plans = []
    now = timezone.now()
    horizon = now + timedelta(days=horizon_days)
    logger.info("Travel plan check: %s tasks", len(ordered))

    for previous, next_task in zip(ordered, ordered[1:]):
        if next_task.date <= now or next_task.date > horizon:
            continue
        if not previous.end or not previous.location or not next_task.location:
            continue

        previous_location = _parse_location(previous.location)
        next_location = _parse_location(next_task.location)
        if not previous_location or not next_location:
            continue

        gap_seconds = int((next_task.date - previous.end).total_seconds())
        plan_base = _plan_base(previous, next_task)

        if gap_seconds < 0:
            plans.append({
                **plan_base,
                "available_seconds": gap_seconds,
                "travel_seconds": 0,
                "distance_meters": 0,
                "deficit_seconds": abs(gap_seconds),
                "recommended_departure_at": None,
                "requires_attention": True,
                "reason": "overlap",
            })
            continue

        if previous_location == next_location:
            continue

        route = _request_travel_time(previous_location, next_location, previous.end)
        if not route:
            continue

        recommended_departure_at = next_task.date - timedelta(seconds=route["duration"])
        deficit = max(0, route["duration"] - gap_seconds)
        plans.append({
            **plan_base,
            "available_seconds": gap_seconds,
            "travel_seconds": route["duration"],
            "distance_meters": route["distance"],
            "deficit_seconds": deficit,
            "recommended_departure_at": recommended_departure_at.isoformat(),
            "requires_attention": deficit > 0,
            "reason": "travel_time",
        })

    logger.info("Travel plan result: %s plans", len(plans))
    return plans


def calculate_travel_warnings(tasks):
    """Backward-compatible helper returning only plans that need attention."""
    return [plan for plan in calculate_travel_plans(tasks) if plan["requires_attention"]]
