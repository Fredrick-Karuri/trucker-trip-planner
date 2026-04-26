"""
Auth integration tests — register, login, token refresh, ownership scoping.
"""
from __future__ import annotations

from typing import cast
from unittest.mock import MagicMock, patch

import pytest
from rest_framework.test import APIClient


@pytest.fixture
def client() -> APIClient:
    return APIClient()


@pytest.fixture
def registered_user(client: APIClient) -> dict[str, object]:
    res = client.post("/api/auth/register/", {
        "email": "driver@example.com",
        "password": "securepass1",
        "confirm_password": "securepass1",
    }, format="json")
    return cast(dict[str, object], res.data)

@pytest.mark.django_db
class TestRegister:
    def test_valid_register_returns_201_with_tokens(self, client: APIClient) -> None:
        res = client.post("/api/auth/register/", {
            "email": "new@example.com",
            "password": "securepass1",
            "confirm_password": "securepass1",
        }, format="json")
        assert res.status_code == 201
        assert "access" in res.data
        assert "refresh" in res.data
        assert res.data["user"]["email"] == "new@example.com"

    def test_duplicate_email_returns_400(self, client: APIClient, registered_user: dict[str, object]) -> None:
        res = client.post("/api/auth/register/", {
            "email": "driver@example.com",
            "password": "securepass1",
            "confirm_password": "securepass1",
        }, format="json")
        assert res.status_code == 400
        fields = [e["field"] for e in res.data["field_errors"]]
        assert "email" in fields

    def test_password_mismatch_returns_400(self, client: APIClient) -> None:
        res = client.post("/api/auth/register/", {
            "email": "other@example.com",
            "password": "securepass1",
            "confirm_password": "different",
        }, format="json")
        assert res.status_code == 400

    def test_short_password_returns_400(self, client: APIClient) -> None:
        res = client.post("/api/auth/register/", {
            "email": "short@example.com",
            "password": "abc",
            "confirm_password": "abc",
        }, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_valid_credentials_return_tokens(self, client: APIClient, registered_user: dict[str, object]) -> None:
        res = client.post("/api/auth/login/", {
            "email": "driver@example.com",
            "password": "securepass1",
        }, format="json")
        assert res.status_code == 200
        assert "access" in res.data

    def test_wrong_password_returns_401(self, client: APIClient, registered_user: dict[str, object]) -> None:
        res = client.post("/api/auth/login/", {
            "email": "driver@example.com",
            "password": "wrongpassword",
        }, format="json")
        assert res.status_code == 401

    def test_unknown_email_returns_401(self, client: APIClient) -> None:
        res = client.post("/api/auth/login/", {
            "email": "nobody@example.com",
            "password": "securepass1",
        }, format="json")
        assert res.status_code == 401


@pytest.mark.django_db
class TestOwnershipScoping:
    def _auth_client(self, email: str) -> APIClient:
        c = APIClient()
        reg = c.post("/api/auth/register/", {
            "email": email,
            "password": "securepass1",
            "confirm_password": "securepass1",
        }, format="json")
        c.credentials(HTTP_AUTHORIZATION=f"Bearer {reg.data['access']}")
        return c

    def test_unauthenticated_trip_plan_returns_401(self, client: APIClient) -> None:
        res = client.post("/api/trip/plan/", {
            "current_location": "Chicago, IL",
            "pickup_location": "Indianapolis, IN",
            "dropoff_location": "Nashville, TN",
            "cycle_hours_used": "0",
            "start_time": "2024-01-15T08:00:00Z",
        }, format="json")
        assert res.status_code == 401

    def test_user_a_cannot_fetch_user_b_trip(self) -> None:
        user_a = self._auth_client("a@example.com")
        user_b = self._auth_client("b@example.com")

        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_task = MagicMock()
            mock_task.id = "fake-task-id"
            mock_delay.return_value = mock_task

            res = user_a.post("/api/trip/plan/", {
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Nashville, TN",
                "cycle_hours_used": "0",
                "start_time": "2024-01-15T08:00:00Z",
            }, format="json")
            trip_id = res.data["trip_id"]

        res = user_b.get(f"/api/trips/{trip_id}/")
        assert res.status_code == 404

    def test_history_returns_only_own_trips(self) -> None:
        user_a = self._auth_client("aa@example.com")
        user_b = self._auth_client("bb@example.com")

        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_delay.return_value = MagicMock(id="t1")
            user_a.post("/api/trip/plan/", {
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Nashville, TN",
                "cycle_hours_used": "0",
                "start_time": "2024-01-15T08:00:00Z",
            }, format="json")

        res = user_b.get("/api/trips/")
        assert res.status_code == 200
        assert res.data["count"] == 0