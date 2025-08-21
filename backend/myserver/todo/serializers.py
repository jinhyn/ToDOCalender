from rest_framework import serializers
from .models import Task, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']  # 카테고리의 id와 name만 반환

class TaskSerializer(serializers.ModelSerializer):
    category = CategorySerializer()  # 카테고리 정보를 포함

    class Meta:
        model = Task
        fields = ['id', 'title', 'date', 'end', 'category', 'location', 'location_name']  # 필요한 필드

    def create(self, validated_data):
        category_data = validated_data.pop('category')
        category = Category.objects.get(id=category_data['id'])  # category ID로 카테고리 객체 찾기
        task = Task.objects.create(category=category, **validated_data)
        return task

    def update(self, instance, validated_data):
        category_data = validated_data.pop('category')
        category = Category.objects.get(id=category_data['id'])  # category ID로 카테고리 객체 찾기
        instance.title = validated_data.get('title', instance.title)
        instance.date = validated_data.get('date', instance.date)
        instance.end = validated_data.get('end', instance.end)
        instance.category = category
        instance.location = validated_data.get('location', instance.location)
        instance.location_name = validated_data.get('location_name', instance.location_name)
        instance.save()
        return instance
