from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Task
from .travel import calculate_travel_warnings


class DepartureRecommendationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="departure-user")
        self.base = timezone.now().replace(second=0, microsecond=0) + timedelta(hours=2)

    def _task(self, title, start_minutes, end_minutes, location):
        return Task.objects.create(
            user=self.user,
            title=title,
            date=self.base + timedelta(minutes=start_minutes),
            end=self.base + timedelta(minutes=end_minutes),
            location=location,
            location_name=title,
        )

    @patch("todo.travel._request_travel_time")
    def test_warning_contains_recommended_departure_time(self, request):
        previous = self._task("이전", 0, 30, '{"lat":37.5,"lng":126.9}')
        next_task = self._task("다음", 50, 80, '{"lat":37.6,"lng":127.0}')
        request.return_value = {"duration": 30 * 60, "distance": 10000}

        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(len(warnings), 1)
        expected = next_task.date - timedelta(minutes=30)
        self.assertEqual(warnings[0]["recommended_departure_at"], expected.isoformat())

    @patch("todo.travel._request_travel_time")
    def test_past_next_schedule_does_not_create_warning_or_route_call(self, request):
        past_base = timezone.now().replace(second=0, microsecond=0) - timedelta(hours=3)
        previous = Task.objects.create(
            user=self.user,
            title="지난 이전",
            date=past_base,
            end=past_base + timedelta(minutes=30),
            location='{"lat":37.5,"lng":126.9}',
        )
        next_task = Task.objects.create(
            user=self.user,
            title="지난 다음",
            date=past_base + timedelta(minutes=50),
            end=past_base + timedelta(minutes=80),
            location='{"lat":37.6,"lng":127.0}',
        )

        self.assertEqual(calculate_travel_warnings([previous, next_task]), [])
        request.assert_not_called()
