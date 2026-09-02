import json

from rest_framework import serializers

from .models import Category, FavoriteLocation, Task


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
    location = serializers.JSONField(required=False, allow_null=True)

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
        if value in (None, ""):
            return None
        if isinstance(value, str):
            try:
                value = json.loads(value)
            except (TypeError, ValueError, json.JSONDecodeError) as exc:
                raise serializers.ValidationError("location must contain lat and lng coordinates.") from exc
        if not isinstance(value, dict):
            raise serializers.ValidationError("location must contain lat and lng coordinates.")
        try:
            lat = float(value["lat"])
            lng = float(value["lng"])
        except (TypeError, ValueError, KeyError) as exc:
            raise serializers.ValidationError("location must contain lat and lng coordinates.") from exc
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise serializers.ValidationError("location coordinates are out of range.")
        return json.dumps({"lat": lat, "lng": lng}, ensure_ascii=False)

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data["location"] = json.loads(instance.location) if instance.location else None
        except (TypeError, ValueError, json.JSONDecodeError):
            data["location"] = None
        return data


class FavoriteLocationSerializer(serializers.ModelSerializer):
    location = serializers.JSONField()

    class Meta:
        model = FavoriteLocation
        fields = ["id", "name", "location", "address", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_location(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("location must contain lat and lng coordinates.")
        try:
            lat = float(value["lat"])
            lng = float(value["lng"])
        except (TypeError, ValueError, KeyError) as exc:
            raise serializers.ValidationError("location must contain lat and lng coordinates.") from exc
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            raise serializers.ValidationError("location coordinates are out of range.")
        return {"lat": lat, "lng": lng}

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        validated_data["location"] = json.dumps(validated_data["location"], ensure_ascii=False)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        if "location" in validated_data:
            validated_data["location"] = json.dumps(validated_data["location"], ensure_ascii=False)
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data["location"] = json.loads(instance.location)
        except (TypeError, ValueError, json.JSONDecodeError):
            data["location"] = None
        return data
