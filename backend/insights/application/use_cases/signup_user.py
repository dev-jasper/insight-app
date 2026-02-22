from __future__ import annotations

from dataclasses import dataclass
from insights.infrastructure.user_repository import UserRepository, UserAlreadyExistsError


class SignupValidationError(Exception):
    pass


@dataclass(frozen=True)
class SignupInput:
    username: str
    email: str
    password: str


@dataclass(frozen=True)
class SignupOutput:
    id: int
    username: str
    email: str


class SignupUserUseCase:
    def __init__(self, repo: UserRepository) -> None:
        self.repo = repo

    def execute(self, data: SignupInput) -> SignupOutput:
        username = (data.username or "").strip()
        email = (data.email or "").strip()
        password = data.password or ""

        if len(username) < 3:
            raise SignupValidationError("Username must be at least 3 characters.")
        if len(password) < 8:
            raise SignupValidationError("Password must be at least 8 characters.")

        if self.repo.exists_by_username(username=username):
            raise SignupValidationError("Username is already taken.")
        if email and self.repo.exists_by_email(email=email):
            raise SignupValidationError("Email is already registered.")

        try:
            created = self.repo.create_user(username=username, email=email, password=password)
        except UserAlreadyExistsError as exc:
            raise SignupValidationError("User already exists.") from exc

        return SignupOutput(id=created.id, username=created.username, email=created.email)