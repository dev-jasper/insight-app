from __future__ import annotations

from dataclasses import dataclass

from django.contrib.auth import get_user_model

from insights.domain.rules import validate_insight_payload
from insights.infrastructure.repositories import InsightRepository
from insights.models import Insight

User = get_user_model()


@dataclass(frozen=True)
class UpdateInsightInput:
    title: str
    category: str
    body: str
    tags: list[str]


class UpdateInsightUseCase:
    def __init__(self, *, repo: InsightRepository):
        self.repo = repo

    def execute(self, *, insight: Insight, data: UpdateInsightInput, user: User) -> Insight:
        if insight.created_by_id != user.id:
            # keep it domain-level simple; API layer maps to 403
            raise PermissionError("Only the owner can update this insight.")

        validate_insight_payload(
            title=data.title,
            body=data.body,
            category=data.category,
            tags=data.tags,
        )

        return self.repo.update(
            insight=insight,
            title=data.title.strip(),
            category=data.category,
            body=data.body.strip(),
            tags=data.tags,
        )