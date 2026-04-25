"""URL patterns for the Trucker Trip Planner API."""

from django.urls import path
from api import views

urlpatterns = [
    path("trip/plan/", views.plan_trip, name="trip-plan"),
    path("trip/status/<str:task_id>/", views.trip_status, name="trip-status"),
]