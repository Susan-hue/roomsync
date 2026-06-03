from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListMyBookingsView.as_view(), name='my-bookings'),
    path('create/', views.CreateBookingView.as_view(), name='create-booking'),
    path('<uuid:booking_id>/', views.BookingDetailView.as_view(), name='booking-detail'),
    path('<uuid:booking_id>/cancel/', views.CancelBookingView.as_view(), name='cancel-booking'),
    path('admin/all/', views.ListAllBookingsView.as_view(), name='all-bookings'),
]
