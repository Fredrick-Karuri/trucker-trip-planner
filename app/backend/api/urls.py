"""URL patterns for the API."""
from __future__ import annotations

from django.urls import path
from api import views

urlpatterns = [
    path("trip/plan/", views.plan_trip, name="trip-plan"),
    path("trip/status/<str:task_id>/", views.trip_status, name="trip-status"),
    path("trips/", views.trip_history, name="trip-history"),
    path("trips/<str:trip_id>/", views.trip_detail, name="trip-detail"),
]