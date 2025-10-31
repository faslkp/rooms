from django.utils.dateparse import parse_datetime
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from apps.rooms.models import Room
from apps.chat.models import Message
from apps.chat.api.serializers import MessageSerializer


class RoomMessagesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id: int):
        # Checking if the room exists and is active
        try:
            room = Room.objects.get(id=room_id, is_active=True)
        except Room.DoesNotExist:
            return Response({'detail': 'Room not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Taking the limit parameter from the request
        try:
            limit = int(request.query_params.get('limit', 50))
            limit = max(1, min(limit, 200))
        except ValueError:
            limit = 50

        # Taking the before parameter from the request. It will help set up infinite scroll later.
        before_param = request.query_params.get('before')
        queryset = Message.objects.filter(room_id=room.id)

        if before_param:
            dt = parse_datetime(before_param)
            if dt is None:
                return Response({'detail': 'Invalid "before" timestamp.'}, status=status.HTTP_400_BAD_REQUEST)
            queryset = queryset.filter(created_at__lt=dt)

        messages = list(queryset.order_by('-created_at')[:limit])
        messages.reverse()

        data = MessageSerializer(messages, many=True).data
        return Response({'results': data}, status=status.HTTP_200_OK)
