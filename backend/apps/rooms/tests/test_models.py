from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.rooms.models import Room

User = get_user_model()


class RoomModelTest(TestCase):
    """Test Room model"""
    
    def setUp(self):
        self.creator = User.objects.create_user(
            email='creator@example.com',
            name='Creator User',
            password='pass123'
        )
    
    def test_room_creation(self):
        """Test creating a room with all fields"""
        room = Room.objects.create(
            name='Test Room',
            description='Test Description',
            creator=self.creator,
            room_type='chat'
        )
        self.assertEqual(room.name, 'Test Room')
        self.assertEqual(room.description, 'Test Description')
        self.assertEqual(room.creator, self.creator)
        self.assertEqual(room.room_type, 'chat')
        self.assertTrue(room.is_active)
        self.assertIsNotNone(room.created_at)
    
    def test_room_str(self):
        """Test Room.__str__ returns formatted string"""
        room = Room.objects.create(
            name='Test Room',
            creator=self.creator,
            room_type='video'
        )
        self.assertEqual(str(room), 'Test Room (Video)')
    
    def test_room_is_active_default(self):
        """Test is_active defaults to True"""
        room = Room.objects.create(
            name='Test Room',
            creator=self.creator
        )
        self.assertTrue(room.is_active)
    
    def test_room_room_type_default(self):
        """Test room_type defaults to 'chat'"""
        room = Room.objects.create(
            name='Test Room',
            creator=self.creator
        )
        self.assertEqual(room.room_type, 'chat')
    
    def test_room_room_type_choices(self):
        """Test room_type choices validation"""
        # Valid choices
        for room_type in ['chat', 'video']:
            room = Room.objects.create(
                name=f'Test Room {room_type}',
                creator=self.creator,
                room_type=room_type
            )
            self.assertEqual(room.room_type, room_type)
        
        # Invalid choice (will be saved but not a valid choice)
        room = Room.objects.create(
            name='Invalid Room',
            creator=self.creator,
            room_type='invalid'
        )
        # get_room_type_display() will return the value if not a valid choice
        self.assertEqual(room.room_type, 'invalid')
    
    def test_room_ordering(self):
        """Test rooms are ordered by created_at descending"""
        room1 = Room.objects.create(
            name='First Room',
            creator=self.creator
        )
        room2 = Room.objects.create(
            name='Second Room',
            creator=self.creator
        )
        rooms = list(Room.objects.all())
        self.assertEqual(rooms[0], room2)  # Most recent first
        self.assertEqual(rooms[1], room1)

