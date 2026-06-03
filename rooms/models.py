import uuid
from django.db import models


class Room(models.Model):
    ROOM_TYPE_CHOICES = [
        ('study_room', 'Study Room'),
        ('lab', 'Lab'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES, default='study_room')
    capacity = models.IntegerField()
    location = models.CharField(max_length=255)
    is_available = models.BooleanField(default=True)
    amenities = models.JSONField(default=list, blank=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)

    def __str__(self):
        return f'{self.name} ({self.get_room_type_display()})'


class TimeSlot(models.Model):
    DAY_CHOICES = [
        (0, 'Monday'),
        (1, 'Tuesday'),
        (2, 'Wednesday'),
        (3, 'Thursday'),
        (4, 'Friday'),
        (5, 'Saturday'),
        (6, 'Sunday'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='time_slots')
    start_time = models.TimeField()
    end_time = models.TimeField()
    day_of_week = models.IntegerField(choices=DAY_CHOICES)
    is_blocked = models.BooleanField(default=False)

    def __str__(self):
        return f'{self.room.name} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}'