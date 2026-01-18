import json
from rest_framework import serializers
from .models import Task, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']

class TaskSerializer(serializers.ModelSerializer):
    # 입력 시: 카테고리 ID(숫자)를 받음
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        allow_null=True,
        required=False
    )
    # 출력 시: 카테고리 상세 정보를 포함
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Task
        fields = ['id', 'title', 'date', 'end', 'category', 'category_detail', 'location', 'location_name']

    # location 객체가 들어오면 문자열로 변환하여 저장
    def validate_location(self, value):
        if isinstance(value, dict):
            return json.dumps(value)
        return value