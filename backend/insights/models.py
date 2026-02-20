
from django.db import models

class Insight(models.Model):
    class Category(models.TextChoices):
        MACRO = 'Macro', 'Macro'
        EQUITIES = 'Equities', 'Equities'
        FIXED_INCOME = 'FixedIncome', 'Fixed Income'
        ALTERNATIVES = 'Alternatives', 'Alternatives'

    title = models.CharField(max_length=200)
    category = models.CharField(max_length=20, choices=Category.choices)
    body = models.TextField()
    tags = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        indexes = [
            models.Index(fields=['category']),
        ]
