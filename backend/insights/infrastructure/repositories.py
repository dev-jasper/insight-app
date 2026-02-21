from typing import Iterable
from django.db import transaction
from backend.insights.models import Insight, Tag
from django.contrib.auth import get_user_model

User = get_user_model()


class InsightRepository:
    """Handles write operations for Insight."""

    @transaction.atomic
    def create(
        self,
        *,
        title: str,
        category: str,
        body: str,
        tags: Iterable[str],
        created_by: User,
    ) -> Insight:
        insight = Insight.objects.create(
            title=title,
            category=category,
            body=body,
            created_by=created_by,
        )

        tag_objs = self._get_or_create_tags(tags)
        insight.tags.set(tag_objs)

        return insight

    def update(
        self,
        *,
        insight: Insight,
        title: str,
        category: str,
        body: str,
        tags: Iterable[str],
    ) -> Insight:
        insight.title = title
        insight.category = category
        insight.body = body
        insight.save()

        tag_objs = self._get_or_create_tags(tags)
        insight.tags.set(tag_objs)

        return insight

    def delete(self, *, insight: Insight) -> None:
        insight.delete()

    def _get_or_create_tags(self, tags: Iterable[str]) -> list[Tag]:
        tag_objs = []
        for tag_name in tags:
            tag, _ = Tag.objects.get_or_create(name=tag_name.strip())
            tag_objs.append(tag)
        return tag_objs