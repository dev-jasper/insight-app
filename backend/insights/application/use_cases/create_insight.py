from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from django.contrib.auth import get_user_model

from insights.domain.rules import validate_insight_payload
from insights.infrastructure.repositories import InsightRepository

User = get_user_model()


@dataclass(frozen=True)
class CreateInsightInput:
    title: str
    category: str
    body: str
    tags: list[str]


class CreateInsightUseCase:
    def __init__(self, *, repo: InsightRepository):
        self.repo = repo

    def execute(self, *, data: CreateInsightInput, user: User):
        validate_insight_payload(
            title=data.title,
            body=data.body,
            category=data.category,
            tags=data.tags,
        )
        return self.repo.create(
            title=data.title.strip(),
            category=data.category,
            body=data.body.strip(),
            tags=data.tags,
            created_by=user,
        )