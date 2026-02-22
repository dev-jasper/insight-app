from __future__ import annotations

from dataclasses import dataclass
from typing import Optional

from django.contrib.auth import get_user_model
from django.db import IntegrityError

User = get_user_model()


class UserAlreadyExistsError(Exception):
    pass


@dataclass(frozen=True)
class CreatedUser:
    id: int
    username: str
    email: str


class UserRepository:
    def create_user(self, *, username: str, email: str, password: str) -> CreatedUser:
        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
            )
        except IntegrityError as exc:
            # Covers unique constraints (username/email) depending on your User model config
            raise UserAlreadyExistsError("User already exists") from exc

        return CreatedUser(
            id=user.id,
            username=user.username,
            email=user.email or "",
        )

    def exists_by_username(self, *, username: str) -> bool:
        return User.objects.filter(username=username).exists()

    def exists_by_email(self, *, email: str) -> bool:
        if not email:
            return False
        return User.objects.filter(email=email).exists()