from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.db import transaction

from .models import Booking, RoundRobinQueue
from .serializers import BookingSerializer
from rooms.models import Room
from notifications.models import Notification


class ListMyBookingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(user=request.user).order_by('-created_at')
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        room_id = request.data.get('room')
        date = request.data.get('date')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        purpose = request.data.get('purpose', '')

        # Step 1 — Find the room
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Step 2 — Check if room is available
        if not room.is_available:
            return Response(
                {'error': 'This room is currently unavailable'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Step 3 — Check for time slot conflicts
        conflicting = Booking.objects.filter(
            room=room,
            date=date,
            status__in=['pending', 'confirmed'],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        if conflicting.exists():
            return Response(
                {'error': 'Time slot is already booked',
                 'conflicting_booking': {
                     'date': date,
                     'start_time': str(conflicting.first().start_time),
                     'end_time': str(conflicting.first().end_time)
                 }},
                status=status.HTTP_409_CONFLICT
            )

        # Step 4 — Round-robin fairness check
        queue_entry, created = RoundRobinQueue.objects.get_or_create(
            room=room,
            user=request.user,
            defaults={
                'booking_count': 0,
                'priority_weight': 2.0 if request.user.role == 'lecturer' else 1.0
            }
        )

        # Skip round-robin for admins
        if request.user.role != 'admin':
            users_with_fewer_bookings = RoundRobinQueue.objects.filter(
                room=room,
                booking_count__lt=queue_entry.booking_count
            ).exclude(user=request.user)

            if users_with_fewer_bookings.exists() and queue_entry.last_booked_at:
                time_since_last = timezone.now() - queue_entry.last_booked_at

                if time_since_last.total_seconds() < 86400:  # 24 hours
                    if request.user.role == 'lecturer':
                        lecturer_waiting = users_with_fewer_bookings.filter(
                            priority_weight__gte=2.0
                        )
                        if lecturer_waiting.exists():
                            return Response(
                                {'error': 'Another lecturer with fewer bookings is waiting. Please try another room or time.'},
                                status=status.HTTP_409_CONFLICT
                            )
                    else:
                        return Response(
                            {'error': 'Other students have fewer bookings for this room. Please try again later or choose another room.',
                             'suggestion': 'Round-robin fairness ensures equal access for all students.'},
                            status=status.HTTP_409_CONFLICT
                        )

        # Step 5 — Create the booking
        booking_data = {
            'room': room.id,
            'date': date,
            'start_time': start_time,
            'end_time': end_time,
            'purpose': purpose,
        }

        serializer = BookingSerializer(data=booking_data)
        if serializer.is_valid():
            booking = serializer.save(user=request.user, status='confirmed')

            # Step 6 — Create confirmation notification
            Notification.objects.create(
                user=request.user,
                booking=booking,
                type='confirmed',
                message=f'Your booking for {room.name} on {date} from {start_time} to {end_time} has been confirmed.'
            )

            # Step 7 — Update round-robin queue
            queue_entry.booking_count += 1
            queue_entry.last_booked_at = timezone.now()
            queue_entry.save()

            return Response(
                BookingSerializer(booking).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class BookingDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = BookingSerializer(booking)
        return Response(serializer.data)


class CancelBookingView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, booking_id):
        try:
            booking = Booking.objects.get(id=booking_id)
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        if booking.user != request.user and not request.user.is_staff:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )

        if booking.status == 'cancelled':
            return Response(
                {'error': 'Booking is already cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking.status = 'cancelled'
        booking.save()

        # Create cancellation notification
        Notification.objects.create(
            user=booking.user,
            booking=booking,
            type='cancelled',
            message=f'Your booking for {booking.room.name} on {booking.date} has been cancelled.'
        )

        try:
            queue_entry = RoundRobinQueue.objects.get(
                room=booking.room,
                user=booking.user
            )
            queue_entry.booking_count = max(0, queue_entry.booking_count - 1)
            queue_entry.save()
        except RoundRobinQueue.DoesNotExist:
            pass

        return Response(
            {'message': 'Booking cancelled successfully',
             'booking': BookingSerializer(booking).data}
        )


class ListAllBookingsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        bookings = Booking.objects.all().order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        room_id = request.query_params.get('room')
        if room_id:
            bookings = bookings.filter(room_id=room_id)

        date_filter = request.query_params.get('date')
        if date_filter:
            bookings = bookings.filter(date=date_filter)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)