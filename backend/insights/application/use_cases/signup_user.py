from __future__ import annotations

from dataclasses import dataclass

from insights.infrastructure.user_repository import UserAlreadyExistsError, UserRepository


class SignupValidationError(Exception):
    pass


@dataclass(frozen=True)
class SignupRequest:
    username: str
    email: str
    password: str


@dataclass(frozen=True)
class SignupResult:
    id: int
    username: str
    email: str


class SignupUserUseCase:
    def __init__(self, user_repo: UserRepository) -> None:
        self.user_repo = user_repo

    def execute(self, req: SignupRequest) -> SignupResult:
        username = (req.username or "").strip()
        email = (req.email or "").strip()
        password = req.password or ""

        if len(username) < 3:
            raise SignupValidationError("Username must be at least 3 characters.")
        if len(password) < 8:
            raise SignupValidationError("Password must be at least 8 characters.")

        # Optional: block duplicate username/email early with nicer messages
        if self.user_repo.exists_by_username(username=username):
            raise SignupValidationError("Username is already taken.")
        if email and self.user_repo.exists_by_email(email=email):
            raise SignupValidationError("Email is already registered.")

        try:
            created = self.user_repo.create_user(username=username, email=email, password=password)
        except UserAlreadyExistsError as exc:
            raise SignupValidationError("User already exists.") from exc

        return SignupResult(id=created.id, username=created.username, email=created.email)