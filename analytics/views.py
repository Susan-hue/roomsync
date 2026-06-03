from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.db.models.functions import TruncDate

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser

from .models import AnalyticsEvent
from .serializers import (
    AnalyticsEventSerializer,
    DashboardSummarySerializer,
    BookingStatsSerializer,
    RoomUtilizationSerializer,
    TopUsersSerializer,
)

User = get_user_model()


class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from bookings.models import Booking
        from rooms.models import Room

        data = {
            'total_rooms': Room.objects.count(),
            'total_bookings': Booking.objects.count(),
            'total_users': User.objects.count(),
            'active_bookings': Booking.objects.filter(status='active').count(),
        }
        serializer = DashboardSummarySerializer(data)
        return Response(serializer.data)


class BookingStatsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from bookings.models import Booking

        days = int(request.query_params.get('days', 30))
        since = timezone.now() - timezone.timedelta(days=days)

        stats = (
            Booking.objects.filter(created_at__gte=since)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(count=Count('id'))
            .order_by('date')
        )

        serializer = BookingStatsSerializer(stats, many=True)
        return Response(serializer.data)


class RoomUtilizationView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from bookings.models import Booking
        from rooms.models import Room

        total_bookings = Booking.objects.count() or 1

        rooms = (
            Room.objects.annotate(total_bookings=Count('bookings'))
            .values('id', 'name', 'total_bookings')
            .order_by('-total_bookings')
        )

        data = [
            {
                'room_id': r['id'],
                'room_name': r['name'],
                'total_bookings': r['total_bookings'],
                'utilization_rate': round(r['total_bookings'] / total_bookings * 100, 2),
            }
            for r in rooms
        ]

        serializer = RoomUtilizationSerializer(data, many=True)
        return Response(serializer.data)


class TopUsersView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        from bookings.models import Booking

        limit = int(request.query_params.get('limit', 10))

        users = (
            User.objects.annotate(total_bookings=Count('bookings'))
            .filter(total_bookings__gt=0)
            .values('id', 'email', 'total_bookings')
            .order_by('-total_bookings')[:limit]
        )

        data = [
            {
                'user_id': u['id'],
                'email': u['email'],
                'total_bookings': u['total_bookings'],
            }
            for u in users
        ]

        serializer = TopUsersSerializer(data, many=True)
        return Response(serializer.data)


class EventListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        events = AnalyticsEvent.objects.select_related('user').all()[:100]
        serializer = AnalyticsEventSerializer(events, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = AnalyticsEventSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return Response(serializer.data, status=201)
