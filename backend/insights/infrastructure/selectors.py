from django.db.models import Count, QuerySet
from insights.models import Insight, Tag


class InsightSelector:
    """Handles read operations for Insight."""

    def list(
        self,
        *,
        search: str | None = None,
        category: str | None = None,
        tag: str | None = None,
    ) -> QuerySet[Insight]:
        qs = Insight.objects.select_related("created_by").prefetch_related("tags")

        if search:
            qs = qs.filter(title__icontains=search)

        if category:
            qs = qs.filter(category=category)

        if tag:
            qs = qs.filter(tags__name__icontains=tag)

        return qs


class TagAnalyticsSelector:
    """Handles analytics queries."""

    def top_tags(self, *, limit: int = 10):
        return (
            Tag.objects.annotate(count=Count("insights"))
            .order_by("-count")[:limit]
        )