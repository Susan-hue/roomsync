from django.urls import path
from . import views

urlpatterns = [
    path('', views.ListNotificationsView.as_view(), name='notifications-list'),
    path('<uuid:notification_id>/read/', views.MarkAsReadView.as_view(), name='notification-read'),
]