from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Task, Category
from .serializers import TaskSerializer, CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()  # Category.Meta.ordering(order, id)에 따라 정렬되어 내려감
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]  # settings.py 기본값과 동일하지만 명시적으로 표기

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        드래그 앤 드롭으로 재정렬된 카테고리 순서를 한 번에 저장합니다.
        요청 형식: { "order": [카테고리ID, 카테고리ID, ...] } (원하는 최종 순서대로)
        """
        id_list = request.data.get('order')
        if not isinstance(id_list, list) or not id_list:
            return Response(
                {"detail": "order 필드는 카테고리 id의 배열이어야 합니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        categories = {c.id: c for c in Category.objects.filter(id__in=id_list)}
        if len(categories) != len(id_list):
            return Response(
                {"detail": "존재하지 않는 카테고리 id가 포함되어 있습니다."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        updated = []
        for index, cat_id in enumerate(id_list):
            cat = categories[cat_id]
            cat.order = index
            updated.append(cat)
        Category.objects.bulk_update(updated, ['order'])

        serializer = self.get_serializer(Category.objects.all(), many=True)
        return Response(serializer.data)

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
