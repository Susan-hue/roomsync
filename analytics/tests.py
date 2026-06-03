from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from .models import AnalyticsEvent

User = get_user_model()


class AnalyticsEventModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@test.com', password='pass')

    def test_create_event(self):
        event = AnalyticsEvent.objects.create(
            event_type='booking_created',
            user=self.user,
            metadata={'booking_id': 1},
        )
        self.assertEqual(str(event), f"booking_created at {event.created_at}")


class AnalyticsDashboardTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(email='admin@test.com', password='pass')
        self.client.force_authenticate(user=self.admin)

    def test_dashboard_returns_200(self):
        response = self.client.get('/api/analytics/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_rooms', response.data)
        self.assertIn('total_bookings', response.data)
        self.assertIn('total_users', response.data)
        self.assertIn('active_bookings', response.data)

    def test_events_endpoint(self):
        response = self.client.get('/api/analytics/events/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
