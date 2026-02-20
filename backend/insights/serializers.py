from __future__ import annotations

from typing import Any

from rest_framework import serializers

from .models import Insight


class InsightSerializer(serializers.ModelSerializer):
    # Represent tags as list[str] instead of M2M objects
    tags = serializers.ListField(
        child=serializers.CharField(max_length=50),
        allow_empty=False,
    )

    created_by = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Insight
        fields = [
            "id",
            "title",
            "category",
            "body",
            "tags",
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at"]

    def get_created_by(self, obj: Insight) -> dict[str, Any]:
        user = obj.created_by
        return {"id": user.id, "username": getattr(user, "username", "")}

    def to_representation(self, instance: Insight) -> dict[str, Any]:
        data = super().to_representation(instance)
        # Convert M2M Tag objects to list[str]
        data["tags"] = list(instance.tags.values_list("name", flat=True))
        return data

    # --- Validation rules from exam ---
    def validate_title(self, value: str) -> str:
        v = value.strip()
        if not (5 <= len(v) <= 200):
            raise serializers.ValidationError("Must be between 5 and 200 characters.")
        return v

    def validate_body(self, value: str) -> str:
        v = value.strip()
        if len(v) < 20:
            raise serializers.ValidationError("Must be at least 20 characters.")
        return v

    def validate_tags(self, value: list[str]) -> list[str]:
        cleaned = [t.strip() for t in value if t and t.strip()]
        if not (1 <= len(cleaned) <= 10):
            raise serializers.ValidationError("Must contain between 1 and 10 tags.")
        if len(set(cleaned)) != len(cleaned):
            raise serializers.ValidationError("Tags must not contain duplicates.")
        return cleaned