from rest_framework import serializers
from apps.rooms.models import Room
from apps.users.api.serializers import UserSerializer


class RoomSerializer(serializers.ModelSerializer):
    """Serializer for room details (GET responses)"""
    creator = UserSerializer(read_only=True)
    creator_name = serializers.CharField(source='creator.name', read_only=True)
    
    class Meta:
        model = Room
        fields = ['id', 'name', 'description', 'creator', 'creator_name', 
                  'created_at', 'is_active', 'room_type']
        read_only_fields = ['id', 'created_at', 'creator']


class RoomCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating rooms (POST requests)"""
    
    class Meta:
        model = Room
        fields = ['name', 'description', 'room_type']
    
    def validate_name(self, value):
        """Ensure name is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Room name cannot be empty.")
        return value.strip()
    
    def validate_room_type(self, value):
        """Ensure room_type is valid choice"""
        if value not in ['chat', 'video']:
            raise serializers.ValidationError("Room type must be 'chat' or 'video'.")
        return value


class RoomUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating rooms (PUT/PATCH requests)"""
    
    class Meta:
        model = Room
        fields = ['name', 'description', 'room_type', 'is_active']
    
    def validate_name(self, value):
        """Ensure name is not empty"""
        if not value.strip():
            raise serializers.ValidationError("Room name cannot be empty.")
        return value.strip()
    
    def validate_room_type(self, value):
        """Ensure room_type is valid choice"""
        if value not in ['chat', 'video']:
            raise serializers.ValidationError("Room type must be 'chat' or 'video'.")
        return value

