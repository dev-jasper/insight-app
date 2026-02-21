from __future__ import annotations

from backend.insights.infrastructure.selectors import TagAnalyticsSelector


class TopTagsUseCase:
    def __init__(self, *, selector: TagAnalyticsSelector):
        self.selector = selector

    def execute(self, *, limit: int = 10):
        return self.selector.top_tags(limit=limit)