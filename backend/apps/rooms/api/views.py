import logging

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from apps.rooms.models import Room
from apps.rooms.api.serializers import (
    RoomSerializer, 
    RoomCreateSerializer, 
    RoomUpdateSerializer
)

logger = logging.getLogger('apps.rooms')


class RoomViewSet(viewsets.ModelViewSet):
    """ViewSet for room operations"""
    permission_classes = [IsAuthenticated]
    serializer_class = RoomSerializer
    
    def get_queryset(self):
        return Room.objects.filter(is_active=True).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RoomCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RoomUpdateSerializer
        return RoomSerializer
    
    def perform_create(self, serializer):
        room = serializer.save(creator=self.request.user)
        logger.info(f"ROOM create room_id={room.id} user_id={self.request.user.id}")
    
    def destroy(self, request, *args, **kwargs):
        room = self.get_object()
        if room.creator != request.user:
            logger.warning(f"ROOM delete denied room_id={room.id} user_id={request.user.id}")
            raise PermissionDenied("You can only delete rooms you created.")
        room.is_active = False
        room.save()
        logger.info(f"ROOM delete room_id={room.id} user_id={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

