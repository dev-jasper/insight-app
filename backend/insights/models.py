from django.conf import settings
from django.db import models
from typing import Any


class Tag(models.Model):
    name:models.CharField = models.CharField(max_length=50, unique=True, db_index=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name

class Insight(models.Model):
    class Category(models.TextChoices):
        MACRO = "Macro", "Macro"
        EQUITIES = "Equities", "Equities"
        FIXED_INCOME = "FixedIncome", "Fixed Income"
        ALTERNATIVES = "Alternatives", "Alternatives"

    title: models.CharField = models.CharField(max_length=200)
    category: models.CharField = models.CharField(
        max_length=20,
        choices=Category.choices,
    )
    body: models.TextField = models.TextField()

    tags: models.ManyToManyField = models.ManyToManyField(
        Tag,
        related_name="insights",
        blank=False,
    )

    created_by: models.ForeignKey = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="insights",
    )

    created_at: models.DateTimeField = models.DateTimeField(auto_now_add=True)
    updated_at: models.DateTimeField = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return self.title