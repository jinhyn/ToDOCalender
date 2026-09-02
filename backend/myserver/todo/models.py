from django.conf import settings
from django.db import models


class Category(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="categories")
    name = models.CharField(max_length=100)
    color = models.CharField(max_length=7, default="#000000")
    order = models.IntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_category_name_per_user"),
        ]

    def __str__(self):
        return self.name


class Task(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=200)
    date = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    location = models.CharField(max_length=255, null=True, blank=True)
    location_name = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.title


class FavoriteLocation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorite_locations")
    name = models.CharField(max_length=255)
    location = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name", "id"]
        constraints = [
            models.UniqueConstraint(fields=["user", "name"], name="unique_favorite_location_name_per_user"),
        ]

    def __str__(self):
        return self.name
