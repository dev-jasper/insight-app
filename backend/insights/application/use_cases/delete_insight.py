from __future__ import annotations

from django.contrib.auth import get_user_model
from insights.infrastructure.repositories import InsightRepository
from insights.models import Insight

User = get_user_model()


class DeleteInsightUseCase:
    def __init__(self, *, repo: InsightRepository):
        self.repo = repo

    def execute(self, *, insight: Insight, user: User) -> None:
        if insight.created_by_id != user.id:
            raise PermissionError("Only the owner can delete this insight.")
        self.repo.delete(insight=insight)