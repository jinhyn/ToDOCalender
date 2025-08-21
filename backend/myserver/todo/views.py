from rest_framework import viewsets
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework import status
from .models import Task, Category
from .serializers import TaskSerializer, CategorySerializer

class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        # 새 Task 객체 생성 시 추가 로직이 필요하다면 여기서 처리
        category_data = self.request.data.get('category')
        category = Category.objects.get(id=category_data['id'])  # category ID로 카테고리 찾기
        serializer.save(category=category)

    def perform_update(self, serializer):
        # Task 수정 시 추가 로직이 필요하다면 여기서 처리
        category_data = self.request.data.get('category')
        category = Category.objects.get(id=category_data['id'])  # category ID로 카테고리 찾기
        serializer.save(category=category)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def destroy(self, request, *args, **kwargs):
        category_id = kwargs.get('pk')  # 'pk'는 기본적으로 'id'로 설정됨
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            raise NotFound('Category not found')

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def create(self, request, *args, **kwargs):
        # 카테고리 생성 시 필요한 로직
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # 카테고리 객체 저장
            category = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
