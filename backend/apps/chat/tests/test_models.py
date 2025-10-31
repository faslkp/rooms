from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.rooms.models import Room
from apps.chat.models import Message

User = get_user_model()


class MessageModelTest(TestCase):
    """Test Message model"""
    
    def setUp(self):
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
        self.user = User.objects.create_user(
            email='user@example.com',
            name='Test User',
            password='pass123'
        )
        self.room = Room.objects.create(
            name='Test Room',
            creator=self.creator,
            room_type='chat'
        )
    
    def test_message_creation(self):
        """Test creating a message with room, user, and content"""
        message = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Test message content'
        )
        self.assertEqual(message.room, self.room)
        self.assertEqual(message.user, self.user)
        self.assertEqual(message.content, 'Test message content')
        self.assertIsNotNone(message.created_at)
    
    def test_message_str(self):
        """Test Message.__str__ returns formatted string"""
        message = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Test message content that is longer than 30 characters'
        )
        expected = f'{self.user} @ {self.room}: {message.content[:30]}'
        self.assertEqual(str(message), expected)
    
    def test_message_ordering(self):
        """Test messages are ordered by created_at ascending"""
        message1 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='First message'
        )
        # Small delay to ensure different timestamps
        import time
        time.sleep(0.01)
        message2 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Second message'
        )
        messages = list(Message.objects.filter(room=self.room))
        self.assertEqual(messages[0], message1)
        self.assertEqual(messages[1], message2)
    
    def test_message_cascade_delete_room(self):
        """Test message is deleted when room is deleted"""
        message = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Test message'
        )
        self.room.delete()
        self.assertFalse(Message.objects.filter(id=message.id).exists())
    
    def test_message_cascade_delete_user(self):
        """Test message is deleted when user is deleted"""
        message = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Test message'
        )
        self.user.delete()
        self.assertFalse(Message.objects.filter(id=message.id).exists())

