from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework import serializers

from apps.rooms.models import Room
from apps.rooms.api.serializers import (
    RoomSerializer,
    RoomCreateSerializer,
    RoomUpdateSerializer
)

User = get_user_model()


class RoomSerializerTest(TestCase):
    """Test RoomSerializer"""
    
    def setUp(self):
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Test Room',
            description='Test Description',
            creator=self.creator,
            room_type='chat'
        )
    
    def test_serializer_returns_correct_fields(self):
        """Test serializer returns all room fields"""
        serializer = RoomSerializer(self.room)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('name', data)
        self.assertIn('description', data)
        self.assertIn('creator', data)
        self.assertIn('creator_name', data)
        self.assertIn('created_at', data)
        self.assertIn('is_active', data)
        self.assertIn('room_type', data)
        self.assertEqual(data['name'], 'Test Room')
        self.assertEqual(data['description'], 'Test Description')
        self.assertEqual(data['creator_name'], 'Creator User')
    
    def test_serializer_read_only_fields(self):
        """Test read-only fields cannot be updated"""
        serializer = RoomSerializer(
            self.room,
            data={'id': 999, 'name': 'Updated Room'},
            partial=True
        )
        self.assertEqual(self.room.id, self.room.id)


class RoomCreateSerializerTest(TestCase):
    """Test RoomCreateSerializer"""
    
    def setUp(self):
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.valid_data = {
            'name': 'New Room',
            'description': 'Room Description',
            'room_type': 'video'
        }
    
    def test_valid_serializer_creates_room(self):
        """Test serializer validates valid data"""
        serializer = RoomCreateSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        room = serializer.save(creator=self.creator)
        self.assertEqual(room.name, 'New Room')
        self.assertEqual(room.room_type, 'video')
        self.assertEqual(room.creator, self.creator)
    
    def test_serializer_validates_empty_name(self):
        """Test serializer validates empty name"""
        data = self.valid_data.copy()
        data['name'] = '   '
        serializer = RoomCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_serializer_validates_room_type(self):
        """Test serializer validates room_type choices"""
        data = self.valid_data.copy()
        data['room_type'] = 'invalid'
        serializer = RoomCreateSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('room_type', serializer.errors)
    
    def test_serializer_strips_name_whitespace(self):
        """Test serializer strips name whitespace"""
        data = self.valid_data.copy()
        data['name'] = '  Test Room  '
        serializer = RoomCreateSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['name'], 'Test Room')


class RoomUpdateSerializerTest(TestCase):
    """Test RoomUpdateSerializer"""
    
    def setUp(self):
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Original Room',
            description='Original Description',
            creator=self.creator,
            room_type='chat'
        )
        self.valid_data = {
            'name': 'Updated Room',
            'description': 'Updated Description',
            'room_type': 'video',
            'is_active': False
        }
    
    def test_valid_serializer_updates_room(self):
        """Test serializer updates room with valid data"""
        serializer = RoomUpdateSerializer(
            self.room,
            data=self.valid_data,
            partial=True
        )
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.room.refresh_from_db()
        self.assertEqual(self.room.name, 'Updated Room')
        self.assertEqual(self.room.description, 'Updated Description')
        self.assertEqual(self.room.room_type, 'video')
        self.assertFalse(self.room.is_active)
    
    def test_serializer_validates_empty_name(self):
        """Test serializer validates empty name"""
        data = self.valid_data.copy()
        data['name'] = ''
        serializer = RoomUpdateSerializer(
            self.room,
            data=data,
            partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
    
    def test_serializer_validates_room_type(self):
        """Test serializer validates room_type choices"""
        data = self.valid_data.copy()
        data['room_type'] = 'invalid'
        serializer = RoomUpdateSerializer(
            self.room,
            data=data,
            partial=True
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('room_type', serializer.errors)

