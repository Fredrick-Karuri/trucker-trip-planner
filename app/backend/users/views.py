"""
Auth views — register, login, token refresh, and current user profile.

POST /api/auth/register/ — creates account, returns tokens + user
POST /api/auth/login/    — authenticates, returns tokens + user
POST /api/auth/refresh/  — issues new access token from refresh token (simplejwt)
GET  /api/auth/me/       — returns current user (requires valid JWT)
"""
from __future__ import annotations

from django.contrib.auth import get_user_model
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from users.serializers import LoginSerializer, RegisterSerializer, UserSerializer
from users.models import User

def _token_pair(user: User) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request: Request) -> Response:
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        field_errors = [
            {"field": f, "message": msgs[0]}
            for f, msgs in serializer.errors.items()
            if f != "non_field_errors"
        ]
        global_errors = serializer.errors.get("non_field_errors", [])
        return Response(
            {"field_errors": field_errors, "error": global_errors[0] if global_errors else None},
            status=400,
        )
    user = serializer.save()
    return Response({"user": UserSerializer(user).data, **_token_pair(user)}, status=201)


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request: Request) -> Response:
    serializer = LoginSerializer(data=request.data)
    if not serializer.is_valid():
        field_errors = [
            {"field": f, "message": msgs[0]}
            for f, msgs in serializer.errors.items()
            if f != "non_field_errors"
        ]
        return Response({"field_errors": field_errors}, status=401)
    user = serializer.validated_data["user"]
    return Response({"user": UserSerializer(user).data, **_token_pair(user)})


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request: Request) -> Response:
    return Response(UserSerializer(request.user).data)