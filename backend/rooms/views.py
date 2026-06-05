from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from .serializers import RoomSerializer, TimeSlotSerializer
from .models import Room, TimeSlot


class RoomListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        rooms = Room.objects.all()
        serializer = RoomSerializer(rooms, many=True)
        return Response(serializer.data)


class RoomDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = RoomSerializer(room)
        return Response(serializer.data)


class RoomCreateView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = RoomSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomUpdateView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = RoomSerializer(room, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RoomDeleteView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        room.delete()
        return Response(
            {'message': 'Room deleted successfully'},
            status=status.HTTP_204_NO_CONTENT
        )


class RoomAvailabilityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, room_id):
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        time_slots = TimeSlot.objects.filter(room=room, is_blocked=False)
        serializer = TimeSlotSerializer(time_slots, many=True)
        return Response(serializer.data)