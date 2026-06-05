from django.db import models
from django.conf import settings


class AnalyticsEvent(models.Model):
    EVENT_TYPES = [
        ('booking_created', 'Booking Created'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('booking_completed', 'Booking Completed'),
        ('room_viewed', 'Room Viewed'),
        ('user_login', 'User Login'),
    ]

    event_type = models.CharField(max_length=50, choices=EVENT_TYPES)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='analytics_events',
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} at {self.created_at}"
