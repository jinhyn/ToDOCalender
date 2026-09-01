import logging

from django.db import transaction
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer
from .travel import calculate_travel_warnings


logger = logging.getLogger(__name__)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    @action(detail=False, methods=["patch"])
    def reorder(self, request):
        orders = request.data.get("orders")
        if not isinstance(orders, list):
            return Response({"orders": "A list is required."}, status=status.HTTP_400_BAD_REQUEST)

        category_ids = [item.get("id") for item in orders if isinstance(item, dict)]
        if len(category_ids) != len(orders) or any(value is None for value in category_ids):
            return Response({"orders": "Each item must contain an id."}, status=status.HTTP_400_BAD_REQUEST)
        if len(set(category_ids)) != len(category_ids):
            return Response({"orders": "Category ids must be unique."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            queryset = self.get_queryset()
            categories = {category.id: category for category in queryset.filter(id__in=category_ids)}
            owned_ids = set(queryset.values_list("id", flat=True))
            if set(category_ids) != owned_ids:
                return Response(
                    {"orders": "Orders must include every category owned by the authenticated user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for order, category_id in enumerate(category_ids):
                categories[category_id].order = order
            Category.objects.bulk_update(categories.values(), ["order"])

        return Response(self.get_serializer(self.get_queryset(), many=True).data)


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(user=self.request.user).select_related("category")

    @action(detail=False, methods=["get"], url_path="travel-warnings")
    def travel_warnings(self, request):
        tasks = list(self.get_queryset().order_by("date", "id"))
        logger.info("Travel warning check: task_count=%d", len(tasks))

        if len(tasks) < 2:
            return Response({"warnings": []})

        warnings = calculate_travel_warnings(tasks)
        logger.info("Travel warning result: warning_count=%d", len(warnings))
        return Response({"warnings": warnings})
