from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.rooms.models import Room
from apps.chat.models import Message
from apps.chat.api.serializers import MessageSerializer, MessageUserSerializer

User = get_user_model()


class MessageSerializerTest(TestCase):
    """Test MessageSerializer"""
    
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
        self.message = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Test message content'
        )
    
    def test_serializer_returns_correct_fields(self):
        """Test serializer returns all message fields"""
        serializer = MessageSerializer(self.message)
        data = serializer.data
        self.assertIn('id', data)
        self.assertIn('user', data)
        self.assertIn('content', data)
        self.assertIn('created_at', data)
        self.assertEqual(data['content'], 'Test message content')
    
    def test_serializer_user_field(self):
        """Test serializer returns user information correctly"""
        serializer = MessageSerializer(self.message)
        data = serializer.data
        user_data = data['user']
        self.assertIn('id', user_data)
        self.assertIn('email', user_data)
        self.assertIn('name', user_data)
        self.assertEqual(user_data['id'], self.user.id)
        self.assertEqual(user_data['email'], 'user@example.com')
        self.assertEqual(user_data['name'], 'Test User')
    
    def test_serializer_with_multiple_messages(self):
        """Test serializer with many=True"""
        message2 = Message.objects.create(
            room=self.room,
            user=self.user,
            content='Second message'
        )
        messages = [self.message, message2]
        serializer = MessageSerializer(messages, many=True)
        data = serializer.data
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]['content'], 'Test message content')
        self.assertEqual(data[1]['content'], 'Second message')


class MessageUserSerializerTest(TestCase):
    """Test MessageUserSerializer"""
    
    def test_serializer_structure(self):
        """Test MessageUserSerializer structure"""
        data = {
            'id': 1,
            'email': 'test@example.com',
            'name': 'Test User'
        }
        serializer = MessageUserSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['id'], 1)
        self.assertEqual(serializer.validated_data['email'], 'test@example.com')
        self.assertEqual(serializer.validated_data['name'], 'Test User')

