from django.urls import path
from .views import (
    DashboardSummaryView,
    BookingStatsView,
    RoomUtilizationView,
    TopUsersView,
    EventListView,
)

urlpatterns = [
    path('dashboard/', DashboardSummaryView.as_view(), name='analytics-dashboard'),
    path('bookings/', BookingStatsView.as_view(), name='analytics-bookings'),
    path('rooms/utilization/', RoomUtilizationView.as_view(), name='analytics-room-utilization'),
    path('users/top/', TopUsersView.as_view(), name='analytics-top-users'),
    path('events/', EventListView.as_view(), name='analytics-events'),
]
