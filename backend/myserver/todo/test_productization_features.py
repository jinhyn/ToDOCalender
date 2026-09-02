from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase

from .models import Category, FavoriteLocation, Task


class ProductizationFeatureTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="product-user")
        self.client.force_authenticate(self.user)
        self.category = Category.objects.create(user=self.user, name="업무", color="#BFDBFE")
        self.task = Task.objects.create(
            user=self.user,
            title="판교 회의",
            date="2030-01-01T09:00:00Z",
            end="2030-01-01T10:00:00Z",
            category=self.category,
            location='{"lat":37.4,"lng":127.1}',
            location_name="판교역",
        )

    def test_favorite_locations_are_user_owned(self):
        response = self.client.post(reverse("favorite-location-list"), {
            "name": "회사",
            "location": {"lat": 37.4, "lng": 127.1},
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(FavoriteLocation.objects.filter(user=self.user).count(), 1)

        other = get_user_model().objects.create_user(username="other-product-user")
        FavoriteLocation.objects.create(user=other, name="다른 사람 집", location='{"lat":37.5,"lng":127.2}')
        listing = self.client.get(reverse("favorite-location-list"))
        self.assertEqual([item["name"] for item in listing.data], ["회사"])

    def test_task_search_matches_title_location_and_category(self):
        for query in ["판교", "판교역", "업무"]:
            response = self.client.get(reverse("task-list"), {"q": query})
            self.assertEqual(response.status_code, 200)
            self.assertEqual([item["id"] for item in response.data], [self.task.id])

        response = self.client.get(reverse("task-list"), {"q": "없는검색"})
        self.assertEqual(response.data, [])

    def test_account_delete_removes_owned_data_and_user(self):
        FavoriteLocation.objects.create(user=self.user, name="회사", location='{"lat":37.4,"lng":127.1}')
        user_id = self.user.id
        response = self.client.delete(reverse("account"))
        self.assertEqual(response.status_code, 204)
        self.assertFalse(get_user_model().objects.filter(id=user_id).exists())
        self.assertFalse(Task.objects.filter(id=self.task.id).exists())
        self.assertFalse(Category.objects.filter(id=self.category.id).exists())
        self.assertFalse(FavoriteLocation.objects.filter(user_id=user_id).exists())
