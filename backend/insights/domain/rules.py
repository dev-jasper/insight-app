from __future__ import annotations

from typing import Iterable
from .exceptions import ValidationError


def validate_insight_payload(*, title: str, body: str, category: str, tags: Iterable[str]) -> None:
    errors: dict[str, list[str]] = {}

    title_len = len(title.strip())
    if title_len < 5 or title_len > 200:
        errors.setdefault("title", []).append("Must be between 5 and 200 characters.")

    body_len = len(body.strip())
    if body_len < 20:
        errors.setdefault("body", []).append("Must be at least 20 characters.")

    tag_list = [t.strip() for t in tags if t and t.strip()]
    if len(tag_list) < 1 or len(tag_list) > 10:
        errors.setdefault("tags", []).append("Must contain between 1 and 10 tags.")

    if len(set(tag_list)) != len(tag_list):
        errors.setdefault("tags", []).append("Tags must not contain duplicates.")

    if errors:
        raise ValidationError(errors)