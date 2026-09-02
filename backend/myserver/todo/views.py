import logging
from calendar import monthrange
from datetime import timedelta

from django.db import transaction
from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Category, FavoriteLocation, Task
from .serializers import CategorySerializer, FavoriteLocationSerializer, TaskSerializer
from .travel import calculate_travel_plans


logger = logging.getLogger(__name__)


def _shift_month(value, months):
    target_month_index = value.month - 1 + months
    year = value.year + target_month_index // 12
    month = target_month_index % 12 + 1
    day = min(value.day, monthrange(year, month)[1])
    return value.replace(year=year, month=month, day=day)


def _shift_recurrence(value, recurrence_type, index):
    if value is None or index == 0:
        return value
    if recurrence_type == "daily":
        return value + timedelta(days=index)
    if recurrence_type == "weekly":
        return value + timedelta(weeks=index)
    return _shift_month(value, index)


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
        queryset = Task.objects.filter(user=self.request.user).select_related("category")
        query = self.request.query_params.get("q", "").strip()
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(location_name__icontains=query)
                | Q(category__name__icontains=query)
            )
        return queryset

    @action(detail=False, methods=["post"], url_path="bulk")
    def bulk(self, request):
        task_items = request.data.get("tasks")
        if not isinstance(task_items, list) or not task_items:
            return Response({"tasks": "A non-empty list is required."}, status=status.HTTP_400_BAD_REQUEST)
        if len(task_items) > 100:
            return Response({"tasks": "At most 100 tasks can be imported at once."}, status=status.HTTP_400_BAD_REQUEST)

        serializers = []
        for index, item in enumerate(task_items):
            serializer = self.get_serializer(data=item)
            if not serializer.is_valid():
                return Response({"index": index, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
            serializers.append(serializer)

        with transaction.atomic():
            created = [serializer.save() for serializer in serializers]

        return Response(self.get_serializer(created, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], url_path="recurring")
    def recurring(self, request):
        recurrence_type = request.data.get("recurrence_type", "none")
        recurrence_count = request.data.get("recurrence_count", 1)
        task_data = request.data.get("task")

        if recurrence_type not in {"daily", "weekly", "monthly"}:
            return Response({"recurrence_type": "daily, weekly or monthly is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            recurrence_count = int(recurrence_count)
        except (TypeError, ValueError):
            return Response({"recurrence_count": "An integer is required."}, status=status.HTTP_400_BAD_REQUEST)
        if recurrence_count < 2 or recurrence_count > 30:
            return Response({"recurrence_count": "Choose between 2 and 30 occurrences."}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(task_data, dict):
            return Response({"task": "A task object is required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=task_data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data
        start = validated["date"]
        end = validated.get("end")

        with transaction.atomic():
            created = []
            for index in range(recurrence_count):
                created.append(Task.objects.create(
                    user=request.user,
                    title=validated["title"],
                    date=_shift_recurrence(start, recurrence_type, index),
                    end=_shift_recurrence(end, recurrence_type, index),
                    category=validated.get("category"),
                    location=validated.get("location"),
                    location_name=validated.get("location_name", ""),
                ))

        return Response(self.get_serializer(created, many=True).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="travel-warnings")
    def travel_warnings(self, request):
        tasks = list(Task.objects.filter(user=request.user).select_related("category").order_by("date", "id"))
        logger.info("Travel plan check: task_count=%d", len(tasks))

        if len(tasks) < 2:
            return Response({"plans": [], "warnings": []})

        plans = calculate_travel_plans(tasks)
        warnings = [plan for plan in plans if plan["requires_attention"]]
        logger.info("Travel plan result: plan_count=%d warning_count=%d", len(plans), len(warnings))
        return Response({"plans": plans, "warnings": warnings})


class FavoriteLocationViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteLocationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FavoriteLocation.objects.filter(user=self.request.user)


class AccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({
            "task_count": Task.objects.filter(user=request.user).count(),
            "category_count": Category.objects.filter(user=request.user).count(),
            "favorite_location_count": FavoriteLocation.objects.filter(user=request.user).count(),
        })

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
