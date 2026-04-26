"""URL patterns for the auth app."""
from __future__ import annotations

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from users import views

urlpatterns = [
    path("register/", views.register, name="auth-register"),
    path("login/", views.login, name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", views.me, name="auth-me"),
]