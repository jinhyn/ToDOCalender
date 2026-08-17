from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Task
from .travel import calculate_travel_warnings


class UserDataIsolationTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user_a = User.objects.create_user(username="user-a")
        self.user_b = User.objects.create_user(username="user-b")
        self.category_a = Category.objects.create(user=self.user_a, name="A", color="#FF0000")
        self.category_b = Category.objects.create(user=self.user_b, name="B", color="#00FF00")
        self.task_a = Task.objects.create(
            user=self.user_a,
            title="A task",
            date=timezone.now(),
            category=self.category_a,
        )
        self.task_b = Task.objects.create(
            user=self.user_b,
            title="B task",
            date=timezone.now(),
            category=self.category_b,
        )

    def test_tasks_are_isolated_by_user(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.get(reverse("task-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.task_a.id])

    def test_categories_are_isolated_by_user(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.get(reverse("category-list"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.data], [self.category_a.id])

    def test_cannot_update_or_delete_another_users_task(self):
        self.client.force_authenticate(self.user_a)
        update = self.client.patch(
            reverse("task-detail", args=[self.task_b.id]),
            {"title": "hijacked"},
            format="json",
        )
        self.assertEqual(update.status_code, 404)
        delete = self.client.delete(reverse("task-detail", args=[self.task_b.id]))
        self.assertEqual(delete.status_code, 404)
        self.assertTrue(Task.objects.filter(pk=self.task_b.id).exists())

    def test_cannot_update_or_delete_another_users_category(self):
        self.client.force_authenticate(self.user_a)
        update = self.client.patch(
            reverse("category-detail", args=[self.category_b.id]),
            {"name": "hijacked"},
            format="json",
        )
        self.assertEqual(update.status_code, 404)
        delete = self.client.delete(reverse("category-detail", args=[self.category_b.id]))
        self.assertEqual(delete.status_code, 404)
        self.assertTrue(Category.objects.filter(pk=self.category_b.id).exists())

    def test_cannot_assign_another_users_category(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.post(reverse("task-list"), {
            "title": "invalid",
            "date": timezone.now().isoformat(),
            "category": self.category_b.id,
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_task_end_must_not_precede_start(self):
        self.client.force_authenticate(self.user_a)
        start = timezone.now()
        response = self.client.post(reverse("task-list"), {
            "title": "invalid dates",
            "date": start.isoformat(),
            "end": (start - timedelta(minutes=1)).isoformat(),
        }, format="json")
        self.assertEqual(response.status_code, 400)

    def test_category_reorder_rejects_another_users_category(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.patch(
            reverse("category-reorder"),
            {"orders": [{"id": self.category_a.id}, {"id": self.category_b.id}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_category_reorder_requires_all_owned_categories(self):
        second = Category.objects.create(user=self.user_a, name="A2", color="#0000FF", order=1)
        self.client.force_authenticate(self.user_a)
        response = self.client.patch(
            reverse("category-reorder"),
            {"orders": [{"id": second.id}, {"id": self.category_a.id}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.category_a.refresh_from_db()
        second.refresh_from_db()
        self.assertEqual(second.order, 0)
        self.assertEqual(self.category_a.order, 1)

    def test_category_delete_preserves_tasks_and_unlinks_category(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.delete(reverse("category-detail", args=[self.category_a.id]))
        self.assertEqual(response.status_code, 204)
        self.assertTrue(Task.objects.filter(pk=self.task_a.id).exists())
        self.task_a.refresh_from_db()
        self.assertIsNone(self.task_a.category_id)


class TravelWarningTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="travel-user")
        self.client.force_authenticate(self.user)
        self.base = timezone.now().replace(second=0, microsecond=0)

    def _task(self, title, start_minutes, end_minutes, location, location_name):
        return Task.objects.create(
            user=self.user,
            title=title,
            date=self.base + timedelta(minutes=start_minutes),
            end=self.base + timedelta(minutes=end_minutes),
            location=location,
            location_name=location_name,
        )

    @patch("todo.views.calculate_travel_warnings")
    def test_travel_warnings_endpoint_returns_calculated_warnings(self, calculate):
        self._task("첫 일정", 0, 60, '{"lat":37.5,"lng":126.9}', "출발지")
        self._task("다음 일정", 70, 120, '{"lat":37.6,"lng":127.0}', "목적지")
        calculate.return_value = [{
            "previous_task_id": 1,
            "next_task_id": 2,
            "available_seconds": 600,
            "travel_seconds": 1200,
            "deficit_seconds": 600,
            "reason": "travel_time",
        }]

        response = self.client.get(reverse("task-travel-warnings"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["warnings"]), 1)
        calculate.assert_called_once()

    def test_travel_warnings_isolated_to_authenticated_user(self):
        other = get_user_model().objects.create_user(username="other-travel-user")
        Task.objects.create(
            user=other,
            title="Other task",
            date=self.base,
            end=self.base + timedelta(minutes=30),
            location='{"lat":37.5,"lng":126.9}',
        )
        with patch("todo.views.calculate_travel_warnings", return_value=[]) as calculate:
            response = self.client.get(reverse("task-travel-warnings"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["warnings"], [])
        tasks = calculate.call_args.args[0]
        self.assertTrue(all(task.user_id == self.user.id for task in tasks))

    @patch("todo.travel._request_travel_time")
    def test_calculates_warning_when_fastest_travel_time_exceeds_gap(self, request):
        previous = self._task("이전 일정", 0, 60, '{"lat":37.5,"lng":126.9}', "출발지")
        next_task = self._task("다음 일정", 80, 120, '{"lat":37.6,"lng":127.0}', "목적지")
        request.return_value = {"duration": 30 * 60, "distance": 10000}

        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(len(warnings), 1)
        self.assertEqual(warnings[0]["next_task_id"], next_task.id)
        self.assertEqual(warnings[0]["available_seconds"], 20 * 60)
        self.assertEqual(warnings[0]["deficit_seconds"], 10 * 60)
        request.assert_called_once_with(
            {"lat": 37.5, "lng": 126.9},
            {"lat": 37.6, "lng": 127.0},
            previous.end,
        )

    @patch("todo.travel._request_travel_time")
    def test_does_not_call_routing_for_same_location(self, request):
        previous = self._task("이전 일정", 0, 60, '{"lat":37.5,"lng":126.9}', "같은 장소")
        next_task = self._task("다음 일정", 70, 120, '{"lat":37.5,"lng":126.9}', "같은 장소")

        warnings = calculate_travel_warnings([previous, next_task])

        self.assertEqual(warnings, [])
        request.assert_not_called()
