"""Serializers for user registration, login, and profile responses."""
from __future__ import annotations
from typing import Any

from django.contrib.auth import authenticate
from rest_framework import serializers
from users.models import User 


class RegisterSerializer(serializers.Serializer[Any]):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_email(self, value: str) -> str:
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value.lower()

    def validate(self, data: dict[str, str]) -> dict[str, str]:
        if data["password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data: dict[str, str]) -> object:
        validated_data.pop("confirm_password")
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer[Any]):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data: dict[str,Any]) -> dict[str, Any]:
        user = authenticate(username=data["email"].lower(), password=data["password"])
        if not user:
            raise serializers.ValidationError({"email": "Invalid email or password."})
        if not user.is_active:
            raise serializers.ValidationError({"email": "This account is inactive."})
        data["user"] = user
        return data


class UserSerializer(serializers.ModelSerializer[Any]):
    class Meta:
        model = User
        fields = ["id", "email", "created_at"]
        read_only_fields = ["id", "created_at"]