from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import AccountView, CategoryViewSet, FavoriteLocationViewSet, TaskViewSet

router = DefaultRouter()
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"categories", CategoryViewSet, basename="category")
router.register(r"favorite-locations", FavoriteLocationViewSet, basename="favorite-location")

urlpatterns = [
    path("account/", AccountView.as_view(), name="account"),
    path("", include(router.urls)),
]
