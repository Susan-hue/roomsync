from rest_framework import serializers
from .models import Booking
from rooms.serializers import RoomSerializer
from accounts.serializers import UserSerializer


class BookingSerializer(serializers.ModelSerializer):
    room_detail = RoomSerializer(source='room', read_only=True)
    user_detail = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'user', 'user_detail', 'room', 'room_detail', 'date', 'start_time', 'end_time', 'status', 'purpose', 'created_at']
        read_only_fields = ['id', 'user', 'user_detail', 'status', 'created_at']