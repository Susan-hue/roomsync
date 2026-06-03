import uuid
from django.db import models


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='bookings')
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='bookings')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    purpose = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.full_name} - {self.room.name} on {self.date}'


class RoundRobinQueue(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room = models.ForeignKey('rooms.Room', on_delete=models.CASCADE, related_name='round_robin_entries')
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='round_robin_entries')
    last_booked_at = models.DateTimeField(blank=True, null=True)
    booking_count = models.IntegerField(default=0)
    priority_weight = models.FloatField(default=1.0)

    def __str__(self):
        return f'{self.user.full_name} - {self.room.name} ({self.booking_count} bookings)'