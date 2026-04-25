"""
Integration tests for the API endpoints.

Verifies request validation, error code mapping, and task enqueue/poll flow.
ORS is mocked in all tests — no live API calls.
"""

from unittest.mock import MagicMock, patch
import pytest
from rest_framework.test import APIClient


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.mark.django_db
class TestPlanTripEndpoint:
    """POST /api/trip/plan/"""

    def test_returns_202_with_task_id(self, api_client: APIClient) -> None:
        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_task = MagicMock()
            mock_task.id = "test-task-uuid-001"
            mock_delay.return_value = mock_task

            response = api_client.post(
                "/api/trip/plan/",
                {
                    "current_location": "Chicago, IL",
                    "pickup_location": "Indianapolis, IN",
                    "dropoff_location": "Nashville, TN",
                    "cycle_hours_used": "10.0",
                    "start_time": "2024-01-15T08:00:00Z",
                },
                format="json",
            )

        assert response.status_code == 202
        assert "task_id" in response.data
        assert response.data["task_id"] == "test-task-uuid-001"

    def test_missing_required_field_returns_400(self, api_client: APIClient) -> None:
        response = api_client.post(
            "/api/trip/plan/",
            {
                "current_location": "Chicago, IL",
                # pickup_location missing
                "dropoff_location": "Nashville, TN",
                "cycle_hours_used": "0",
                "start_time": "2024-01-15T08:00:00Z",
            },
            format="json",
        )
        assert response.status_code == 400
        fields = [e["field"] for e in response.data["field_errors"]]
        assert "pickup_location" in fields

    def test_cycle_hours_above_70_returns_400(self, api_client: APIClient) -> None:
        response = api_client.post(
            "/api/trip/plan/",
            {
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Nashville, TN",
                "cycle_hours_used": "71",
                "start_time": "2024-01-15T08:00:00Z",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_negative_cycle_hours_returns_400(self, api_client: APIClient) -> None:
        response = api_client.post(
            "/api/trip/plan/",
            {
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Nashville, TN",
                "cycle_hours_used": "-1",
                "start_time": "2024-01-15T08:00:00Z",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_geocoding_error_returns_400(self, api_client: APIClient) -> None:
        from connectors.ors_client import GeocodingError
        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_delay.side_effect = GeocodingError("pickup_location", "Nowhere Land")
            response = api_client.post(
                "/api/trip/plan/",
                {
                    "current_location": "Chicago, IL",
                    "pickup_location": "Nowhere Land",
                    "dropoff_location": "Nashville, TN",
                    "cycle_hours_used": "0",
                    "start_time": "2024-01-15T08:00:00Z",
                },
                format="json",
            )
        assert response.status_code == 400

    def test_routing_error_returns_422(self, api_client: APIClient) -> None:
        from connectors.ors_client import RoutingError
        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_delay.side_effect = RoutingError("No HGV route found")
            response = api_client.post(
                "/api/trip/plan/",
                {
                    "current_location": "Chicago, IL",
                    "pickup_location": "Remote Island, AK",
                    "dropoff_location": "Nashville, TN",
                    "cycle_hours_used": "0",
                    "start_time": "2024-01-15T08:00:00Z",
                },
                format="json",
            )
        assert response.status_code == 422

    def test_ors_down_returns_503(self, api_client: APIClient) -> None:
        from connectors.ors_client import ORSServiceError
        with patch("api.views.simulate_trip.delay") as mock_delay:
            mock_delay.side_effect = ORSServiceError("ORS timeout")
            response = api_client.post(
                "/api/trip/plan/",
                {
                    "current_location": "Chicago, IL",
                    "pickup_location": "Indianapolis, IN",
                    "dropoff_location": "Nashville, TN",
                    "cycle_hours_used": "0",
                    "start_time": "2024-01-15T08:00:00Z",
                },
                format="json",
            )
        assert response.status_code == 503


@pytest.mark.django_db
class TestTripStatusEndpoint:
    """GET /api/trip/status/<task_id>/"""

    def test_pending_task(self, api_client: APIClient) -> None:
        with patch("api.views.AsyncResult") as mock_ar:
            mock_ar.return_value.state = "PENDING"
            response = api_client.get("/api/trip/status/fake-task-id/")
        assert response.status_code == 200
        assert response.data["status"] == "PENDING"

    def test_success_returns_result(self, api_client: APIClient) -> None:
        mock_result = {"summary": {"total_miles": 300}, "daily_logs": []}
        with patch("api.views.AsyncResult") as mock_ar:
            mock_ar.return_value.state = "SUCCESS"
            mock_ar.return_value.get.return_value = mock_result
            response = api_client.get("/api/trip/status/fake-task-id/")
        assert response.status_code == 200
        assert response.data["status"] == "SUCCESS"
        assert response.data["result"]["summary"]["total_miles"] == 300

    def test_failure_returns_error_message(self, api_client: APIClient) -> None:
        with patch("api.views.AsyncResult") as mock_ar:
            mock_ar.return_value.state = "FAILURE"
            mock_ar.return_value.result = Exception("Simulation failed")
            response = api_client.get("/api/trip/status/fake-task-id/")
        assert response.status_code == 500
        assert "error" in response.data