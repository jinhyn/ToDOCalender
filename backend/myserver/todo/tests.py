from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase

from .models import Category, Task


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

    def test_category_reorder_only_accepts_owned_categories(self):
        self.client.force_authenticate(self.user_a)
        response = self.client.patch(
            reverse("category-reorder"),
            {"orders": [{"id": self.category_a.id}, {"id": self.category_b.id}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
