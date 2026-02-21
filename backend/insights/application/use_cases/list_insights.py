from __future__ import annotations

from dataclasses import dataclass
from insights.infrastructure.selectors import InsightSelector


@dataclass(frozen=True)
class ListInsightsQuery:
    search: str | None = None
    category: str | None = None
    tag: str | None = None


class ListInsightsUseCase:
    def __init__(self, *, selector: InsightSelector):
        self.selector = selector

    def execute(self, *, query: ListInsightsQuery):
        return self.selector.list(
            search=query.search,
            category=query.category,
            tag=query.tag,
        )