import json
from rest_framework import serializers
from .models import Task, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        # ⚠️ 기존엔 'color'가 빠져 있어서 목록 조회 시 카테고리 색상이 항상 undefined였습니다.
        fields = ['id', 'name', 'color', 'order']
        extra_kwargs = {
            # order는 클라이언트가 명시하지 않으면 서버에서 자동으로 맨 끝 순번을 부여합니다.
            'order': {'required': False},
        }

    def create(self, validated_data):
        if 'order' not in validated_data:
            last = Category.objects.order_by('-order').first()
            validated_data['order'] = (last.order + 1) if last else 0
        return super().create(validated_data)

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
