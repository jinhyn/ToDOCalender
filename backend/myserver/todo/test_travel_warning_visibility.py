from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Task
from .travel import calculate_travel_plans, calculate_travel_warnings


class TravelWarningVisibilityTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="travel-visibility-user")

    def _task(self, title, start, end, location):
        return Task.objects.create(
            user=self.user,
            title=title,
            date=start,
            end=end,
            location=location,
            location_name=title,
        )

    @patch("todo.travel._request_travel_time")
    def test_expired_next_schedule_does_not_create_warning(self, request):
        now = timezone.now()
        previous = self._task(
            "지난 일정 1",
            now - timedelta(hours=3),
            now - timedelta(hours=2),
            '{"lat":37.5,"lng":126.9}',
        )
        next_task = self._task(
            "지난 일정 2",
            now - timedelta(hours=1),
            now - timedelta(minutes=30),
            '{"lat":37.6,"lng":127.0}',
        )

        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(warnings, [])
        request.assert_not_called()

    @patch("todo.travel._request_travel_time")
    def test_upcoming_warning_contains_schedule_times(self, request):
        now = timezone.now()
        previous = self._task(
            "이전 일정",
            now + timedelta(hours=1),
            now + timedelta(hours=2),
            '{"lat":37.5,"lng":126.9}',
        )
        next_task = self._task(
            "다음 일정",
            now + timedelta(hours=2, minutes=20),
            now + timedelta(hours=3),
            '{"lat":37.6,"lng":127.0}',
        )
        request.return_value = {"duration": 30 * 60, "distance": 10000}

        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(len(warnings), 1)
        self.assertEqual(warnings[0]["next_start"], next_task.date.isoformat())
        self.assertEqual(warnings[0]["previous_end"], previous.end.isoformat())
        self.assertTrue(warnings[0]["requires_attention"])

    @patch("todo.travel._request_travel_time")
    def test_sufficient_gap_still_creates_departure_plan_without_warning(self, request):
        now = timezone.now()
        previous = self._task(
            "이전 일정",
            now + timedelta(hours=1),
            now + timedelta(hours=2),
            '{"lat":37.5,"lng":126.9}',
        )
        next_task = self._task(
            "여유 있는 다음 일정",
            now + timedelta(hours=3),
            now + timedelta(hours=4),
            '{"lat":37.6,"lng":127.0}',
        )
        request.return_value = {"duration": 30 * 60, "distance": 10000}

        plans = calculate_travel_plans([previous, next_task])
        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(len(plans), 1)
        self.assertFalse(plans[0]["requires_attention"])
        self.assertEqual(plans[0]["deficit_seconds"], 0)
        self.assertIsNotNone(plans[0]["recommended_departure_at"])
        self.assertEqual(warnings, [])

    @patch("todo.travel._request_travel_time")
    def test_distant_schedule_outside_horizon_skips_routing(self, request):
        now = timezone.now()
        previous = self._task(
            "먼 일정 1",
            now + timedelta(days=8),
            now + timedelta(days=8, hours=1),
            '{"lat":37.5,"lng":126.9}',
        )
        next_task = self._task(
            "먼 일정 2",
            now + timedelta(days=8, hours=2),
            now + timedelta(days=8, hours=3),
            '{"lat":37.6,"lng":127.0}',
        )

        plans = calculate_travel_plans([previous, next_task])

        self.assertEqual(plans, [])
        request.assert_not_called()
