"""
Custom User model for the Trucker Trip Planner.

Uses email as the login identifier instead of username.
Passwords are hashed with Argon2 (configured in settings.PASSWORD_HASHERS).
"""
from __future__ import annotations

import uuid
from typing import ClassVar

from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager["User"]):
    def create_user(self, email: str, password: str, **extra: object) -> "User":
        if not email:
            raise ValueError("Email is required.")
        user: User = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email: str, password: str, **extra: object) -> "User":
        extra.setdefault("is_staff", True)
        extra.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    """Driver account. Email is the unique login identifier."""

    id: models.UUIDField[uuid.UUID, uuid.UUID] = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email: models.EmailField[str, str] = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff: bool | models.BooleanField[bool, bool] = models.BooleanField(default=False)
    created_at: models.DateTimeField[str, str] = models.DateTimeField(auto_now_add=True)

    objects: ClassVar[UserManager] = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS: ClassVar[list[str]] = []

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.email