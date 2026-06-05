from django.urls import path
from . import views

urlpatterns = [
    path('', views.RoomListView.as_view(), name='room-list'),
    path('create/', views.RoomCreateView.as_view(), name='room-create'),
    path('<uuid:room_id>/', views.RoomDetailView.as_view(), name='room-detail'),
    path('<uuid:room_id>/update/', views.RoomUpdateView.as_view(), name='room-update'),
    path('<uuid:room_id>/delete/', views.RoomDeleteView.as_view(), name='room-delete'),
    path('<uuid:room_id>/availability/', views.RoomAvailabilityView.as_view(), name='room-availability'),
]
