from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.rooms.models import Room
from apps.chat.models import Message

User = get_user_model()


class RoomMessagesListViewTest(TestCase):
    """Test RoomMessagesListView"""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='pass123'
        )
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Test Room',
            creator=self.creator,
            room_type='chat'
        )
        # Create some messages
        self.message1 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='First message',
            created_at=timezone.now()
        )
        self.message2 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Second message',
            created_at=timezone.now()
        )
        self.message3 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Third message',
            created_at=timezone.now()
        )
    
    def test_get_messages_success(self):
        """Test retrieving messages for a room"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/rooms/{self.room.id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 3)
        # Messages should be in chronological order
        messages = response.data['results']
        self.assertEqual(messages[0]['content'], 'First message')
        self.assertEqual(messages[1]['content'], 'Second message')
        self.assertEqual(messages[2]['content'], 'Third message')
    
    def test_get_messages_unauthorized(self):
        """Test retrieving messages without authentication"""
        response = self.client.get(f'/api/rooms/{self.room.id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_messages_nonexistent_room(self):
        """Test retrieving messages for nonexistent room returns 404"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/rooms/99999/messages/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('detail', response.data)
    
    def test_get_messages_inactive_room(self):
        """Test retrieving messages for inactive room returns 404"""
        inactive_room = Room.objects.create(
            name='Inactive Room',
            creator=self.creator,
            is_active=False
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/rooms/{inactive_room.id}/messages/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_get_messages_with_limit(self):
        """Test retrieving messages with limit parameter"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f'/api/rooms/{self.room.id}/messages/',
            {'limit': 2}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_get_messages_with_before(self):
        """Test retrieving messages with before parameter (pagination)"""
        self.client.force_authenticate(user=self.user)
        # Get first message's timestamp
        before_timestamp = self.message2.created_at.isoformat()
        response = self.client.get(
            f'/api/rooms/{self.room.id}/messages/',
            {'before': before_timestamp}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only return messages before message2
        results = response.data['results']
        self.assertLessEqual(len(results), 2)
        # Should not include message2 or message3
        message_contents = [msg['content'] for msg in results]
        self.assertNotIn('Second message', message_contents)
        self.assertNotIn('Third message', message_contents)
    
    def test_get_messages_invalid_before(self):
        """Test retrieving messages with invalid before timestamp"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f'/api/rooms/{self.room.id}/messages/',
            {'before': 'invalid-timestamp'}
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)
    
    def test_get_messages_limit_max(self):
        """Test limit is capped at 200"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f'/api/rooms/{self.room.id}/messages/',
            {'limit': 1000}  # Exceeds max
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should be capped at 200, but we only have 3 messages
        self.assertEqual(len(response.data['results']), 3)
    
    def test_get_messages_limit_min(self):
        """Test limit is minimum 1"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(
            f'/api/rooms/{self.room.id}/messages/',
            {'limit': 0}  # Below minimum
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should use default or minimum 1
        self.assertGreaterEqual(len(response.data['results']), 1)

