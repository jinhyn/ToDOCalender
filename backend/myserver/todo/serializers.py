import json

from rest_framework import serializers

from .models import Category, Task


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "color", "order"]
        read_only_fields = ["id", "order"]

    def validate_color(self, value):
        if not isinstance(value, str) or len(value) != 7 or not value.startswith("#"):
            raise serializers.ValidationError("color must be a hex value such as #3366FF.")
        try:
            int(value[1:], 16)
        except ValueError as exc:
            raise serializers.ValidationError("color must be a valid hex value.") from exc
        return value.upper()

    def create(self, validated_data):
        user = self.context["request"].user
        last = Category.objects.filter(user=user).order_by("-order").first()
        validated_data["user"] = user
        validated_data["order"] = last.order + 1 if last else 0
        return super().create(validated_data)


class TaskSerializer(serializers.ModelSerializer):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.none(), allow_null=True, required=False
    )
    category_detail = CategorySerializer(source="category", read_only=True)

    class Meta:
        model = Task
        fields = ["id", "title", "date", "end", "category", "category_detail", "location", "location_name"]
        read_only_fields = ["id", "category_detail"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            self.fields["category"].queryset = Category.objects.filter(user=request.user)

    def validate(self, attrs):
        start = attrs.get("date", getattr(self.instance, "date", None))
        end = attrs.get("end", getattr(self.instance, "end", None))
        if start and end and end < start:
            raise serializers.ValidationError({"end": "end must be later than or equal to date."})
        return attrs

    def validate_location(self, value):
        if isinstance(value, dict):
            return json.dumps(value, ensure_ascii=False)
        return value

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
