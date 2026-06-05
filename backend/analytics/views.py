from datetime import timedelta
from django.utils import timezone
from django.db.models import Count
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser

from bookings.models import Booking
from rooms.models import Room


class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        now = timezone.now()
        start_of_week = now - timedelta(days=now.weekday())
        start_of_month = now.replace(day=1)

        # Basic counts
        total_rooms = Room.objects.count()
        total_bookings = Booking.objects.exclude(status='cancelled').count()
        bookings_this_week = Booking.objects.filter(
            created_at__gte=start_of_week,
            status='confirmed'
        ).count()
        bookings_this_month = Booking.objects.filter(
            created_at__gte=start_of_month,
            status='confirmed'
        ).count()

        # Most popular room
        popular_room = Booking.objects.filter(
            status='confirmed'
        ).values('room__name').annotate(
            count=Count('id')
        ).order_by('-count').first()

        # Bookings per room (for bar chart)
        bookings_per_room = list(
            Booking.objects.filter(
                status='confirmed'
            ).values('room__name').annotate(
                count=Count('id')
            ).order_by('-count')
        )

        # Peak hours (for line chart)
        peak_hours = list(
            Booking.objects.filter(
                status='confirmed'
            ).values('start_time').annotate(
                count=Count('id')
            ).order_by('start_time')
        )

        # Recent bookings
        recent_bookings = list(
            Booking.objects.filter(
                status='confirmed'
            ).order_by('-created_at')[:5].values(
                'room__name', 'date', 'start_time', 'end_time'
            )
        )

        return Response({
            'total_rooms': total_rooms,
            'total_bookings': total_bookings,
            'bookings_this_week': bookings_this_week,
            'bookings_this_month': bookings_this_month,
            'most_popular_room': popular_room['room__name'] if popular_room else None,
            'bookings_per_room': bookings_per_room,
            'peak_hours': peak_hours,
            'recent_bookings': recent_bookings,
        })