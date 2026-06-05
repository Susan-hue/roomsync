from rest_framework import serializers
from .models import Room, TimeSlot


class TimeSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeSlot
        fields = ['id', 'room', 'start_time', 'end_time', 'day_of_week', 'is_blocked']
        read_only_fields = ['id']


class RoomSerializer(serializers.ModelSerializer):
    time_slots = TimeSlotSerializer(many=True, read_only=True)

    class Meta:
        model = Room
        fields = ['id', 'name', 'room_type', 'capacity', 'location', 'is_available', 'amenities', 'hourly_rate', 'time_slots']
        read_only_fields = ['id']