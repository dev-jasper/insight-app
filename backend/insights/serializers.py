from __future__ import annotations

from typing import Any
from rest_framework import serializers
from .models import Insight
from django.contrib.auth.password_validation import validate_password

class InsightSerializer(serializers.ModelSerializer):
    # input field (write-only)
    tags = serializers.ListField(
        child=serializers.CharField(),
        required=True,
        allow_empty=False,
        write_only=True,
    )

    # output field (read-only)
    tags_list = serializers.SerializerMethodField(read_only=True)
    created_by = serializers.SerializerMethodField()

    class Meta:
        model = Insight
        fields = [
            "id",
            "title",
            "category",
            "body",
            "tags",        # write-only input
            "tags_list",   # read-only output
            "created_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_at", "updated_at", "tags_list"]

    def get_tags_list(self, obj: Insight) -> list[str]:
        return list(obj.tags.values_list("name", flat=True))

    def get_created_by(self, obj: Insight) -> dict[str, Any]:
        user = obj.created_by
        return {"id": user.id, "username": getattr(user, "username", "")}

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

    # optional: make response key "tags" instead of "tags_list"
    def to_representation(self, instance: Insight) -> dict[str, Any]:
        data = super().to_representation(instance)
        data["tags"] = data.pop("tags_list", [])
        return data

class SignupSerializer(serializers.Serializer):
    username = serializers.CharField(min_length=3, max_length=150)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, min_length=8)

    def validate_password(self, value: str) -> str:
        # uses Django’s configured validators if you have them
        validate_password(value)
        return value